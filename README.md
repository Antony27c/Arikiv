# ViArkiv

Auditoría vial inmutable para la Ruta Nacional 51 — Eje del Litio.

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![ARKIV Braga](https://img.shields.io/badge/ARKIV-Braga%20testnet-8B5CF6)
![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)
![ARKIV SDK](https://img.shields.io/badge/ARKIV%20SDK-0.6.8-8B5CF6)
![License MIT](https://img.shields.io/badge/license-MIT-green)

---

## En una línea

> App mobile-first donde camioneros reportan incidentes en la RN 51 y cada reporte queda almacenado de forma inmutable en ARKIV Network.

---

## ¿Qué es?

La Ruta Nacional 51 en Salta, Argentina, es el corredor logístico del litio más importante del país — pero no tiene ningún sistema digital para reportar accidentes, derrumbes o niebla. Los camioneros que la transitan cada día no tienen forma de avisar a otros sobre los peligros del camino.

**ViArkiv** es una app pensada para esos choferes: permite reportar incidentes desde el celular, incluso sin internet, con la ubicación GPS y una foto. Cada reporte pasa por una auditoría automática con IA que detecta datos falsos y clasifica la urgencia, y después lo verifica un administrador antes de que quede guardado para siempre en la blockchain.

**Vertical del hackathon:** Procedencia e infraestructura de datos — ViArkiv garantiza la procedencia y la inmutabilidad de la trazabilidad de incidentes en la cadena logística del litio.

---

## Demo

| Recurso | URL |
|---------|-----|
| App en producción | [https://arikiv-production.up.railway.app](https://arikiv-production.up.railway.app) |
| Video demo | [Ver demo](https://drive.google.com/file/d/1lBmCD0AsNji8MDTEIk60wB_41N-irY12/view?usp=drive_link) |

---

## Arquitectura

El chofer reporta desde su celular (funciona offline). El backend recibe el reporte, lo audita con IA y lo analiza con Groq, luego lo guarda en SQLite hasta que un administrador lo verifica. Una vez verificado, se escribe en ARKIV Network como registro inmutable. El frontend muestra el feed de incidentes verificados y un mapa interactivo de la RN 51, con la opción de consultar datos directo desde ARKIV sin pasar por el backend.

### Flujo de datos

1. El **chofer** completa un reporte offline (se encola en `localStorage`).
2. Al recuperar conexión, el frontend envía el reporte al backend (`POST /api/reports`).
3. El backend ejecuta la **auditoría de IA** (OpenAI-compatible o reglas Python de fallback) que verifica coherencia geográfica, detecta fraude y clasifica urgencia.
4. Paralelamente, **Groq (Llama 3.3-70B)** genera un análisis cualitativo del incidente.
5. El reporte auditado se persiste en **SQLite** y queda en estado `pending` hasta que un **administrador** lo verifica.
6. Al verificar, el backend firma una transacción y la envía a **ARKIV Network**. El payload completo del reporte + auditoría se almacena como entidad en la testnet Braga.
7. El frontend puede leer los reportes desde la API (que consulta SQLite) y —para consultas directas a ARKIV— mediante el patrón `PROJECT_ATTRIBUTE` del SDK de TypeScript.

---

## Cómo usamos ARKIV

ARKIV es la **capa de verdad definitiva** de ViArkiv: SQLite es un caché de lectura rápida, pero la prueba inmutable de cada reporte vive en la testnet Braga.

### Configuración de red

```python
ARKIV_RPC_URL = "https://braga.hoodi.arkiv.network/rpc"
ARKIV_ADDRESS = "0x0000000000000000000000000000000061726976"
CHAIN_ID = 60138453102  # Braga testnet
```

### PROJECT_ATTRIBUTE

Namespace del proyecto para filtrar entidades en consultas vía SDK:

```typescript
export const PROJECT_ATTRIBUTE = {
  key: "_project",
  value: "rutasegura_rn51",
};
```

### Tipo de entidad

Un solo tipo: `ReporteVial` — un incidente reportado por un chofer, auditado por IA y verificado por un administrador.

### Esquema de atributos (payload)

Cada entidad `ReporteVial` almacena un payload JSON con atributos anidados:

| Campo | Tipo ARKIV | Descripción |
|-------|-----------|-------------|
| `reporte_id` | texto | Identificador único del reporte (ej. `RP-1712345601`) |
| `metadata_origen.chofer_id` | texto | ID del chofer que reporta (ej. `CHO-001`) |
| `metadata_origen.empresa_minera` | texto | Empresa minera asociada al transporte |
| `metadata_origen.patente_camion` | texto | Patente del camión |
| `metadata_origen.timestamp_offline` | texto | Marca de tiempo ISO-8601 capturada offline |
| `geolocalizacion_reportada.ruta` | texto | `"Ruta Nacional 51"` |
| `geolocalizacion_reportada.kilometro` | numérico | Kilómetro aproximado sobre RN 51 |
| `geolocalizacion_reportada.coordenadas.latitud` | numérico | Latitud GPS |
| `geolocalizacion_reportada.coordenadas.longitud` | numérico | Longitud GPS |
| `datos_evento.tipo_incidente` | texto | Tipo: `Derrumbe`, `Neblina`, `Lluvia`, `Bache`, `Accidente`, `Señalización`, `Otro` |
| `datos_evento.descripcion_chofer` | texto | Descripción textual del chofer |
| `datos_evento.imagen_hash_sha256` | texto | Hash SHA-256 de la foto adjunta (opcional) |
| `validacion_ia.agente_id` | texto | `"arkiv-miner-audit-v1"` |
| `validacion_ia.status_verificacion` | texto | `"APROBADO"` / `"RECHAZADO"` |
| `validacion_ia.score_confianza_geografica` | numérico | 0.0 – 1.0 (umbral de rechazo < 0.4) |
| `validacion_ia.resumen_tecnico_ia` | texto | Resumen normalizado por IA |
| `validacion_ia.clasificacion_urgencia_ia` | texto | `CRÍTICA` / `ALTA` / `MODERADA` / `BAJA` |
| `validacion_ia.analisis_coherencia` | texto | Explicación del análisis geográfico |
| `validacion_ia.distancia_ruta_km` | numérico | Distancia del punto reportado a la traza de RN 51 |
| `validacion_ia.direccion` | texto | Dirección reverso-geocodificada |

### Uso de $owner y $creator

- **$creator**: wallet del administrador que firma la transacción (registrada como `from`).
- **$owner**: misma wallet del administrador. Los reportes no se transfieren entre cuentas.
- El chofer no necesita wallet ni pagar gas: la operación on-chain la hace el backend.

### Relaciones entre entidades

Existe un solo tipo (`ReporteVial`). Las relaciones son implícitas en el payload:
- **Chofer ↔ Reportes**: se filtra por `chofer_id` en `metadata_origen`.
- **Reporte ↔ Auditoría**: embebida en `validacion_ia`, no hay entidad separada.

### Lógica de expiración (expiresIn)

El `expiresIn` varía según el tipo de incidente para balancear registro histórico vs. relevancia temporal:

| `tipo_incidente` | `expiresIn` | Justificación |
|---|---|---|
| `Derrumbe`, `Accidente`, `Señalización`, `Bache` | `31536000` (1 año) | Impacto permanente en infraestructura vial |
| `Neblina`, `Lluvia` | `86400` (24 h) | Condiciones climáticas temporales |
| `Otro` (default) | `604800` (7 días) | Duración conservadora para no clasificados |

```python
EXPIRES_IN_MAP = {
    "Derrumbe": 31536000,
    "Accidente": 31536000,
    "Señalización": 31536000,
    "Bache": 31536000,
    "Neblina": 86400,
    "Lluvia": 86400,
}

def get_expires_in(tipo_incidente: str) -> int:
    return EXPIRES_IN_MAP.get(tipo_incidente, 604800)  # default: 7 días
```

### Patrones de query

**Escritura (backend, Python)** — se realiza mediante JSON-RPC directo a la testnet Braga:

```python
from eth_account import Account
import httpx, json

payload = json.dumps({...datos_del_reporte...})
acct = Account.from_key(ARKIV_PRIVATE_KEY)
nonce = rpc_call("eth_getTransactionCount", [acct.address, "latest"])
gas_price = rpc_call("eth_gasPrice", [])

tx = {
    "to": ARKIV_ADDRESS,
    "from": acct.address,
    "value": 0,
    "data": "0x" + payload.encode().hex(),
    "chainId": CHAIN_ID,
    "nonce": nonce,
    "gasPrice": gas_price,
    "gas": 2100000,
}

signed = acct.sign_transaction(tx)
tx_hash = rpc_call("eth_sendRawTransaction", [signed.raw_transaction.hex()])
```

**Lectura (frontend, TypeScript)** — consultas directas a ARKIV mediante el SDK:

```typescript
import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";

const client = createPublicClient({ chain: braga, transport: http() });

const reportes = await client
  .buildQuery()
  .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
  .where(eq("datos_evento.tipo_incidente", "Derrumbe"))
  .withPayload(true)
  .limit(50)
  .fetch();
```

El feed principal consume la API REST del backend (SQLite). Adicionalmente, el frontend implementa **queries directas a ARKIV** mediante un toggle "Ver desde ARKIV" en el feed, que lee entidades directamente de la testnet Braga sin pasar por el backend.

### Escritura on-chain

La escritura en ARKIV Network se realiza mediante un bridge Node.js (`frontend/arkiv-writer.mjs`) que el backend Python invoca como subprocess. Esto resuelve la incompatibilidad entre web3.py y el formato GolemBase que requiere ARKIV. El SDK oficial (`@arkiv-network/sdk`) maneja la construcción y firma de la transacción nativa de ARKIV.

Flujo: el backend construye el payload y atributos → llama `node arkiv-writer.mjs` como subprocess → el script usa `walletClient.createEntity()` del SDK para commitear la entidad en Braga. Si `ARKIV_PRIVATE_KEY` está vacía o falla la escritura, el backend cae a modo simulación (`entity_key=0xSIM_...`, `tx_hash=0xSIM`).

```bash
node arkiv-writer.mjs <private_key> <payload_base64> <expires_in> <attributes_base64>
```

### Funcionalidades avanzadas

No se utiliza `mutateEntities` en la versión actual. El flujo es inmutable append-only: una vez almacenado, un reporte no se modifica. Los cambios de estado administrativos (verified/rejected/pending) se gestionan en SQLite, no en ARKIV.

---

## Setup local

### Requisitos previos

- Python 3.12+
- Node.js 20+
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/viarkiv.git
cd viarkiv
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
venv\Scripts\pip install -r requirements.txt

# Linux/macOS
# source venv/bin/activate
# pip install -r requirements.txt
```

Crear archivo `backend/.env`:

```env
ARKIV_RPC_URL=https://braga.hoodi.arkiv.network/rpc
ARKIV_PRIVATE_KEY=               # Dejar vacío para modo simulación
AI_MODEL_ENDPOINT=https://api.openai.com/v1/chat/completions
AI_MODEL_API_KEY=                # Opcional — sin esto usa reglas Python
GROQ_API_KEY=                    # Opcional — análisis Groq
APP_ENV=development
APP_SECRET_KEY=un-secreto-local
```

Iniciar el servidor:

```bash
venv\Scripts\uvicorn app.main:app --reload
```

El backend queda en `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
```

Crear archivo `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_ARKIV_GATEWAY_URL=https://node.arkiv.network/api/v1
```

Iniciar el dev server:

```bash
npm run dev
```

La app queda en `http://localhost:5173`.

### 4. Docker (alternativa)

```bash
docker compose up --build
```

Esto levanta backend (`:8000`) y frontend (`:5173`) simultáneamente.

### 5. Conectar a ARKIV (producción)

Para salir del modo simulación y escribir realmente en ARKIV Braga testnet:

1. Obtener tokens del faucet: [https://braga.hoodi.arkiv.network/faucet/](https://braga.hoodi.arkiv.network/faucet/)
2. Configurar `ARKIV_PRIVATE_KEY` en `backend/.env` con una private key de Ethereum que tenga fondos en Braga.
3. Verificar transacciones en el explorer: [https://explorer.braga.hoodi.arkiv.network/](https://explorer.braga.hoodi.arkiv.network/)

### Build para producción

```bash
cd frontend
npm run build     # genera frontend/dist/
```

O usando el Dockerfile multi-stage en la raíz:

```bash
docker build -t viarkiv .
docker run -p 8000:8000 viarkiv
```

---

## Usuarios de prueba

Para probar la app sin registrarse, usá estas credenciales:

### Administrador

| Campo | Valor |
|-------|-------|
| Usuario | admin |
| Contraseña | admin123 |

### Choferes de prueba

| Chofer ID | Usuario | Contraseña |
|-----------|---------|-------------|
| CHO-001 | cgomez | pass123 |
| CHO-002 | mlopez | pass123 |
| CHO-003 | jperez | pass123 |
| CHO-004 | atorres | pass123 |
| CHO-005 | psanchez | pass123 |

---

## Flujos principales

### 1. Reportar un incidente (chofer)

El chofer abre la app, completa 4 pasos: identificación (autocompletado con historial local), ubicación (GPS o mapa interactivo con overlay de RN 51), tipo de incidente + descripción + foto, y confirmación. Si no hay conexión, el reporte se encola en `localStorage` y se sincerra automáticamente al recuperar conectividad.

### 2. Auditoría automática con IA

Cada reporte enviado pasa por el motor de auditoría: verificación de coherencia geográfica (bounding box de RN 51 + distancia Haversine), detección de fraudes (coordenadas (0,0), Salta Capital vs. Puna), clasificación de urgencia (CRÍTICA → BAJA), y generación de resumen técnico. Si hay API key configurada, se usa `gpt-4o-mini`; si no, reglas Python de fallback.

### 3. Verificación administrativa

Un administrador accede al panel con pestañas (Pendientes / Verificados / Rechazados / Todos), revisa los detalles del reporte + auditoría + análisis Groq, y decide si verificarlo (dispara el almacenamiento en ARKIV), rechazarlo, o dejarlo pendiente.

### 4. Feed de incidentes (lectura pública)

Cualquier usuario (incluso sin login) puede ver el feed de reportes verificados, agrupados por urgencia, con mapa interactivo, marcador de ubicación, polilínea de RN 51, score de IA, y enlace a la transacción en el explorer de ARKIV.

### 5. Sincronización offline

La app detecta cambios de conectividad con `navigator.onLine`. Cuando el chofer envía un reporte sin conexión, este se almacena en `localStorage` y se reintenta cada 15 segundos (máximo 3 reintentos) hasta que el backend lo recibe.

---

## Equipo

| Nombre | GitHub |
|--------|--------|
| Eduardo Batule | @ |
| Ariel Lamas | @ |
| Gildo Diaz | @ |
| Antonio Chocobar | @ |

---

## Recursos de ARKIV

| Recurso | URL |
|---------|-----|
| RPC Braga | `https://braga.hoodi.arkiv.network/rpc` |
| Chain ID | `60138453102` |
| Faucet | `https://braga.hoodi.arkiv.network/faucet/` |
| Explorer | `https://explorer.braga.hoodi.arkiv.network/` |
| SDK (TypeScript) | `@arkiv-network/sdk` |
| Best practices | [`.agents/skills/arkiv-best-practices/`](.agents/skills/arkiv-best-practices/) |

---

## Licencia

MIT