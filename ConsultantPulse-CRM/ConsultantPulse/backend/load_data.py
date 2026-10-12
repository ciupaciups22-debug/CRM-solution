"""Loads initial_data.json (your clients exported from the online app) into an EMPTY database.

Safe to run on every start: it does nothing once the database has clients.
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path

from lib.db import db, ensure_indexes
from models.client import normalize_cui

DATA = Path(__file__).parent / "initial_data.json"


def _dt(v):
    if isinstance(v, str):
        try:
            return datetime.fromisoformat(v)
        except ValueError:
            return v
    return v


async def main() -> None:
    await ensure_indexes()
    if await db.clients.count_documents({}) > 0:
        print("Database already has clients - skipping initial data import.")
        return
    if not DATA.exists():
        print("No initial_data.json found - starting with an empty CRM.")
        return
    data = json.loads(DATA.read_text(encoding="utf-8"))
    for c in data.get("clients", []):
        c["created_at"] = _dt(c.get("created_at"))
        if c.get("cui"):
            c["cui_norm"] = normalize_cui(c["cui"])
        await db.clients.insert_one(c)
    for v in data.get("visits", []):
        v["created_at"] = _dt(v.get("created_at"))
        await db.visits.insert_one(v)
    print(f"Imported {len(data.get('clients', []))} clients and {len(data.get('visits', []))} visits.")


if __name__ == "__main__":
    asyncio.run(main())
