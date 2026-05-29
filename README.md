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
