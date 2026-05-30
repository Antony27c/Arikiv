import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Rn51Route from "../components/Rn51Route";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getReports, analizarReporte } from "../services/api";
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

export default function NewsFeed({ synced, pending }) {
  const [arkivReports, setArkivReports] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [groqAnalysis, setGroqAnalysis] = useState({});
  const [groqLoading, setGroqLoading] = useState({});

  function toggle(id) {
    setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function handleGroqAnalysis(id, reporte) {
    setGroqLoading(prev => ({ ...prev, [id]: true }));
    try {
      const result = await analizarReporte(reporte);
      setGroqAnalysis(prev => ({ ...prev, [id]: result }));
    } catch {
      setGroqAnalysis(prev => ({ ...prev, [id]: { error: "Error al conectar con Groq" } }));
    } finally {
      setGroqLoading(prev => ({ ...prev, [id]: false }));
    }
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
    const rawUrgency = v?.clasificacion_urgencia_ia || "";
    const urgency = rawUrgency.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";
    const score = Math.round((v?.score_confianza_geografica || 0) * 100);
    const isOpen = expanded.has(s._id);

    const cardClass = urgency === "critica" || urgency === "alta" ? "pw-card-critica"
      : urgency === "moderada" ? "pw-card-moderada"
      : "pw-card-baja";

    return (
      <div key={s._id} className={`pw-card ${cardClass}`}>
        <div onClick={() => toggle(s._id)} style={{ cursor: "pointer" }}>
          <div className="pw-card-header">
            <span className="pw-card-title">{evento.tipo_incidente || "Incidente"}</span>
            <span className={`pw-badge pw-badge-${urgency}`}>
              {rawUrgency || "BAJA"}
            </span>
          </div>
          <div className="pw-card-meta">
            <span>{meta.chofer_id || "?"} · {meta.empresa_minera || "Sin empresa"}</span>
            <span className="pw-card-km">Km {geo.kilometro || "?"} · RN 51</span>
          </div>
          <div className="pw-score">
            <span className="pw-score-num">{score}</span>
            <span className="pw-score-label">score IA</span>
            {v?.distancia_ruta_km !== undefined && (
              <span className="pw-score-km">{v.distancia_ruta_km} km</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button className="pw-btn-masinfo" onClick={(e) => { e.stopPropagation(); toggle(s._id); }}>
              Más Info
            </button>
            <button
              className="pw-btn-masinfo"
              onClick={(e) => { e.stopPropagation(); handleGroqAnalysis(s._id, `${evento.tipo_incidente || ""} — ${v?.resumen_tecnico_ia || evento.descripcion_chofer || ""}`); }}
              disabled={groqLoading[s._id]}
            >
              {groqLoading[s._id] ? "Analizando..." : "Groq IA"}
            </button>
          </div>
          {groqAnalysis[s._id] && groqAnalysis[s._id].analisis && (
            <div style={{ fontSize: 11, color: "var(--texto-sec)", marginTop: 4, padding: "6px 8px", background: "rgba(201,168,76,0.08)", borderRadius: 2 }}>
              <strong>Groq:</strong> {groqAnalysis[s._id].analisis.clasificacion} &middot; Score: {groqAnalysis[s._id].analisis.score_confianza}
              <br />
              {groqAnalysis[s._id].analisis.resumen}
            </div>
          )}
          {groqAnalysis[s._id] && groqAnalysis[s._id].error && (
            <div style={{ fontSize: 11, color: "var(--rojo)", marginTop: 4 }}>Groq: {groqAnalysis[s._id].error}</div>
          )}
          {s._synced && <span className="pw-badge pw-badge-pendiente">Pendiente</span>}
        </div>

        {isOpen && (
          <div style={{ marginTop: 10 }}>
            <div className="pw-card-desc">{v?.resumen_tecnico_ia || evento.descripcion_chofer || "Sin descripción"}</div>
            {v?.direccion && <div style={{ fontSize: 12, color: "var(--texto-sec)", marginBottom: 8 }}>{v.direccion}</div>}

            {v?.analisis_coherencia && (
              <div className="pw-ai-text">{v.analisis_coherencia}</div>
            )}

            <div style={{ fontSize: 12, color: "var(--texto-sec)", marginBottom: 8 }}>
              {a?.simulated ? "Simulado" : "Arkiv"} &middot; {a?.entity_key || ""}
            </div>

            {hasCoords && (
              <div className="pw-map-thumb" onClick={(e) => { e.stopPropagation(); toggle(s._id + "_map"); }}>
                {expanded.has(s._id + "_map") ? (
                  <MapContainer center={[coords.latitud, coords.longitud]} zoom={11}
                    style={{ width: "100%", height: 140 }} zoomControl={false} attributionControl={false}>
                    <TileLayer url={tileUrl} />
                    <Rn51Route />
                    <Marker position={[coords.latitud, coords.longitud]}>
                      <Popup>Km {geo.kilometro || "?"} &middot; RN 51</Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div style={{ height: 140, background: "var(--fondo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--texto-sec)", border: "1px solid var(--borde)" }}>
                    Ver mapa
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
      <div className="pw-page-header">
        <p className="pw-page-subtitle">Auditoria Vial Inmutable — RN 51, Salta</p>
      </div>

      {all.length === 0 && pending.length === 0 && (
        <div className="pw-empty">
          <p className="pw-empty-title">Sin reportes</p>
          <p className="pw-empty-desc">No hay reportes verificados. Aparecen aqui despues de la moderacion.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="pw-section">
          <h3 className="pw-section-title">Pendientes de envio</h3>
          <div className="pw-section-sub">{pending.length} reporte{pending.length !== 1 ? "s" : ""} esperando sincronizacion</div>
          {pending.map((p) => (
            <div key={p._id} className="pw-card pw-card-moderada">
              <div style={{ padding: "4px 0" }}>
                <div className="pw-card-header">
                  <span className="pw-card-title" style={{ fontSize: 15 }}>{p.datos_evento?.tipo_incidente || "Reporte"}</span>
                  <span className="pw-badge pw-badge-pendiente">Offline</span>
                </div>
                <div className="pw-card-meta">
                  <span>{p.metadata_origen?.chofer_id} · {p.metadata_origen?.empresa_minera || ""}</span>
                  <span className="pw-card-km">Km {p.geolocalizacion_reportada?.kilometro || "?"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {all.length > 0 && (
        <>
          <div className="pw-section">
            <h3 className="pw-section-title">Alta prioridad</h3>
            {altaPrioridad.length === 0 && <p className="pw-section-sub">Sin incidentes de alta prioridad.</p>}
            {altaPrioridad.map(s => renderCard(s))}
          </div>

          <div className="pw-section">
            <h3 className="pw-section-title">Prioridad moderada</h3>
            {prioridadModerada.length === 0 && <p className="pw-section-sub">Sin incidentes de prioridad moderada.</p>}
            {prioridadModerada.map(s => renderCard(s))}
          </div>

          <div className="pw-section">
            <h3 className="pw-section-title">Baja prioridad</h3>
            {bajaPrioridad.length === 0 && <p className="pw-section-sub">Sin incidentes de baja prioridad.</p>}
            {bajaPrioridad.map(s => renderCard(s))}
          </div>

          {rechazados.length > 0 && (
            <div className="pw-section">
              <h3 className="pw-section-title">Rechazados</h3>
              {rechazados.map(s => renderCard(s))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
