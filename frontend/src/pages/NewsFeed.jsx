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

export default function NewsFeed({ synced, pending }) {
  const [arkivReports, setArkivReports] = useState([]);
  const [openMaps, setOpenMaps] = useState(new Set());

  function toggleMap(id) {
    setOpenMaps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchVerified);
    };
  }, [synced.length]);

  const arkivItems = arkivReports.map(r => parseArkivReport(r));
  const syncedItems = synced.filter(
    s => !arkivItems.some(a => a._id === s._result?.reporte_id)
  ).map(s => ({ ...s, _synced: true }));
  const sampleItems = sampleNews.map(s => ({ ...s, _sample: true }));
  const all = [...arkivItems, ...syncedItems, ...sampleItems];

  const rechazados = all.filter(s => s._result?.status === "rechazado");
  const noRechazados = all.filter(s => s._result?.status !== "rechazado");

  const altaPrioridad = noRechazados.filter(s => {
    const u = s._result?.validacion_ia?.clasificacion_urgencia_ia;
    return u === "CRÍTICA" || u === "ALTA";
  });
  const prioridadModerada = noRechazados.filter(s => {
    const u = s._result?.validacion_ia?.clasificacion_urgencia_ia;
    return u === "MODERADA";
  });
  const bajaPrioridad = noRechazados.filter(s => {
    const u = s._result?.validacion_ia?.clasificacion_urgencia_ia;
    return !u || u === "BAJA";
  });

  function renderCard(s) {
    const v = s._result?.validacion_ia;
    const a = s._result?.arkiv;
    const meta = s.metadata_origen || {};
    const geo = s.geolocalizacion_reportada || {};
    const evento = s.datos_evento || {};
    const statusKey = s._result?.status || "aprobado";
    const coords = geo.coordenadas;
    const hasCoords = coords?.latitud && coords?.longitud;
    const mapOpen = openMaps.has(s._id);
    const tileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    return (
      <div key={s._id} className="pw-card" style={{
        borderLeftColor: statusColors[statusKey] || "var(--aprobado)",
      }}>
        <div className="pw-card-header">
          <strong style={{ fontSize: 13, color: statusColors[statusKey] || "var(--aprobado)" }}>
            {evento.tipo_incidente || "Incidente"}
          </strong>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {v?.clasificacion_urgencia_ia && (
              <span className={`status-badge status-badge-${v.clasificacion_urgencia_ia.toLowerCase()}`}>
                {v.clasificacion_urgencia_ia}
              </span>
            )}
            <span className={`verification-badge verification-badge-${statusKey}`}>
              {statusKey === "aprobado" ? "APROBADO" : "RECHAZADO"}
            </span>
            {s._sample && (
              <span style={{
                fontSize: 9, padding: "1px 6px", borderRadius: 8,
                background: "var(--fondo)", color: "var(--texto-secundario)", fontWeight: 500,
              }}>
                EJEMPLO
              </span>
            )}
            {s._synced && (
              <span style={{
                fontSize: 9, padding: "1px 6px", borderRadius: 8,
                background: "var(--moderada)", color: "#fff", fontWeight: 500,
              }}>
                PENDIENTE
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--texto-secundario)", marginBottom: 6, lineHeight: 1.5 }}>
          {v?.resumen_tecnico_ia || evento.descripcion_chofer || "Sin descripción"}
        </div>

        <div className="pw-card-body" style={{ fontSize: 12 }}>
          <span>{meta.chofer_id}{meta.empresa_minera ? ` · ${meta.empresa_minera}` : ""}</span>
          <span>Km {geo.kilometro || "?"} · RN 51</span>
        </div>

        {v?.direccion && (
          <div style={{ fontSize: 11, color: "var(--texto-secundario)", marginBottom: 4, lineHeight: 1.4, padding: "4px 0", borderTop: "1px solid var(--borde)", marginTop: 4 }}>
            📍 {v.direccion}
          </div>
        )}

        {v?.analisis_coherencia && (
          <div className="pw-card-footer" style={{
            color: statusKey === "aprobado" ? "var(--aprobado)" : "var(--rechazado)",
            fontWeight: 500,
          }}>
            {v.analisis_coherencia}
          </div>
        )}

        <div className="pw-card-body" style={{ marginTop: 6, fontSize: 11, color: "var(--texto-secundario)", alignItems: "center" }}>
          <span>
            Score: {Math.round((v?.score_confianza_geografica || 0) * 100)}%
            {v?.distancia_ruta_km !== undefined && v?.distancia_ruta_km !== null && (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                · {v.distancia_ruta_km} km de RN 51
              </span>
            )}
          </span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {a?.simulated ? "🔬 Simulado" : "🔗 ARKIV"}
            {hasCoords && (
              <button onClick={() => toggleMap(s._id)} style={{
                background: "none", border: "1px solid var(--borde)", borderRadius: 6,
                padding: "4px 8px", fontSize: 11, cursor: "pointer", fontWeight: 500,
                color: mapOpen ? "var(--bordo)" : "var(--texto-secundario)",
              }}>
                {mapOpen ? "✕ Cerrar mapa" : "📍 Mapa"}
              </button>
            )}
          </span>
        </div>

        {mapOpen && hasCoords && (
          <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", height: 220 }}>
            <MapContainer
              center={[coords.latitud, coords.longitud]}
              zoom={11}
              style={{ width: "100%", height: "100%" }}
              zoomControl={true}
              attributionControl={false}
            >
              <MapResize />
              <TileLayer url={tileUrl} />
              <Rn51Route />
              <Marker position={[coords.latitud, coords.longitud]}>
                <Popup>
                  Km {geo.kilometro || "?"} · RN 51<br />
                  {evento.tipo_incidente}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {all.length === 0 && pending.length === 0 && (
        <div className="pw-card pw-empty-state">
          <p style={{ fontSize: 32, marginBottom: 8 }}>📡</p>
          <p style={{ color: "var(--texto-secundario)", fontSize: 14 }}>No hay incidentes reportados aún.</p>
          <p style={{ color: "var(--texto-secundario)", fontSize: 13, marginTop: 4 }}>Reportá el primero desde "Reportar"</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="pw-section">
          <h3 className="pw-section-title">Pendientes de envío</h3>
          {pending.map((p) => (
            <div key={p._id} className="pw-card" style={{ borderLeftColor: "var(--moderada)", opacity: 0.8 }}>
              <div className="pw-card-header">
                <strong style={{ fontSize: 13 }}>{p.metadata_origen?.chofer_id}</strong>
                <span style={{ fontSize: 11, color: "var(--moderada)", fontWeight: 600 }}>OFFLINE</span>
              </div>
              <div className="pw-card-body">
                <span>{p.datos_evento?.tipo_incidente}</span>
                <span>Km {p.geolocalizacion_reportada?.kilometro || "?"}</span>
              </div>
              <div className="pw-card-footer">
                {p.geolocalizacion_reportada?.coordenadas?.latitud?.toFixed(4)}, {p.geolocalizacion_reportada?.coordenadas?.longitud?.toFixed(4)}
              </div>
            </div>
          ))}
        </section>
      )}

      {all.length > 0 && (
        <>
          <section className="pw-section">
            <h3 className="pw-section-title">🔴 Alta prioridad</h3>
            <div className="pw-news-grid">
              {altaPrioridad.map(s => renderCard(s))}
              {altaPrioridad.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--texto-secundario)", gridColumn: "1 / -1" }}>Sin incidentes de alta prioridad.</p>
              )}
            </div>
          </section>

          <section className="pw-section">
            <h3 className="pw-section-title">🟡 Prioridad moderada</h3>
            <div className="pw-news-grid">
              {prioridadModerada.map(s => renderCard(s))}
              {prioridadModerada.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--texto-secundario)", gridColumn: "1 / -1" }}>Sin incidentes de prioridad moderada.</p>
              )}
            </div>
          </section>

          <section className="pw-section">
            <h3 className="pw-section-title">🟢 Baja prioridad</h3>
            <div className="pw-news-grid">
              {bajaPrioridad.map(s => renderCard(s))}
              {bajaPrioridad.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--texto-secundario)", gridColumn: "1 / -1" }}>Sin incidentes de baja prioridad.</p>
              )}
            </div>
          </section>

          <section className="pw-section">
            <h3 className="pw-section-title">⛔ Rechazados</h3>
            <div className="pw-news-grid">
              {rechazados.map(s => renderCard(s))}
              {rechazados.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--texto-secundario)", gridColumn: "1 / -1" }}>Sin incidentes rechazados.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
