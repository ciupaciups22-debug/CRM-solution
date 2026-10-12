import re
from datetime import date
from typing import List, Literal, Optional

from fastapi import APIRouter, File, HTTPException, Query, Response, UploadFile
from pymongo.errors import DuplicateKeyError

from lib.dates import today_iso
from lib.db import db
from lib.solution_excel import export_solution, import_solution, max_upload_bytes, safe_filename
from models.client import (
    Client,
    ClientCreate,
    ClientOut,
    ClientUpdate,
    Equipment,
    SolutionSystem,
    SolutionTable,
    normalize_cui,
    solution_summary,
    Stats,
    Visit,
    VisitCreate,
)

router = APIRouter()

OVERDUE_DAYS = 30


def _days_since(last_visit: Optional[str], today: str) -> Optional[int]:
    if not last_visit:
        return None
    return (date.fromisoformat(today) - date.fromisoformat(last_visit)).days


def _to_out(doc: dict, today: str) -> ClientOut:
    c = Client(**doc)
    # Legacy clients stored solution as free text ("Rehau, Elvial"): present it as profile-system columns.
    if not c.solution_table.systems and c.solution.strip():
        names = [s.strip() for s in c.solution.split(",") if s.strip()][:6]
        c.solution_table = SolutionTable(
            systems=[SolutionSystem(id=f"legacy-{i}", name=n) for i, n in enumerate(names)]
        )
    days = _days_since(c.last_visit, today)
    return ClientOut(**c.model_dump(), days_since_visit=days, overdue=days is None or days > OVERDUE_DAYS)


async def _get_or_404(client_id: str) -> dict:
    doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Client not found")
    return doc


async def _refresh_last_visit(client_id: str) -> None:
    latest = await db.visits.find({"client_id": client_id}).sort("date", -1).limit(1).to_list(1)
    count = await db.visits.count_documents({"client_id": client_id})
    await db.clients.update_one(
        {"id": client_id},
        {"$set": {"last_visit": latest[0]["date"] if latest else None, "visit_count": count}},
    )


EQUIPMENT_ROWS = ("cutting", "machining", "welding", "additional")
EQUIPMENT_FIELDS = ("type", "contact_person", "phone")
SEARCH_FIELDS = ("company_name", "cui", "solution", "contact_name", "contact_email", "contact_phone", "address")


async def _search_query(q: str) -> dict:
    """Mongo filter matching q in client fields, equipment cells, or any visit note."""
    if not q.strip():
        return {}
    rx = {"$regex": re.escape(q.strip()), "$options": "i"}
    note_ids = await db.visits.distinct("client_id", {"note": rx})
    return {
        "$or": [
            *[{f: rx} for f in SEARCH_FIELDS],
            *[{f"equipment.{row}.{f}": rx} for row in EQUIPMENT_ROWS for f in EQUIPMENT_FIELDS],
            {"id": {"$in": note_ids}},
        ]
    }


def _matches_filter(c: ClientOut, filter: str) -> bool:
    if filter == "overdue":
        return c.overdue
    if filter == "recent":
        return c.days_since_visit is not None and c.days_since_visit <= 7
    return True


def _sort_clients(items: List[ClientOut], sort: str) -> List[ClientOut]:
    if sort == "name":
        return sorted(items, key=lambda c: c.company_name.lower())
    # never-visited count as oldest
    return sorted(items, key=lambda c: c.last_visit or "0000-00-00", reverse=(sort == "newest"))


@router.get("/clients", response_model=List[ClientOut])
async def list_clients(
    q: str = "",
    filter: Literal["all", "overdue", "recent"] = "all",
    sort: Literal["oldest", "newest", "name"] = "oldest",
):
    today = today_iso()
    docs = await db.clients.find(await _search_query(q), {"_id": 0}).to_list(2000)
    items = [c for c in (_to_out(d, today) for d in docs) if _matches_filter(c, filter)]
    return _sort_clients(items, sort)


CLIENT_EXISTS = "Client exists."


async def _ensure_cui_free(cui_norm: str, exclude_id: Optional[str] = None) -> None:
    query: dict = {"cui_norm": cui_norm}
    if exclude_id:
        query["id"] = {"$ne": exclude_id}
    if await db.clients.find_one(query, {"_id": 1}):
        raise HTTPException(status_code=409, detail=CLIENT_EXISTS)


@router.post("/clients", response_model=ClientOut, status_code=201)
async def create_client(body: ClientCreate):
    cui_norm = normalize_cui(body.cui)
    await _ensure_cui_free(cui_norm)
    c = Client(
        company_name=body.company_name.strip(),
        cui=body.cui,
        solution=solution_summary(body.solution_table or SolutionTable()),
        solution_table=body.solution_table or SolutionTable(),
        address=body.address or "",
        equipment=body.equipment or Equipment(),
        contact_name=body.contact_name or "",
        contact_email=body.contact_email or "",
        contact_phone=body.contact_phone or "",
    )
    try:
        await db.clients.insert_one({**c.model_dump(), "cui_norm": cui_norm})
    except DuplicateKeyError:  # concurrent create with the same CUI
        raise HTTPException(status_code=409, detail=CLIENT_EXISTS)
    return _to_out(c.model_dump(), today_iso())


@router.get("/clients/{client_id}", response_model=ClientOut)
async def get_client(client_id: str):
    return _to_out(await _get_or_404(client_id), today_iso())


@router.put("/clients/{client_id}", response_model=ClientOut)
async def update_client(client_id: str, body: ClientUpdate):
    await _get_or_404(client_id)
    updates = {
        k: (v.strip() if isinstance(v, str) else v)
        for k, v in body.model_dump(exclude_none=True).items()
    }
    if body.cui is not None:
        updates["cui_norm"] = normalize_cui(body.cui)
        await _ensure_cui_free(updates["cui_norm"], exclude_id=client_id)
    if body.solution_table is not None:
        updates["solution"] = solution_summary(body.solution_table)
    if updates:
        try:
            await db.clients.update_one({"id": client_id}, {"$set": updates})
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail=CLIENT_EXISTS)
    return _to_out(await _get_or_404(client_id), today_iso())


@router.delete("/clients/{client_id}", status_code=204)
async def delete_client(client_id: str):
    await _get_or_404(client_id)
    await db.clients.delete_one({"id": client_id})
    await db.visits.delete_many({"client_id": client_id})
    return Response(status_code=204)


@router.get("/clients/{client_id}/visits", response_model=List[Visit])
async def list_visits(client_id: str):
    await _get_or_404(client_id)
    docs = await db.visits.find({"client_id": client_id}, {"_id": 0}).sort(
        [("date", -1), ("created_at", -1)]
    ).to_list(2000)
    return [Visit(**d) for d in docs]


@router.post("/clients/{client_id}/visits", response_model=Visit, status_code=201)
async def log_visit(client_id: str, body: VisitCreate):
    await _get_or_404(client_id)
    today = today_iso()
    visit_date = body.date or today
    try:
        date.fromisoformat(visit_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date")
    if visit_date > today:
        raise HTTPException(status_code=422, detail="Visit date cannot be in the future")
    v = Visit(client_id=client_id, date=visit_date, note=body.note.strip())
    await db.visits.insert_one(v.model_dump())
    await _refresh_last_visit(client_id)
    return v


@router.delete("/clients/{client_id}/visits/{visit_id}", status_code=204)
async def delete_visit(client_id: str, visit_id: str):
    res = await db.visits.delete_one({"id": visit_id, "client_id": client_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    await _refresh_last_visit(client_id)
    return Response(status_code=204)


@router.get("/clients/{client_id}/solution/export")
async def export_solution_xlsx(client_id: str):
    client = _to_out(await _get_or_404(client_id), today_iso())
    if not client.solution_table.systems:
        raise HTTPException(status_code=404, detail="This client has no solution to export")
    content = export_solution(client.solution_table)
    fname = safe_filename(client.company_name)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.post("/clients/{client_id}/solution/import", response_model=ClientOut)
async def import_solution_xlsx(client_id: str, file: UploadFile = File(...)):
    await _get_or_404(client_id)
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=422, detail="Upload an .xlsx file")
    data = await file.read()
    if len(data) > max_upload_bytes():
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")
    try:
        table = import_solution(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    await db.clients.update_one(
        {"id": client_id},
        {"$set": {"solution_table": table.model_dump(), "solution": solution_summary(table)}},
    )
    return _to_out(await _get_or_404(client_id), today_iso())


@router.get("/stats", response_model=Stats)
async def stats():
    today = today_iso()
    docs = await db.clients.find({}, {"_id": 0}).to_list(2000)
    items = [_to_out(d, today) for d in docs]
    month_prefix = today[:7]
    visits_month = await db.visits.count_documents({"date": {"$regex": f"^{month_prefix}"}})
    days = [c.days_since_visit for c in items if c.days_since_visit is not None]
    return Stats(
        today=today,
        total_clients=len(items),
        visits_this_month=visits_month,
        overdue_clients=sum(1 for c in items if c.overdue),
        avg_days_since_visit=round(sum(days) / len(days), 1) if days else None,
        overdue_threshold_days=OVERDUE_DAYS,
    )
