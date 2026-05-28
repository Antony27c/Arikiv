from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.services.ai_audit import audit_report
from app.services.arkiv import store_report

app = FastAPI(title="PunaPulse API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Photo(BaseModel):
    filename: str
    data: str

class Report(BaseModel):
    latitude: float
    longitude: float
    description: str
    timestamp: str
    driver_id: str
    device_id: Optional[str] = None
    photos: list[Photo] = []

class ArkivResult(BaseModel):
    entity_key: str
    tx_hash: str
    stored: bool
    simulated: bool

class AuditResult(BaseModel):
    trust_score: int
    passed: bool
    flags: list[str]

class ReportResponse(BaseModel):
    status: str
    report_id: str
    audit: AuditResult
    arkiv: ArkivResult
    message: str

@app.get("/")
def health():
    return {"status": "ok", "service": "punapulse-api"}

@app.post("/api/reports", response_model=ReportResponse)
def submit_report(report: Report):
    report_id = f"RP-{int(datetime.now().timestamp())}"
    data = report.model_dump()
    audit = audit_report(data)
    arkiv = store_report(data, audit)

    return ReportResponse(
        status="audited" if audit["passed"] else "flagged",
        report_id=report_id,
        audit=AuditResult(**audit),
        arkiv=ArkivResult(**arkiv),
        message="Reporte auditado y almacenado en ARKIV." if arkiv["stored"]
                else "Reporte auditado (almacenamiento pendiente).",
    )
