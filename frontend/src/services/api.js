const BASE = import.meta.env.VITE_BACKEND_URL || "";

function getToken() {
  try {
    const stored = localStorage.getItem("rutasegura_user");
    if (!stored) return null;
    return JSON.parse(stored).token;
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function getReports(tipo = "", limit = 50, verification = "") {
  const params = new URLSearchParams({ limit });
  if (tipo) params.set("tipo", tipo);
  if (verification) params.set("verification", verification);
  const res = await fetch(`${BASE}/api/reports?${params}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitReport(data) {
  const res = await fetch(`${BASE}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function analizarReporte(descripcion, latitud = 0, longitud = 0) {
  const res = await fetch(`${BASE}/api/reportes/analizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ descripcion, latitud, longitud }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function verifyReport(reporteId, status) {
  const res = await fetch(`${BASE}/api/reports/${reporteId}/verify`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
