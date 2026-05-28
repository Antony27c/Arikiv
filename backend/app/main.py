import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

from app.services.ai_audit import audit_report
from app.services.arkiv import store_report

app = FastAPI(title="RutaSegura API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Coordenadas(BaseModel):
    latitud: float
    longitud: float

class Geolocalizacion(BaseModel):
    ruta: str = "Ruta Nacional 51"
    kilometro: Optional[int] = None
    coordenadas: Coordenadas

class Foto(BaseModel):
    filename: str
    data: str

class DatosEvento(BaseModel):
    tipo_incidente: str
    descripcion_chofer: str
    imagen_hash_sha256: Optional[str] = None
    fotos: list[Foto] = []

class MetadataOrigen(BaseModel):
    chofer_id: str
    empresa_minera: Optional[str] = None
    patente_camion: Optional[str] = None
    timestamp_offline: str

class Report(BaseModel):
    reporte_id: Optional[str] = None
    metadata_origen: MetadataOrigen
    geolocalizacion_reportada: Geolocalizacion
    datos_evento: DatosEvento

class AuditResult(BaseModel):
    agente_id: str
    status_verificacion: str
    score_confianza_geografica: float
    resumen_tecnico_ia: str
    clasificacion_urgencia_ia: str
    analisis_coherencia: str
    passed: bool
    flags: list[str]

class ArkivResult(BaseModel):
    entity_key: str
    tx_hash: str
    stored: bool
    simulated: bool
    error: Optional[str] = None

class ReportResponse(BaseModel):
    status: str
    reporte_id: str
    validacion_ia: AuditResult
    arkiv: ArkivResult
    message: str

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "rutasegura-api"}

@app.get("/")
def index():
    return FileResponse("static/index.html")

@app.get("/favicon.svg")
def favicon():
    return FileResponse("static/favicon.svg")

@app.get("/icons.svg")
def icons():
    return FileResponse("static/icons.svg")

@app.post("/api/reports", response_model=ReportResponse)
def submit_report(report: Report):
    reporte_id = report.reporte_id or f"RP-{int(datetime.now().timestamp())}"
    data = report.model_dump()
    audit = audit_report(data)

    arkiv = store_report(data, audit)

    return ReportResponse(
        status=audit["status_verificacion"].lower(),
        reporte_id=reporte_id,
        validacion_ia=AuditResult(**audit),
        arkiv=ArkivResult(**arkiv),
        message="Reporte auditado y almacenado en ARKIV." if arkiv["stored"]
                else "Reporte auditado (almacenamiento pendiente).",
    )

@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno: {str(exc)}"},
    )

app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

@app.exception_handler(404)
def spa_fallback(request, exc):
    return FileResponse("static/index.html")
