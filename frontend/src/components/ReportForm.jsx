import { useState, useRef } from "react";
import AutocompleteInput from "./AutocompleteInput";
import LocationPicker from "./LocationPicker";
import "leaflet/dist/leaflet.css";

const IncidentTypes = [
  "Derrumbe", "Bache", "Neblina", "Lluvia", "Animal suelto",
  "Vehículo averiado", "Accidente", "Corte de ruta", "Señalización dañada",
  "Otro",
];

const Empresas = [
  "Lithium Americas", "Sales de Jujuy", "Eramine", "Minera del Altip",
  "Tecpetrol", "Pluspetrol", "YPF Litio",
];

const KmsSugeridos = [
  "22", "32", "45", "53", "65", "78", "92", "106", "115", "128",
];

function saveHistory(key, value) {
  if (!value) return;
  try {
    const stored = JSON.parse(localStorage.getItem(`pw_hist_${key}`) || "[]");
    const updated = [value, ...stored.filter(s => s !== value)].slice(0, 15);
    localStorage.setItem(`pw_hist_${key}`, JSON.stringify(updated));
  } catch {}
}

const STEPS = ["Identificación", "Ubicación", "Incidente", "Confirmar"];

export default function ReportForm({ onSave, user }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    chofer_id: user?.chofer_id || "",
    empresa_minera: user?.empresa || "",
    patente_camion: "",
    latitud: "",
    longitud: "",
    kilometro: "",
    tipo_incidente: "",
    descripcion_chofer: "",
  });
  const [photo, setPhoto] = useState(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [searching, setSearching] = useState(false);
  const fileRef = useRef();

  function setF(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function getLocation() {
    if (!navigator.geolocation) { setGeoStatus("GPS no disponible"); return; }
    setSearching(true);
    setGeoStatus("Buscando señal GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({ ...prev, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) }));
        setGeoStatus("GPS obtenido");
        setSearching(false);
      },
      () => { setGeoStatus("Error al obtener GPS"); setSearching(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("La foto es muy grande (máx 5MB)"); e.target.value = ""; return; }
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

  function canNext() {
    if (step === 0) return form.chofer_id.trim();
    if (step === 1) return form.latitud && form.longitud;
    if (step === 2) return form.tipo_incidente;
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (step < 3) { if (canNext()) setStep(s => s + 1); return; }
    if (!form.chofer_id || !form.latitud || !form.longitud || !form.tipo_incidente) { alert("Completá todos los campos obligatorios"); return; }
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
      datos_evento: { tipo_incidente: form.tipo_incidente, descripcion_chofer: form.descripcion_chofer, imagen_hash_sha256: imagen_hash || null, fotos: photo ? [{ filename: "capture.jpg", data: photo }] : [] },
    });
    setForm({ chofer_id: "", empresa_minera: "", patente_camion: "", latitud: "", longitud: "", kilometro: "", tipo_incidente: "", descripcion_chofer: "" });
    setPhoto(null); setStep(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="pw-stepper">
        {STEPS.map((label, i) => (
          <span key={label} style={{ display: "flex", alignItems: "center" }}>
            <span className={`pw-step ${i === step ? "pw-step-active" : ""} ${i < step ? "pw-step-done" : ""}`}>
              <span className="pw-step-num">{i < step ? "\u2713" : i + 1}</span>
              <span className="pw-step-label">{label}</span>
            </span>
            {i < STEPS.length - 1 && <span className={`pw-step-line ${i < step ? "done" : ""}`} />}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="pw-block">
          <h3 className="pw-block-title">Identificacion</h3>
          <AutocompleteInput placeholder="ID del Chofer *" value={form.chofer_id} onChange={setF("chofer_id")} suggestions={[]} historyKey="chofer" required />
          <div className="pw-row" style={{ flexWrap: "wrap" }}>
            <AutocompleteInput placeholder="Empresa minera" value={form.empresa_minera} onChange={setF("empresa_minera")} suggestions={Empresas} historyKey="empresa" style={{ flex: "1 1 140px" }} />
            <AutocompleteInput placeholder="Patente" value={form.patente_camion} onChange={setF("patente_camion")} suggestions={[]} historyKey="patente" style={{ flex: "1 1 120px" }} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="pw-block">
          <h3 className="pw-block-title">Ubicacion</h3>
          <button type="button" onClick={getLocation} className="pw-btn-primary" style={{ marginBottom: 12 }}>
            {geoStatus || "Obtener ubicacion GPS"}
          </button>
          <div className="pw-row" style={{ flexWrap: "wrap", gap: 12 }}>
            <input className="pw-input" placeholder="Latitud *" value={form.latitud} onChange={setF("latitud")} style={{ flex: "1 1 140px" }} />
            <input className="pw-input" placeholder="Longitud *" value={form.longitud} onChange={setF("longitud")} style={{ flex: "1 1 140px" }} />
          </div>
          <div className="pw-map-wrap" style={{ margin: "12px -20px 0" }}>
            <LocationPicker lat={form.latitud ? parseFloat(form.latitud) : null} lng={form.longitud ? parseFloat(form.longitud) : null}
              onChange={({ latitud, longitud }) => setForm(prev => ({ ...prev, latitud, longitud }))} height={300} />
          </div>
          <AutocompleteInput placeholder="Km aproximado" value={form.kilometro} onChange={setF("kilometro")} suggestions={KmsSugeridos} historyKey="kilometro" type="number" style={{ marginTop: 12, flex: "0 1 120px" }} />
        </div>
      )}

      {step === 2 && (
        <div className="pw-block">
          <h3 className="pw-block-title">Incidente</h3>
          <select className="pw-input" value={form.tipo_incidente} onChange={setF("tipo_incidente")}>
            <option value="">Tipo de incidente *</option>
            {IncidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea className="pw-input" placeholder="Descripcion del incidente" value={form.descripcion_chofer} onChange={setF("descripcion_chofer")} rows={3} />
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="pw-input" />
          {photo && <img src={photo} alt="" className="pw-preview" />}
        </div>
      )}

      {step === 3 && (
        <div className="pw-block">
          <h3 className="pw-block-title">Confirmar</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "var(--texto)" }}>
            <p><strong>Chofer:</strong> {form.chofer_id}{form.empresa_minera ? " / " + form.empresa_minera : ""}</p>
            <p><strong>Ubicacion:</strong> {form.latitud}, {form.longitud}{form.kilometro ? " / Km " + form.kilometro : ""}</p>
            <p><strong>Incidente:</strong> {form.tipo_incidente}</p>
            {form.descripcion_chofer && <p style={{ fontStyle: "italic", color: "var(--texto-sec)" }}>"{form.descripcion_chofer}"</p>}
            {photo && <img src={photo} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover" }} />}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, padding: "0 20px" }}>
        {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)} className="pw-btn-secondary">Anterior</button>}
        <button type="submit" className="pw-btn-primary" disabled={!canNext()}>
          {step < 3 ? "Siguiente" : "Enviar reporte"}
        </button>
      </div>
    </form>
  );
}
