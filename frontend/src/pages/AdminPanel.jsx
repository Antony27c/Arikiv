import { useState, useEffect } from "react";
import { getReports, verifyReport } from "../services/api";

export default function AdminPanel() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    getReports("", 100).then((res) => {
      const items = (res.reports || []).map((r) => ({
        ...r,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
        audit: typeof r.audit === "string" ? JSON.parse(r.audit) : r.audit,
      }));
      setReports(items);
    }).catch(() => {}).finally(() => setLoading(false));
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
      setReports((prev) => prev.map((r) => (r.reporte_id === id ? { ...r, admin_verification: status } : r)));
      const labels = { verified: "verificado", rejected: "rechazado", pending: "pendiente" };
      setActionMsg(`Reporte ${id} → ${labels[status] || status}`);
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  return (
    <div>
      <div className="pw-segmented">
        {[
          { key: "pending", label: "⏳ Pendientes" },
          { key: "verified", label: "✅ Verificados" },
          { key: "rejected", label: "❌ Rechazados" },
          { key: "all", label: "Todos" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`pw-seg-btn ${filter === f.key ? "pw-seg-active" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className={`pw-toast ${actionMsg.startsWith("Error") ? "pw-toast-error" : "pw-toast-success"}`}
          style={{ margin: "0 16px 12px" }}>
          {actionMsg}
        </div>
      )}

      {loading && <p style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>Cargando reportes...</p>}

      {!loading && filtered.length === 0 && (
        <div className="pw-empty">
          <span className="pw-empty-icon">📋</span>
          <p className="pw-empty-title">Sin reportes</p>
          <p className="pw-empty-desc">
            No hay reportes {filter === "pending" ? "pendientes" : filter === "verified" ? "verificados" : "rechazados"}.
          </p>
        </div>
      )}

      {filtered.map((r) => {
        const evento = r.payload?.datos_evento || {};
        const geo = r.payload?.geolocalizacion_reportada || {};
        const meta = r.payload?.metadata_origen || {};
        const audit = r.audit || {};
        const vStatus = r.admin_verification;
        const urgency = audit.clasificacion_urgencia_ia?.toLowerCase() || "";
        const score = Math.round((audit.score_confianza_geografica || 0) * 100);

        const cardClass = urgency === "crítica" || urgency === "alta" ? "pw-card-critica"
          : urgency === "moderada" ? "pw-card-moderada" : "pw-card-baja";

        const emoji = urgency === "crítica" || urgency === "alta" ? "🚨"
          : urgency === "moderada" ? "⚠️" : "✅";

        return (
          <div key={r.reporte_id} className={`pw-card ${cardClass}`}>
            <div className="pw-card-inner">
              <div className="pw-card-top">
                <div className="pw-card-title">
                  <span className="pw-emoji">{emoji}</span>
                  {evento.tipo_incidente || "Sin tipo"}
                </div>
                <div className="pw-card-badges">
                  {audit.clasificacion_urgencia_ia && (
                    <span className={`pw-badge pw-badge-${urgency}`}>{audit.clasificacion_urgencia_ia}</span>
                  )}
                  {vStatus === "verified" && <span className="pw-badge pw-badge-aprobado">✔ Verificado</span>}
                  {vStatus === "rejected" && <span className="pw-badge pw-badge-rechazado">✘ Rechazado</span>}
                  {(!vStatus || vStatus === "pending") && <span className="pw-badge pw-badge-pendiente">⏳ Pendiente</span>}
                </div>
              </div>
              <div className="pw-card-km">📍 Km {geo.kilometro || "?"} · RN 51</div>
              <div className="pw-card-meta">
                <span>👤 {meta.chofer_id || "?"}</span>
                <span>{meta.empresa_minera || ""}</span>
              </div>

              <div style={{ fontSize: 12, color: "var(--text2)", margin: "6px 0", lineHeight: 1.4 }}>
                {audit.resumen_tecnico_ia || evento.descripcion_chofer || "Sin descripción"}
              </div>

              {audit.analisis_coherencia && (
                <div className="pw-card-ai-box" style={{ margin: "6px 0" }}>
                  <span className="pw-ai-icon">🤖</span>
                  <span className="pw-ai-text">{audit.analisis_coherencia}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)" }}>
                  Score: {score}% · {r.reporte_id}
                </span>
              </div>
            </div>

            {(!vStatus || vStatus === "pending") ? (
              <div className="pw-card-actions" style={{ padding: "0 14px 12px" }}>
                <button onClick={() => handleVerify(r.reporte_id, "verified")} className="pw-btn-action pw-btn-verify">
                  ✔ Verificar
                </button>
                <button onClick={() => handleVerify(r.reporte_id, "rejected")} className="pw-btn-action pw-btn-reject">
                  ✘ Rechazar
                </button>
              </div>
            ) : (
              <div className="pw-card-actions" style={{ padding: "0 14px 12px" }}>
                <button onClick={() => handleVerify(r.reporte_id, "pending")} className="pw-btn-action pw-btn-pending">
                  ↩ Volver a pendiente
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
