import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


def _now() -> datetime:
    return datetime.now(timezone.utc)


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EquipmentRow(BaseModel):
    type: str = Field(default="", max_length=300)
    contact_person: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=50)

    @field_validator("type", "contact_person", "phone")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class Equipment(BaseModel):
    cutting: EquipmentRow = Field(default_factory=EquipmentRow)     # Centru de debitare
    machining: EquipmentRow = Field(default_factory=EquipmentRow)   # Centru prelucrare
    welding: EquipmentRow = Field(default_factory=EquipmentRow)     # Centru sudura
    additional: EquipmentRow = Field(default_factory=EquipmentRow)  # Utilaje aditionale


class ContactFields(BaseModel):
    """Optional contact details; empty strings are accepted and stored as "" (clears the field)."""
    address: Optional[str] = Field(default=None, max_length=500)
    equipment: Optional[Equipment] = None
    contact_name: Optional[str] = Field(default=None, max_length=200)
    contact_email: Optional[str] = Field(default=None, max_length=254)
    contact_phone: Optional[str] = Field(default=None, max_length=50)

    @field_validator("address", "contact_name", "contact_email", "contact_phone")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v

    @field_validator("contact_email")
    @classmethod
    def _email(cls, v: Optional[str]) -> Optional[str]:
        if v and not EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v


class SolutionCell(BaseModel):
    value: str = Field(default="", max_length=1000)
    extra: str = Field(default="", max_length=300)  # second dropdown (e.g. Falt on "Ax feronerie / Falt")
    checked: bool = False


class SolutionSystem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(default="", max_length=200)  # Profile system
    cells: Dict[str, SolutionCell] = Field(default_factory=dict)  # keyed by row key


class SolutionTable(BaseModel):
    systems: List[SolutionSystem] = Field(default_factory=list, max_length=6)


def solution_summary(table: SolutionTable) -> str:
    return ", ".join(s.name.strip() for s in table.systems if s.name.strip())


CUI_RE = re.compile(r"^\d{2,10}$")


def normalize_cui(raw: str) -> str:
    """Canonical CUI used for uniqueness: uppercase, no spaces, without the RO (VAT) prefix."""
    s = re.sub(r"\s+", "", raw).upper()
    return s[2:] if s.startswith("RO") else s


def _clean_cui(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    display = re.sub(r"\s+", "", v).upper()
    if not CUI_RE.match(normalize_cui(display)):
        raise ValueError("Invalid CUI (2–10 digits, optional RO prefix)")
    return display


class ClientCreate(ContactFields):
    company_name: str = Field(min_length=1, max_length=200)
    cui: str = Field(min_length=1, max_length=20)
    solution_table: Optional[SolutionTable] = None

    @field_validator("cui")
    @classmethod
    def _cui(cls, v: str) -> str:
        return _clean_cui(v)  # type: ignore[return-value]


class ClientUpdate(ContactFields):
    company_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    cui: Optional[str] = Field(default=None, min_length=1, max_length=20)
    solution_table: Optional[SolutionTable] = None

    @field_validator("cui")
    @classmethod
    def _cui(cls, v: Optional[str]) -> Optional[str]:
        return _clean_cui(v)


class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    cui: str = ""  # display form; uniqueness enforced on normalize_cui() stored as doc["cui_norm"]
    solution: str = ""  # summary derived from profile system names
    solution_table: SolutionTable = Field(default_factory=SolutionTable)
    address: str = ""
    equipment: Equipment = Field(default_factory=Equipment)
    contact_name: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    last_visit: Optional[str] = None  # YYYY-MM-DD, derived from latest visit
    visit_count: int = 0
    created_at: datetime = Field(default_factory=_now)


class ClientOut(Client):
    days_since_visit: Optional[int] = None
    overdue: bool = False


class VisitCreate(BaseModel):
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    note: str = Field(min_length=1, max_length=5000)


class Visit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    date: str  # YYYY-MM-DD
    note: str
    created_at: datetime = Field(default_factory=_now)


class Stats(BaseModel):
    today: str
    total_clients: int
    visits_this_month: int
    overdue_clients: int
    avg_days_since_visit: Optional[float] = None
    overdue_threshold_days: int
