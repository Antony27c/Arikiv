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
      setActionMsg(`Reporte ${id} marcado como ${labels[status] || status}`);
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  return (
    <div>
      <div className="pw-tabs">
        {[
          { key: "pending", label: "Pendientes" },
          { key: "verified", label: "Verificados" },
          { key: "rejected", label: "Rechazados" },
          { key: "all", label: "Todos" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`pw-tab ${filter === f.key ? "pw-tab-active" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        {actionMsg && (
          <div className={`pw-toast ${actionMsg.startsWith("Error") ? "pw-toast-error" : "pw-toast-success"}`}>
            {actionMsg}
          </div>
        )}

        {loading && <p style={{ fontSize: 13, color: "var(--texto-sec)", padding: 20 }}>Cargando reportes...</p>}

        {!loading && filtered.length === 0 && (
          <div className="pw-empty">
            <p className="pw-empty-title">Sin reportes</p>
            <p className="pw-empty-desc">
              No hay reportes {filter === "pending" ? "pendientes" : filter === "verified" ? "verificados" : "rechazados"}.
            </p>
          </div>
        )}
      </div>

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

        return (
          <div key={r.reporte_id} className={`pw-card ${cardClass}`} style={{ padding: "16px 20px" }}>
            <div className="pw-card-header">
              <span className="pw-card-title" style={{ fontSize: 15 }}>{evento.tipo_incidente || "Sin tipo"}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                {audit.clasificacion_urgencia_ia && (
                  <span className={`pw-badge pw-badge-${urgency}`}>{audit.clasificacion_urgencia_ia}</span>
                )}
                {vStatus === "verified" && <span className="pw-badge pw-badge-aprobado">Verificado</span>}
                {vStatus === "rejected" && <span className="pw-badge pw-badge-rechazado">Rechazado</span>}
                {(!vStatus || vStatus === "pending") && <span className="pw-badge pw-badge-pendiente">Pendiente</span>}
              </div>
            </div>
            <div className="pw-card-meta">
              <span>{meta.chofer_id || "?"} &middot; {meta.empresa_minera || ""}</span>
              <span className="pw-card-km">Km {geo.kilometro || "?"} &middot; RN 51</span>
            </div>

            <div className="pw-score">
              <span className="pw-score-num">{score}</span>
              <span className="pw-score-label">score IA</span>
              <span style={{ fontSize: 11, color: "var(--texto-sec)", marginLeft: "auto", fontFamily: "var(--font-data)" }}>
                {r.reporte_id}
              </span>
            </div>

            <div style={{ fontSize: 13, color: "var(--texto)", lineHeight: 1.6, margin: "4px 0" }}>
              {audit.resumen_tecnico_ia || evento.descripcion_chofer || "Sin descripcion"}
            </div>

            {audit.analisis_coherencia && (
              <div className="pw-ai-text">{audit.analisis_coherencia}</div>
            )}

            {(!vStatus || vStatus === "pending") ? (
              <div className="pw-card-actions">
                <button onClick={() => handleVerify(r.reporte_id, "verified")} className="pw-btn-action pw-btn-verify">
                  Verificar
                </button>
                <button onClick={() => handleVerify(r.reporte_id, "rejected")} className="pw-btn-action pw-btn-reject">
                  Rechazar
                </button>
              </div>
            ) : (
              <div className="pw-card-actions">
                <button onClick={() => handleVerify(r.reporte_id, "pending")} className="pw-btn-action pw-btn-reset">
                  Volver a pendiente
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
