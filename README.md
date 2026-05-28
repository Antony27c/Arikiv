# PunaPulse

Auditoría vial inmutable para la Ruta Nacional 51 (Salta, Argentina) — Eje del Litio.

## Stack

- **Frontend:** React + Vite (offline-first con localStorage)
- **Backend:** Python FastAPI
- **IA:** Auditoría geográfica + detección de fraudes
- **Almacenamiento inmutable:** ARKIV Network (Data Availability Layer)

## Requisitos

- Python 3.12+
- Node.js 20+

## Inicio rápido

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
