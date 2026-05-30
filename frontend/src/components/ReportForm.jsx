import { useState, useRef, useEffect } from "react";
import AutocompleteInput from "./AutocompleteInput";
import LocationPicker from "./LocationPicker";
import "leaflet/dist/leaflet.css";

const IncidentTypes = [
  "Derrumbe", "Neblina", "Lluvia", "Viento",
  "Accidente", "Bache", "Animal suelto", "Senializacion danada",
  "Corte de ruta", "Otro",
];

const Priorities = [
  { key: "alta", label: "Alta" },
  { key: "moderada", label: "Moderada" },
  { key: "baja", label: "Baja" },
];

const Empresas = [
  "Lithium Americas", "Sales de Jujuy", "Eramine", "Minera del Altip",
  "Tecpetrol", "Pluspetrol", "YPF Litio",
];

const KmsSugeridos = [
  "22", "32", "45", "53", "65", "78", "92", "106", "115", "128",
];

const SECTIONS = [
  { key: "id", label: "Identificacion" },
  { key: "ubicacion", label: "Ubicacion" },
  { key: "incidente", label: "Incidente" },
  { key: "confirmar", label: "Confirmar" },
];

function saveHistory(key, value) {
  if (!value) return;
  try {
    const stored = JSON.parse(localStorage.getItem(`pw_hist_${key}`) || "[]");
    const updated = [value, ...stored.filter(s => s !== value)].slice(0, 15);
    localStorage.setItem(`pw_hist_${key}`, JSON.stringify(updated));
  } catch {}
}

export default function ReportForm({ onSave, user }) {
  const [form, setForm] = useState({
    chofer_id: user?.chofer_id || "",
    empresa_minera: user?.empresa || "",
    patente_camion: "",
    latitud: "",
    longitud: "",
    kilometro: "",
    tipo_incidente: "",
    descripcion_chofer: "",
    prioridad: "moderada",
  });
  const [photo, setPhoto] = useState(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [activeSection, setActiveSection] = useState("id");
  const fileRef = useRef();
  const sectionRefs = {
    id: useRef(),
    ubicacion: useRef(),
    incidente: useRef(),
    confirmar: useRef(),
  };

  useEffect(() => {
    const observers = SECTIONS.map(({ key }) => {
      const el = sectionRefs[key]?.current;
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(key); },
        { rootMargin: "-40% 0px -50% 0px" }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  function setF(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function getLocation() {
    if (!navigator.geolocation) { setGeoStatus("GPS no disponible"); return; }
    setGeoStatus("Buscando senial GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({ ...prev, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) }));
        setGeoStatus("GPS obtenido");
      },
      () => { setGeoStatus("Error al obtener GPS"); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("La foto es muy grande (max 5MB)"); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1024;
        if (img.width <= maxW) { setPhoto(reader.result); return; }
        const ratio = maxW / img.width;
        const c = document.createElement("canvas");
        c.width = maxW; c.height = img.height * ratio;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        setPhoto(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.chofer_id || !form.latitud || !form.longitud || !form.tipo_incidente) {
      alert("Complete chofer, coordenadas y tipo de incidente");
      return;
    }
    saveHistory("chofer", form.chofer_id);
    saveHistory("empresa", form.empresa_minera);
    saveHistory("patente", form.patente_camion);
    saveHistory("kilometro", form.kilometro);
    let imagen_hash = null;
    if (photo) {
      try {
        const buf = new TextEncoder().encode(photo.slice(0, 102400));
        const hash = await crypto.subtle.digest("SHA-256", buf);
        imagen_hash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
      } catch { imagen_hash = null; }
    }
    onSave({
      metadata_origen: { chofer_id: form.chofer_id, empresa_minera: form.empresa_minera || null, patente_camion: form.patente_camion || null, timestamp_offline: new Date().toISOString() },
      geolocalizacion_reportada: { ruta: "Ruta Nacional 51", kilometro: form.kilometro ? parseInt(form.kilometro, 10) : null, coordenadas: { latitud: parseFloat(form.latitud), longitud: parseFloat(form.longitud) } },
      datos_evento: { tipo_incidente: form.tipo_incidente, descripcion_chofer: form.descripcion_chofer, prioridad: form.prioridad, imagen_hash_sha256: imagen_hash || null, fotos: photo ? [{ filename: "capture.jpg", data: photo }] : [] },
    });
    setForm({ chofer_id: "", empresa_minera: "", patente_camion: "", latitud: "", longitud: "", kilometro: "", tipo_incidente: "", descripcion_chofer: "", prioridad: "moderada" });
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="pw-report-form">
      {/* Stepper decorativo */}
      <div className="pw-rf-stepper">
        {SECTIONS.map((s, i) => (
          <span key={s.key} style={{ display: "flex", alignItems: "center" }}>
            <span className={`pw-rf-step ${activeSection === s.key ? "pw-rf-step-active" : ""}`}>
              <span className="pw-rf-step-dot" />
              <span className="pw-rf-step-label">{s.label}</span>
            </span>
            {i < SECTIONS.length - 1 && <span className="pw-rf-step-line" />}
          </span>
        ))}
      </div>

      {/* Seccion 1 - Identificacion */}
      <div ref={sectionRefs.id} className="pw-rf-section">
        <h3 className="pw-block-title">Identificacion</h3>
        <AutocompleteInput placeholder="Nombre del chofer *" value={form.chofer_id}
          onChange={setF("chofer_id")} suggestions={[]} historyKey="chofer" required />
        <div className="pw-row">
          <AutocompleteInput placeholder="Empresa minera" value={form.empresa_minera}
            onChange={setF("empresa_minera")} suggestions={Empresas} historyKey="empresa" style={{ flex: 1 }} />
          <AutocompleteInput placeholder="Patente" value={form.patente_camion}
            onChange={setF("patente_camion")} suggestions={[]} historyKey="patente" style={{ flex: 1 }} />
        </div>
        <div className="pw-rf-divider" />
      </div>

      {/* Seccion 2 - Ubicacion */}
      <div ref={sectionRefs.ubicacion} className="pw-rf-section">
        <h3 className="pw-block-title">Ubicacion</h3>
        <div className="pw-rf-coords-row">
          <input className="pw-input" placeholder="Latitud *" value={form.latitud}
            onChange={setF("latitud")} style={{ flex: 3 }} />
          <input className="pw-input" placeholder="Longitud *" value={form.longitud}
            onChange={setF("longitud")} style={{ flex: 3 }} />
          <button type="button" onClick={getLocation} className="pw-rf-gps-btn" style={{ flex: 2 }}>
            {geoStatus || "GPS"}
          </button>
        </div>
        <div className="pw-map-wrap" style={{ margin: "12px 0" }}>
          <LocationPicker lat={form.latitud ? parseFloat(form.latitud) : null}
            lng={form.longitud ? parseFloat(form.longitud) : null}
            onChange={({ latitud, longitud }) => setForm(prev => ({ ...prev, latitud, longitud }))}
            height={280} />
        </div>
        <AutocompleteInput placeholder="Kilometro" value={form.kilometro}
          onChange={setF("kilometro")} suggestions={KmsSugeridos} historyKey="kilometro"
          type="number" style={{ maxWidth: 120 }} />
        <div className="pw-rf-divider" />
      </div>

      {/* Seccion 3 - Incidente */}
      <div ref={sectionRefs.incidente} className="pw-rf-section">
        <h3 className="pw-block-title">Incidente</h3>
        <div className="pw-rf-chips">
          {IncidentTypes.map(t => (
            <button key={t} type="button"
              className={`pw-rf-chip ${form.tipo_incidente === t ? "pw-rf-chip-active" : ""}`}
              onClick={() => setForm(prev => ({ ...prev, tipo_incidente: t }))}>
              {t}
            </button>
          ))}
        </div>
        <textarea className="pw-input" placeholder="Descripcion del incidente"
          value={form.descripcion_chofer} onChange={setF("descripcion_chofer")} rows={4} />
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhoto} className="pw-input" style={{ marginTop: 8 }} />
        {photo && <img src={photo} alt="" className="pw-preview" />}
        <div className="pw-rf-priority">
          <span className="pw-rf-priority-label">Prioridad:</span>
          {Priorities.map(p => (
            <button key={p.key} type="button"
              className={`pw-rf-prio-btn ${form.prioridad === p.key ? "pw-rf-prio-active" : ""}`}
              onClick={() => setForm(prev => ({ ...prev, prioridad: p.key }))}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="pw-rf-divider" />
      </div>

      {/* Seccion 4 - Confirmar */}
      <div ref={sectionRefs.confirmar} className="pw-rf-section">
        <h3 className="pw-block-title">Confirmar</h3>
        <div className="pw-rf-summary">
          <div className="pw-rf-summary-item">
            <span className="pw-rf-summary-label">Chofer</span>
            <span className="pw-rf-summary-value">{form.chofer_id || "—"}</span>
          </div>
          <div className="pw-rf-summary-item">
            <span className="pw-rf-summary-label">Empresa</span>
            <span className="pw-rf-summary-value">{form.empresa_minera || "—"}</span>
          </div>
          <div className="pw-rf-summary-item">
            <span className="pw-rf-summary-label">Patente</span>
            <span className="pw-rf-summary-value">{form.patente_camion || "—"}</span>
          </div>
          <div className="pw-rf-summary-item">
            <span className="pw-rf-summary-label">Kilometro</span>
            <span className="pw-rf-summary-value">{form.kilometro || "—"}</span>
          </div>
          <div className="pw-rf-summary-item">
            <span className="pw-rf-summary-label">Tipo de incidente</span>
            <span className="pw-rf-summary-value">{form.tipo_incidente || "—"}</span>
          </div>
          <div className="pw-rf-summary-item">
            <span className="pw-rf-summary-label">Prioridad</span>
            <span className="pw-rf-summary-value">{form.prioridad ? Priorities.find(p => p.key === form.prioridad)?.label : "—"}</span>
          </div>
        </div>
        {form.descripcion_chofer && (
          <div style={{ marginTop: 12, fontSize: 13, fontStyle: "italic", color: "var(--texto-sec)", lineHeight: 1.5 }}>
            "{form.descripcion_chofer}"
          </div>
        )}
        {photo && <img src={photo} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", marginTop: 12 }} />}
        <div className="pw-rf-divider" />
      </div>

      {/* Botones de accion */}
      <div className="pw-rf-actions">
        <button type="button" onClick={() => {
          setForm({ chofer_id: "", empresa_minera: "", patente_camion: "", latitud: "", longitud: "", kilometro: "", tipo_incidente: "", descripcion_chofer: "", prioridad: "moderada" });
          setPhoto(null);
        }} className="pw-btn-ghost">Cancelar</button>
        <button type="submit" className="pw-btn-primary" style={{ width: "auto", padding: "12px 32px" }}
          disabled={!form.chofer_id || !form.latitud || !form.longitud || !form.tipo_incidente}>
          Enviar reporte
        </button>
      </div>
    </form>
  );
}
