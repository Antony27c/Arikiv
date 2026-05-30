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
        const rawUrgency = audit.clasificacion_urgencia_ia || "";
        const urgency = rawUrgency.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";
        const score = Math.round((audit.score_confianza_geografica || 0) * 100);

        const cardClass = urgency === "critica" || urgency === "alta" ? "pw-card-critica"
          : urgency === "moderada" ? "pw-card-moderada" : "pw-card-baja";

        return (
          <div key={r.reporte_id} className={`pw-card ${cardClass}`} style={{ padding: "16px 20px" }}>
            <div className="pw-card-header">
              <span className="pw-card-title" style={{ fontSize: 15 }}>{evento.tipo_incidente || "Sin tipo"}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                {rawUrgency && (
                  <span className={`pw-badge pw-badge-${urgency}`}>{rawUrgency}</span>
                )}
                {vStatus === "verified" && <span className="pw-badge pw-badge-aprobado">Verificado</span>}
                {vStatus === "rejected" && <span className="pw-badge pw-badge-rechazado">Rechazado</span>}
                {(!vStatus || vStatus === "pending") && <span className="pw-badge pw-badge-pendiente">Pendiente</span>}
              </div>
            </div>
            <div className="pw-card-meta">
              <span>{meta.chofer_id || "?"} · {meta.empresa_minera || ""}</span>
              <span className="pw-card-km">Km {geo.kilometro || "?"} · RN 51</span>
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

            {audit.groq_analisis && audit.groq_analisis.tipo && (
              <div style={{ fontSize: 12, marginTop: 8, padding: "8px 10px", background: "rgba(201,168,76,0.08)", borderLeft: "2px solid var(--dorado)", borderRadius: 2 }}>
                <strong style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--texto-sec)" }}>Análisis Groq</strong>
                <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                  <span>Tipo: <strong>{audit.groq_analisis.tipo}</strong></span>
                  <span>Confianza: <strong>{(audit.groq_analisis.confianza * 100).toFixed(0)}%</strong></span>
                  <span style={{ color: audit.groq_analisis.es_fraude ? "var(--rojo)" : "var(--verde)" }}>
                    {audit.groq_analisis.es_fraude ? "⚠ Fraude" : "✓ Válido"}
                  </span>
                  <span style={{ color: audit.groq_analisis.en_zona ? "var(--verde)" : "var(--rojo)" }}>
                    {audit.groq_analisis.en_zona ? "✓ En zona" : "✗ Fuera de zona"}
                  </span>
                </div>
                {audit.groq_analisis.resumen && (
                  <div style={{ fontSize: 12, color: "var(--texto)", marginTop: 4, fontStyle: "italic" }}>
                    {audit.groq_analisis.resumen}
                  </div>
                )}
                {audit.groq_analisis.feedback && (
                  <div style={{ fontSize: 12, color: "var(--bordo)", marginTop: 4, fontStyle: "italic", borderTop: "1px solid rgba(201,168,76,0.3)", paddingTop: 4 }}>
                    {audit.groq_analisis.feedback}
                  </div>
                )}
                {audit.groq_analisis.razon_rechazo && (
                  <div style={{ fontSize: 11, color: "var(--rojo)", marginTop: 2 }}>
                    {audit.groq_analisis.razon_rechazo}
                  </div>
                )}
              </div>
            )}

            {audit.arkiv_tx_hash && audit.arkiv_tx_hash !== "0xERR" && (
              <div style={{ marginTop: 8 }}>
                <button
                  className="pw-btn-masinfo"
                  onClick={() => window.open("https://braga.hoodi.arkiv.network/tx/" + audit.arkiv_tx_hash, "_blank")}
                >
                  ARKIV
                </button>
              </div>
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
