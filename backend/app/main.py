import logging
from fastapi import FastAPI, Request, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

from app.services.ai_audit import audit_report
from app.services.arkiv import store_report, query_reports
from app.services.auth import authenticate, create_token, verify_token, register_driver, get_driver_by_id
from app.services.db import verify_report as db_verify_report

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
    distancia_ruta_km: Optional[float] = None
    direccion: Optional[str] = None

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

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    chofer_id: str
    nombre: str
    empresa: str

class RegisterRequest(BaseModel):
    chofer_id: str
    nombre: str
    username: str
    password: str
    empresa: str = ""

class VerifyRequest(BaseModel):
    status: str

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Formato inválido, usar Bearer <token>")
    token = authorization[7:]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload

@app.post("/api/login", response_model=LoginResponse)
def login(req: LoginRequest):
    driver = authenticate(req.username, req.password)
    if not driver:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_token(driver)
    return LoginResponse(
        token=token,
        chofer_id=driver["chofer_id"],
        nombre=driver["nombre"],
        empresa=driver.get("empresa", ""),
    )

@app.post("/api/register")
def register(req: RegisterRequest):
    driver, error = register_driver(req.chofer_id, req.nombre, req.username, req.password, req.empresa)
    if error:
        raise HTTPException(status_code=400, detail=error)
    token = create_token(driver)
    return LoginResponse(
        token=token,
        chofer_id=driver["chofer_id"],
        nombre=driver["nombre"],
        empresa=driver.get("empresa", ""),
    )

@app.get("/api/reports")
def list_reports(tipo: Optional[str] = None, verification: Optional[str] = None, limit: int = 50):
    data = query_reports(tipo=tipo, limit=limit, verification=verification)
    return {"reports": data, "count": len(data)}

@app.patch("/api/reports/{reporte_id}/verify")
def verify_report_endpoint(reporte_id: str, req: VerifyRequest):
    if req.status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="Estado inválido. Usar 'verified' o 'rejected'")
    ok = db_verify_report(reporte_id, req.status)
    if not ok:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return {"status": "ok", "reporte_id": reporte_id, "admin_verification": req.status}

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
def submit_report(report: Report, user: dict = Depends(get_current_user)):
    if report.metadata_origen.chofer_id != user["chofer_id"]:
        raise HTTPException(status_code=403, detail="El chofer_id del reporte no coincide con el usuario autenticado")
    reporte_id = report.reporte_id or f"RP-{int(datetime.now().timestamp())}"
    data = report.model_dump()
    audit = audit_report(data)

    arkiv = store_report(data, audit, reporte_id=reporte_id)

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
