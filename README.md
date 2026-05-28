# RutaSegura

Auditoría vial inmutable para la Ruta Nacional 51 (Salta, Argentina) — Eje del Litio.

## Stack

- **Frontend:** React + Vite (offline-first con localStorage), react-router
- **Backend:** Python FastAPI + web3.py
- **IA:** Auditoría geográfica + detección de fraudes (OpenAI-compatible o reglas)
- **Almacenamiento inmutable:** ARKIV Network (Data Availability Layer)
- **Infraestructura:** Railway (single service, Docker multi-stage)

## Features

- Reporte offline-first de incidentes viales con GPS y foto
- Feed de noticias con incidentes sincronizados
- Autocompletado con historial local (chofer, empresa, patente, km)
- Auditoría geográfica anti-fraude (IA o reglas)
- Clasificación de urgencia (BAJA/MODERADA/ALTA/CRÍTICA)
- Almacenamiento descentralizado en ARKIV Network
- Responsive mobile-first

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

## Variables de entorno (backend/.env)

```
ARKIV_RPC_URL=https://braga.hoodi.arkiv.network/rpc
ARKIV_PRIVATE_KEY=                # Dejar vacío para modo simulación
AI_MODEL_ENDPOINT=                # OpenAI-compatible (opcional)
AI_MODEL_API_KEY=                 # API key (opcional, fallback a reglas)
```

## Deploy en Railway

```bash
git push
# Railway detecta el Dockerfile en raíz y despliega todo en un servicio
```

## Estructura del proyecto

```
├── Dockerfile              # Multi-stage: frontend (Node) + backend (Python)
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI routes + modelos Pydantic
│   │   └── services/
│   │       ├── ai_audit.py # Motor de auditoría (IA o reglas)
│   │       └── arkiv.py    # Almacenamiento en ARKIV
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router + navegación
│   │   ├── pages/
│   │   │   ├── NewsFeed.jsx # Feed de incidentes
│   │   │   └── ReportPage.jsx
│   │   ├── components/
│   │   │   ├── ReportForm.jsx
│   │   │   └── AutocompleteInput.jsx
│   │   ├── hooks/
│   │   │   └── useOfflineSync.js
│   │   └── services/
│   │       └── api.js
│   ├── Dockerfile
│   └── package.json
└── .agents/skills/arkiv-best-practices/
```
