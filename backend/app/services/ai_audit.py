import math
from datetime import datetime
from typing import Any

RN51_BBOX = {
    "lat_min": -24.5,
    "lat_max": -23.0,
    "lon_min": -66.5,
    "lon_max": -65.5,
}

RECENT_REPORTS: list[dict[str, Any]] = []

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def _validate_coordinates(lat: float, lon: float) -> list[str]:
    issues: list[str] = []
    if not (RN51_BBOX["lat_min"] <= lat <= RN51_BBOX["lat_max"]):
        issues.append("Latitud fuera del corredor RN 51")
    if not (RN51_BBOX["lon_min"] <= lon <= RN51_BBOX["lon_max"]):
        issues.append("Longitud fuera del corredor RN 51")
    if lat == 0.0 and lon == 0.0:
        issues.append("Coordenadas (0,0) — posible GPS sin señal")
    return issues

def _detect_duplicate(lat: float, lon: float, driver_id: str) -> list[str]:
    issues: list[str] = []
    for prev in RECENT_REPORTS:
        if prev["driver_id"] != driver_id:
            continue
        dist = _haversine_km(lat, lon, prev["lat"], prev["lon"])
        if dist < 0.05:
            issues.append("Reporte duplicado a <50m del anterior del mismo chofer")
    return issues

def audit_report(report: dict) -> dict:
    lat = report["latitude"]
    lon = report["longitude"]
    driver_id = report.get("driver_id", "")

    issues: list[str] = []
    issues.extend(_validate_coordinates(lat, lon))
    issues.extend(_detect_duplicate(lat, lon, driver_id))

    trust_score = 100 - len(issues) * 25
    trust_score = max(0, trust_score)

    RECENT_REPORTS.append({
        "driver_id": driver_id,
        "lat": lat,
        "lon": lon,
        "ts": datetime.now().isoformat(),
    })
    if len(RECENT_REPORTS) > 100:
        RECENT_REPORTS.pop(0)

    return {
        "trust_score": trust_score,
        "passed": len(issues) == 0,
        "flags": issues,
    }
