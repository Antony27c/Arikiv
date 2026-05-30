FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ .
RUN npm run build


FROM python:3.12-slim

RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

COPY --from=frontend-build /frontend/dist /app/static
COPY --from=frontend-build /frontend/node_modules /app/frontend/node_modules
COPY --from=frontend-build /frontend/arkiv-writer.mjs /app/frontend/arkiv-writer.mjs
COPY --from=frontend-build /frontend/package.json /app/frontend/package.json

ENV ARKIV_WRITER_CWD=/app/frontend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]