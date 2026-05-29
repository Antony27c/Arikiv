# RutaSegura

Auditoría vial inmutable para la Ruta Nacional 51 (Salta, Argentina) — Eje del Litio.

## Stack

- **Frontend:** React 19 + Vite 8 (offline-first con localStorage), react-router-dom 7
- **Backend:** Python FastAPI + web3.py + SQLite
- **IA:** Auditoría geográfica + detección de fraudes (OpenAI-compatible o reglas Python)
- **Almacenamiento inmutable:** ARKIV Network (Data Availability Layer)
- **Infraestructura:** Railway (single service, Docker multi-stage)

## Features

- Reporte offline-first de incidentes viales con GPS y foto
- Feed de noticias con incidentes sincronizados + consulta directa a ARKIV
- Autocompletado con historial local (chofer, empresa, patente, km)
- Auditoría geográfica anti-fraude (IA vía OpenAI o fallback a reglas Python)
- Clasificación de urgencia (BAJA / MODERADA / ALTA / CRÍTICA)
- Almacenamiento descentralizado en ARKIV Network (con modo simulación sin clave)
- Persistencia en SQLite para visibilidad entre dispositivos
- Responsive mobile-first (idioma español)

## Requisitos

- Python 3.12+
- Node.js 20+

## Inicio rápido (desarrollo local)

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

O con Docker Compose:

```bash
docker compose up --build
```

## ARKIV Network — Almacenamiento Inmutable

Los reportes se almacenan en **ARKIV Network**, una capa de disponibilidad de datos descentralizada sobre Ethereum.

### Entity example (lo que se guarda en ARKIV)

Cada reporte se almacena como una entidad con payload, atributos y expiración. Este proyecto usa el modo **simulación** por defecto (sin private key), pero en producción se escribe directamente en la blockchain:

```typescript
// Cada reporte almacenado contiene:
{
  reporte_id: "RP-1712345601",
  metadata_origen: {
    chofer_id: "CHO-001",
    empresa_minera: "Lithium Americas",
    patente_camion: "AA123BB",
    timestamp_offline: "2026-05-27T08:30:00Z",
  },
  geolocalizacion_reportada: {
    ruta: "Ruta Nacional 51",
    kilometro: 45,
    coordenadas: { latitud: -24.183, longitud: -66.312 },
  },
  datos_evento: {
    tipo_incidente: "Derrumbe",
    descripcion_chofer: "...",
  },
  validacion_ia: {
    agente_id: "arkiv-miner-audit-v1",
    status_verificacion: "APROBADO",
    score_confianza_geografica: 0.92,
    clasificacion_urgencia_ia: "CRÍTICA",
    resumen_tecnico_ia: "...",
    // ...
  },
}
```

### Consulta de reportes

```typescript
import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { PROJECT_ATTRIBUTE } from "@/lib/arkiv";

const client = createPublicClient({ chain: braga, transport: http() });

const result = await client
  .buildQuery()
  .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
  .where(eq("tipo_incidente", "Derrumbe"))
  .withPayload(true)
  .limit(50)
  .fetch();
```

### Testnet ARKIV (Braga)

| Recurso     | URL                                                              |
|-------------|------------------------------------------------------------------|
| RPC         | `https://braga.hoodi.arkiv.network/rpc`                          |
| Chain ID    | `60138453102`                                                    |
| Faucet      | `https://braga.hoodi.arkiv.network/faucet/`                      |
| Explorer    | `https://explorer.braga.hoodi.arkiv.network/`                    |

> 📖 Más detalles en [`.agents/skills/arkiv-best-practices/`](.agents/skills/arkiv-best-practices/)

## Variables de entorno

### Backend (`backend/.env`)

```
ARKIV_RPC_URL=https://braga.hoodi.arkiv.network/rpc
ARKIV_PRIVATE_KEY=                # Dejar vacío para modo simulación
AI_MODEL_ENDPOINT=                # OpenAI-compatible (opcional)
AI_MODEL_API_KEY=                 # API key (opcional, fallback a reglas)
APP_ENV=development
APP_SECRET_KEY=                   # Secreto de aplicación
```

### Frontend (`frontend/.env`)

```
VITE_BACKEND_URL=http://localhost:8000
VITE_MAP_TILE_URL=                # URL de tiles OpenStreetMap (reservado)
VITE_ARKIV_GATEWAY_URL=           # ARKIV gateway para lecturas directas (reservado)
```

## Deploy en Railway

```bash
git push
# Railway detecta el Dockerfile en raíz y despliega todo en un servicio
```

**App en producción:** [https://arikiv-production.up.railway.app](https://arikiv-production.up.railway.app)

## Estructura del proyecto

```
├── Dockerfile                    # Multi-stage: frontend (Node) + backend (Python)
├── docker-compose.yml            # Orquestación local (backend + frontend)
├── backend/
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # FastAPI routes + modelos Pydantic
│       └── services/
│           ├── ai_audit.py       # Motor de auditoría (IA o reglas)
│           ├── arkiv.py          # Almacenamiento en ARKIV Network
│           └── db.py             # Persistencia SQLite
├── frontend/
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf                # Configuración nginx para producción
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx               # Router + navegación offline
│       ├── main.jsx
│       ├── index.css
│       ├── pages/
│       │   ├── NewsFeed.jsx      # Feed de incidentes (ARKIV + locales)
│       │   └── ReportPage.jsx
│       ├── components/
│       │   ├── ReportForm.jsx
│       │   └── AutocompleteInput.jsx
│       ├── hooks/
│       │   └── useOfflineSync.js
│       ├── services/
│       │   └── api.js
│       └── data/
│           └── sampleNews.js     # Datos demo
├── AGENT.md                      # Especificación del agente de IA
└── .agents/
    └── skills/arkiv-best-practices/
```
