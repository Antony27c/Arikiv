import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Rn51Route from "../components/Rn51Route";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getReports } from "../services/api";
import sampleNews from "../data/sampleNews";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapResize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [map]);
  return null;
}

const urgencyColors = {
  CRÍTICA: "var(--critica)",
  ALTA: "var(--alta)",
  MODERADA: "var(--moderada)",
  BAJA: "var(--baja)",
};

const statusColors = {
  aprobado: "var(--aprobado)",
  rechazado: "var(--rechazado)",
  flagged: "var(--alta)",
};

function parseArkivReport(entry) {
  const payload = entry.payload || {};
  const audit = entry.audit || {};
  const txHash = entry.reporte_id || "0xARKIV";
  return {
    _id: txHash,
    _result: {
      status: audit.status_verificacion?.toLowerCase() || "aprobado",
      validacion_ia: audit,
      arkiv: { tx_hash: txHash, simulated: false, stored: true },
    },
    metadata_origen: payload.metadata_origen || {},
    geolocalizacion_reportada: payload.geolocalizacion_reportada || {},
    datos_evento: payload.datos_evento || {},
    _sample: false,
  };
}

function DonutScore({ score }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";
  return (
    <div className="pw-donut">
      <svg viewBox="0 0 40 40" width={44} height={44}>
        <circle className="pw-donut-bg" cx="20" cy="20" r={r} />
        <circle className="pw-donut-fill" cx="20" cy="20" r={r}
          stroke={color} strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span className="pw-donut-label">{score}%</span>
    </div>
  );
}

export default function NewsFeed({ synced, pending }) {
  const [arkivReports, setArkivReports] = useState([]);
  const [expanded, setExpanded] = useState(new Set());

  function toggle(id) {
    setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function fetchVerified() {
    getReports("", 100, "verified").then((res) => {
      setArkivReports(res.reports || []);
    }).catch(() => {});
  }

  useEffect(() => {
    fetchVerified();
    const interval = setInterval(fetchVerified, 30000);
    window.addEventListener("focus", fetchVerified);
    return () => { clearInterval(interval); window.removeEventListener("focus", fetchVerified); };
  }, [synced.length]);

  const arkivItems = arkivReports.map(r => parseArkivReport(r));
  const syncedItems = synced.filter(s => !arkivItems.some(a => a._id === s._result?.reporte_id))
    .map(s => ({ ...s, _synced: true }));
  const sampleItems = sampleNews.map(s => ({ ...s, _sample: true }));
  const all = [...arkivItems, ...syncedItems, ...sampleItems];
  const rechazados = all.filter(s => s._result?.status === "rechazado");
  const noRechazados = all.filter(s => s._result?.status !== "rechazado");
  const altaPrioridad = noRechazados.filter(s => { const u = s._result?.validacion_ia?.clasificacion_urgencia_ia; return u === "CRÍTICA" || u === "ALTA"; });
  const prioridadModerada = noRechazados.filter(s => { const u = s._result?.validacion_ia?.clasificacion_urgencia_ia; return u === "MODERADA"; });
  const bajaPrioridad = noRechazados.filter(s => { const u = s._result?.validacion_ia?.clasificacion_urgencia_ia; return !u || u === "BAJA"; });

  function renderCard(s) {
    const v = s._result?.validacion_ia;
    const a = s._result?.arkiv;
    const meta = s.metadata_origen || {};
    const geo = s.geolocalizacion_reportada || {};
    const evento = s.datos_evento || {};
    const coords = geo.coordenadas;
    const hasCoords = coords?.latitud && coords?.longitud;
    const tileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const urgency = v?.clasificacion_urgencia_ia?.toLowerCase() || "";
    const score = Math.round((v?.score_confianza_geografica || 0) * 100);
    const isOpen = expanded.has(s._id);

    const cardClass = urgency === "crítica" || urgency === "alta" ? "pw-card-critica"
      : urgency === "moderada" ? "pw-card-moderada"
      : "pw-card-baja";

    const emoji = urgency === "crítica" || urgency === "alta" ? "🚨"
      : urgency === "moderada" ? "⚠️"
      : "✅";

    return (
      <div key={s._id} className={`pw-card ${cardClass}`}>
        <div className="pw-card-inner" onClick={() => toggle(s._id)}>
          <div className="pw-card-top">
            <div className="pw-card-title">
              <span className="pw-emoji">{emoji}</span>
              {evento.tipo_incidente || "Incidente"}
            </div>
            <div className="pw-card-badges">
              {v?.clasificacion_urgencia_ia && (
                <span className={`pw-badge pw-badge-${urgency}`}>{v.clasificacion_urgencia_ia}</span>
              )}
              {s._sample && <span className="pw-badge pw-badge-ejemplo">EJEMPLO</span>}
              {s._synced && <span className="pw-badge pw-badge-pendiente">PENDIENTE</span>}
            </div>
          </div>
          <div className="pw-card-km">📍 Km {geo.kilometro || "?"} · RN 51</div>
          <div className="pw-card-meta">
            <span>👤 {meta.chofer_id || "?"}</span>
            <span>{meta.empresa_minera || ""}</span>
          </div>
          {!isOpen && (
            <div className="pw-donut-wrap" style={{ marginTop: 4, marginBottom: 0 }}>
              <DonutScore score={score} />
              <div className="pw-donut-meta">
                <span>Confianza IA</span>
                {v?.distancia_ruta_km !== undefined && <span><strong>{v.distancia_ruta_km} km</strong> de RN 51</span>}
              </div>
            </div>
          )}
        </div>

        {isOpen && (
          <div className="pw-card-expanded">
            <div className="pw-card-desc">{v?.resumen_tecnico_ia || evento.descripcion_chofer || "Sin descripción"}</div>
            {v?.direccion && <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>📍 {v.direccion}</div>}

            <div className="pw-donut-wrap">
              <DonutScore score={score} />
              <div className="pw-donut-meta">
                <span>Confianza IA</span>
                <span>Score geográfico</span>
                {v?.distancia_ruta_km !== undefined && <span><strong>{v.distancia_ruta_km} km</strong> de RN 51</span>}
              </div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)" }}>
                {a?.simulated ? "🔬 Sim" : "🔗 Arkiv"}
              </span>
            </div>

            {v?.analisis_coherencia && (
              <div className="pw-card-ai-box">
                <span className="pw-ai-icon">🤖</span>
                <span className="pw-ai-text">{v.analisis_coherencia}</span>
              </div>
            )}

            {hasCoords && (
              <div className="pw-map-thumb" onClick={(e) => { e.stopPropagation(); toggle(s._id + "_map"); }}>
                {expanded.has(s._id + "_map") ? (
                  <MapContainer center={[coords.latitud, coords.longitud]} zoom={11}
                    style={{ width: "100%", height: 140 }} zoomControl={false} attributionControl={false}>
                    <TileLayer url={tileUrl} />
                    <Rn51Route />
                    <Marker position={[coords.latitud, coords.longitud]}>
                      <Popup>Km {geo.kilometro || "?"} · RN 51</Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div style={{ height: 140, background: "var(--surface2)", borderRadius: "var(--radius-xs)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text3)" }}>
                    📍 Ver mapa
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {all.length === 0 && pending.length === 0 && (
        <div className="pw-empty">
          <span className="pw-empty-icon">📡</span>
          <p className="pw-empty-title">Sin incidentes</p>
          <p className="pw-empty-desc">No hay reportes verificados aún. Los reportes aparecen aquí después de la moderación.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="pw-section">
          <h3 className="pw-section-title" style={{ padding: "0 16px" }}>
            <span className="pw-icon-alert yellow">⏳</span> Pendientes de envío
          </h3>
          {pending.map((p) => (
            <div key={p._id} className="pw-card pw-card-moderada" style={{ opacity: 0.8 }}>
              <div className="pw-card-inner">
                <div className="pw-card-top">
                  <div className="pw-card-title"><span className="pw-emoji">📤</span>{p.datos_evento?.tipo_incidente || "Reporte"}</div>
                  <div className="pw-card-badges"><span className="pw-badge pw-badge-pendiente">OFFLINE</span></div>
                </div>
                <div className="pw-card-km">👤 {p.metadata_origen?.chofer_id} · Km {p.geolocalizacion_reportada?.kilometro || "?"}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {all.length > 0 && (
        <>
          <section className="pw-section">
            <h3 className="pw-section-title">
              <span className="pw-icon-alert red">⚠️</span> Alta prioridad
            </h3>
            <div className="pw-news-grid">
              {altaPrioridad.length === 0 && <p style={{ fontSize: 12, color: "var(--text3)", padding: "0 16px" }}>Sin incidentes de alta prioridad.</p>}
              {altaPrioridad.map(s => renderCard(s))}
            </div>
          </section>

          <section className="pw-section">
            <h3 className="pw-section-title">
              <span className="pw-icon-alert yellow">⚠️</span> Prioridad moderada
            </h3>
            <div className="pw-news-grid">
              {prioridadModerada.length === 0 && <p style={{ fontSize: 12, color: "var(--text3)", padding: "0 16px" }}>Sin incidentes de prioridad moderada.</p>}
              {prioridadModerada.map(s => renderCard(s))}
            </div>
          </section>

          <section className="pw-section">
            <h3 className="pw-section-title">
              <span className="pw-icon-alert green">✅</span> Baja prioridad
            </h3>
            <div className="pw-news-grid">
              {bajaPrioridad.length === 0 && <p style={{ fontSize: 12, color: "var(--text3)", padding: "0 16px" }}>Sin incidentes de baja prioridad.</p>}
              {bajaPrioridad.map(s => renderCard(s))}
            </div>
          </section>

          {rechazados.length > 0 && (
            <section className="pw-section">
              <h3 className="pw-section-title">
                <span className="pw-icon-alert red">⛔</span> Rechazados
              </h3>
              <div className="pw-news-grid">
                {rechazados.map(s => renderCard(s))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
