import json
import os
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone

import jwt as pyjwt

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("JWT_SECRET", "rutasegura-dev-secret-key-cambiar-en-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

DRIVERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "drivers.json")

def _hash_password(password):
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{pwd_hash}"

def _verify_password(password, stored):
    salt, pwd_hash = stored.split(":", 1)
    return hashlib.sha256((salt + password).encode()).hexdigest() == pwd_hash

def _load_drivers():
    if not os.path.exists(DRIVERS_FILE):
        _init_default_drivers()
    with open(DRIVERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_drivers(drivers):
    with open(DRIVERS_FILE, "w", encoding="utf-8") as f:
        json.dump(drivers, f, ensure_ascii=False, indent=2)

def _init_default_drivers():
    default = [
        {"chofer_id": "CHO-001", "nombre": "Carlos Gómez", "username": "cgomez", "password": _hash_password("pass123"), "empresa": "Lithium Americas"},
        {"chofer_id": "CHO-002", "nombre": "María López", "username": "mlopez", "password": _hash_password("pass123"), "empresa": "Sales de Jujuy"},
        {"chofer_id": "CHO-003", "nombre": "Juan Pérez", "username": "jperez", "password": _hash_password("pass123"), "empresa": "Eramine"},
        {"chofer_id": "CHO-004", "nombre": "Ana Torres", "username": "atorres", "password": _hash_password("pass123"), "empresa": "Minera del Altip"},
        {"chofer_id": "CHO-005", "nombre": "Pedro Sánchez", "username": "psanchez", "password": _hash_password("pass123"), "empresa": "Lithium Americas"},
    ]
    _save_drivers(default)

def register_driver(chofer_id, nombre, username, password, empresa=""):
    drivers = _load_drivers()
    if any(d["username"] == username for d in drivers):
        return None, "Usuario ya existe"
    if any(d["chofer_id"] == chofer_id for d in drivers):
        return None, "Código de chofer ya existe"
    driver = {
        "chofer_id": chofer_id,
        "nombre": nombre,
        "username": username,
        "password": _hash_password(password),
        "empresa": empresa,
    }
    drivers.append(driver)
    _save_drivers(drivers)
    return driver, None

def authenticate(username, password):
    drivers = _load_drivers()
    for d in drivers:
        if d["username"] == username and _verify_password(password, d["password"]):
            return d
    return None

def create_token(driver):
    payload = {
        "chofer_id": driver["chofer_id"],
        "nombre": driver["nombre"],
        "empresa": driver.get("empresa", ""),
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token):
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except pyjwt.ExpiredSignatureError:
        return None
    except pyjwt.InvalidTokenError:
        return None

def get_driver_by_id(chofer_id):
    drivers = _load_drivers()
    for d in drivers:
        if d["chofer_id"] == chofer_id:
            return d
    return None

def get_driver_by_username(username):
    drivers = _load_drivers()
    for d in drivers:
        if d["username"] == username:
            return d
    return None
