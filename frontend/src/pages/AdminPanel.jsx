import { useState, useEffect } from "react";
import { getReports, verifyReport } from "../services/api";

const statusColors = {
  verified: "var(--aprobado)",
  rejected: "var(--rechazado)",
};

export default function AdminPanel() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    getReports("", 100)
      .then((res) => {
        const items = (res.reports || []).map((r) => ({
          ...r,
          payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
          audit: typeof r.audit === "string" ? JSON.parse(r.audit) : r.audit,
        }));
        setReports(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? reports
    : reports.filter((r) => {
        if (filter === "pending") return !r.admin_verification || r.admin_verification === "pending";
        return r.admin_verification === filter;
      });

  async function handleVerify(id, status) {
    setActionMsg("");
    try {
      await verifyReport(id, status);
      setReports((prev) =>
        prev.map((r) => (r.reporte_id === id ? { ...r, admin_verification: status } : r))
      );
      setActionMsg(`Reporte ${id} marcado como ${status === "verified" ? "verificado" : "rechazado"}`);
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { key: "pending", label: "⏳ Pendientes" },
          { key: "verified", label: "✅ Verificados" },
          { key: "rejected", label: "❌ Rechazados" },
          { key: "all", label: "Todos" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="pw-btn-secondary"
            style={{
              flex: 1, minWidth: 100, padding: "8px 12px", fontSize: 12, fontWeight: 600,
              background: filter === f.key ? "var(--bordo)" : "var(--fondo)",
              color: filter === f.key ? "#fff" : "var(--texto-secundario)",
              border: "1px solid var(--borde)", borderRadius: 8, cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div style={{
          padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13,
          background: actionMsg.startsWith("Error") ? "var(--critica)" : "var(--aprobado)",
          color: "#fff",
        }}>
          {actionMsg}
        </div>
      )}

      {loading && <p style={{ textAlign: "center", color: "var(--texto-secundario)", padding: 20 }}>Cargando reportes...</p>}

      {!loading && filtered.length === 0 && (
        <div className="pw-card pw-empty-state">
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p style={{ color: "var(--texto-secundario)", fontSize: 14 }}>
            No hay reportes {filter === "pending" ? "pendientes" : filter === "verified" ? "verificados" : "rechazados"}.
          </p>
        </div>
      )}

      <div className="pw-news-grid">
        {filtered.map((r) => {
          const evento = r.payload?.datos_evento || {};
          const geo = r.payload?.geolocalizacion_reportada || {};
          const meta = r.payload?.metadata_origen || {};
          const audit = r.audit || {};
          const vStatus = r.admin_verification;

          return (
            <div key={r.reporte_id} className="pw-card" style={{
              borderLeftColor: vStatus ? statusColors[vStatus] || "var(--moderada)" : "var(--moderada)",
            }}>
              <div className="pw-card-header">
                <strong style={{ fontSize: 13, color: vStatus ? statusColors[vStatus] : "var(--moderada)" }}>
                  {evento.tipo_incidente || "Sin tipo"}
                </strong>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {audit.clasificacion_urgencia_ia && (
                    <span className={`status-badge status-badge-${audit.clasificacion_urgencia_ia.toLowerCase()}`}>
                      {audit.clasificacion_urgencia_ia}
                    </span>
                  )}
                  {vStatus === "verified" && <span style={{ fontSize: 11, color: "var(--aprobado)", fontWeight: 600 }}>✅ Verificado</span>}
                  {vStatus === "rejected" && <span style={{ fontSize: 11, color: "var(--rechazado)", fontWeight: 600 }}>❌ Rechazado</span>}
                  {!vStatus && <span style={{ fontSize: 11, color: "var(--moderada)", fontWeight: 600 }}>⏳ Pendiente</span>}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--texto-secundario)", marginBottom: 6, lineHeight: 1.5 }}>
                {audit.resumen_tecnico_ia || evento.descripcion_chofer || "Sin descripción"}
              </div>

              <div className="pw-card-body" style={{ fontSize: 12 }}>
                <span>{meta.chofer_id || "?"}{meta.empresa_minera ? ` · ${meta.empresa_minera}` : ""}</span>
                <span>Km {geo.kilometro || "?"} · RN 51</span>
              </div>

              <div style={{ fontSize: 11, color: "var(--texto-secundario)", marginTop: 4 }}>
                Score IA: {Math.round((audit.score_confianza_geografica || 0) * 100)}%
                <span style={{ marginLeft: 8 }}>· {r.reporte_id}</span>
              </div>

              {audit.analisis_coherencia && (
                <div className="pw-card-footer" style={{
                  color: audit.status_verificacion === "APROBADO" ? "var(--aprobado)" : "var(--rechazado)",
                  fontWeight: 500, fontSize: 12,
                }}>
                  {audit.analisis_coherencia}
                </div>
              )}

              {(!vStatus || vStatus === "pending") && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => handleVerify(r.reporte_id, "verified")}
                    className="pw-btn-primary"
                    style={{ flex: 1, padding: "6px 0", fontSize: 12 }}
                  >
                    ✅ Verificar
                  </button>
                  <button
                    onClick={() => handleVerify(r.reporte_id, "rejected")}
                    style={{
                      flex: 1, padding: "6px 0", fontSize: 12, fontWeight: 600,
                      background: "var(--rechazado)", color: "#fff", border: "none",
                      borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    ❌ Rechazar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
