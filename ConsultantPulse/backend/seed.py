"""Idempotent demo seed: inserts clients when empty; backfills missing contact fields on seeded clients."""
import asyncio
from datetime import date, timedelta

from lib.dates import today_iso
from lib.db import db, ensure_indexes
from models.client import Client, Visit

# (company, solution, (contact_name, email, phone), [(days_ago, note), ...])
SEED = [
    ("Northwind Logistics", "Kubernetes migration (EKS) + GitOps with ArgoCD", ("Dana Whitfield", "dana.whitfield@northwind.example", "+1 555 010 2030"), [(3, "Reviewed ArgoCD sync waves; staging cluster green."), (24, "Kickoff: inventory of 40 legacy services.")]),
    ("Helios Energy", "Azure landing zone & Terraform governance", ("Marco Bellini", "m.bellini@helios.example", "+44 20 7946 0811"), [(12, "Policy-as-code review, approved naming standards.")]),
    ("Atlas Retail Group", "Event-driven order pipeline on Kafka", ("Priya Raman", "priya@atlasretail.example", "+1 555 014 7788"), [(45, "Partition strategy workshop; backlog for consumer lag alerts."), (80, "Discovery session with platform team.")]),
    ("Meridian Health", "HIPAA security audit & IAM hardening", ("Dr. Samuel Okafor", "sokafor@meridianhealth.example", "+1 555 019 4420"), [(62, "Delivered audit report; 3 high-severity findings.")]),
    ("Quantix Labs", "LLM RAG pipeline with vector search", ("Lena Fischer", "lena@quantix.example", "+49 30 901820"), [(1, "Evaluated embeddings; chose hybrid retrieval."), (9, "Data ingestion design review.")]),
    ("Corvid Fintech", "Microservices observability (OpenTelemetry + Grafana)", ("Jamal Carter", "jamal.carter@corvid.example", ""), []),
]


async def main() -> None:
    await ensure_indexes()
    if await db.clients.count_documents({}) > 0:
        n = 0
        for name, _, (cn, ce, cp), _ in SEED:
            res = await db.clients.update_one(
                {"company_name": name, "contact_name": {"$exists": False}},
                {"$set": {"contact_name": cn, "contact_email": ce, "contact_phone": cp}},
            )
            n += res.modified_count
        print(f"clients already present; backfilled contacts on {n}")
        return
    today = date.fromisoformat(today_iso())
    for name, solution, (cn, ce, cp), visits in SEED:
        c = Client(company_name=name, solution=solution, contact_name=cn, contact_email=ce, contact_phone=cp)
        dates = []
        for days_ago, note in visits:
            d = (today - timedelta(days=days_ago)).isoformat()
            dates.append(d)
            await db.visits.insert_one(Visit(client_id=c.id, date=d, note=note).model_dump())
        c.last_visit = max(dates) if dates else None
        c.visit_count = len(dates)
        await db.clients.insert_one(c.model_dump())
    print(f"seeded {len(SEED)} clients")


if __name__ == "__main__":
    asyncio.run(main())
