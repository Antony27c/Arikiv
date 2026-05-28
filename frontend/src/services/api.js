const BASE = import.meta.env.VITE_BACKEND_URL || "";

export async function getReports(tipo = "", limit = 50) {
  const params = new URLSearchParams({ limit });
  if (tipo) params.set("tipo", tipo);
  const res = await fetch(`${BASE}/api/reports?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitReport(data) {
  const res = await fetch(`${BASE}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
