import { useState, useRef } from "react";
import AutocompleteInput from "./AutocompleteInput";
import LocationPicker from "./LocationPicker";
import "leaflet/dist/leaflet.css";

const ChipsMain = [
  "Derrumbe", "Neblina", "Lluvia", "Viento",
  "Accidente", "Otro",
];

const ChipsExtra = [
  "Bache", "Animal suelto", "Corte de ruta",
  "Senializacion danada", "Vehiculo averiado",
  "Incendio", "Inundacion", "Desprendimiento",
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

export default function NuevoReporteMobile({ onSave, user }) {
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
  const [showExtra, setShowExtra] = useState(false);
  const [customTipo, setCustomTipo] = useState("");
  const fileRef = useRef();

  function setF(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function getLocation() {
    if (!navigator.geolocation) { setGeoStatus("GPS no disponible"); return; }
    setGeoStatus("Buscando senal...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({ ...prev, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) }));
        setGeoStatus("GPS obtenido");
      },
      () => setGeoStatus("Error GPS"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Foto muy grande (max 5MB)"); e.target.value = ""; return; }
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
      datos_evento: { tipo_incidente: form.tipo_incidente, descripcion_chofer: form.descripcion_chofer, imagen_hash_sha256: imagen_hash || null, fotos: photo ? [{ filename: "capture.jpg", data: photo }] : [] },
    });
        setForm({ chofer_id: "", empresa_minera: "", patente_camion: "", latitud: "", longitud: "", kilometro: "", tipo_incidente: "", descripcion_chofer: "" });
    setPhoto(null); setShowExtra(false); setCustomTipo("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="pw-mrf">
      {/* Seccion 1 - Identificacion */}
      <div className="pw-mrf-section">
        <h3 className="pw-mrf-label">Identificacion</h3>
        <AutocompleteInput placeholder="Nombre del chofer" value={form.chofer_id}
          onChange={setF("chofer_id")} suggestions={[]} historyKey="chofer" required />
        <div className="pw-mrf-row">
          <AutocompleteInput placeholder="Empresa" value={form.empresa_minera}
            onChange={setF("empresa_minera")} suggestions={Empresas} historyKey="empresa" />
          <AutocompleteInput placeholder="Patente" value={form.patente_camion}
            onChange={setF("patente_camion")} suggestions={[]} historyKey="patente" />
        </div>
        <div className="pw-mrf-divider" />
      </div>

      {/* Seccion 2 - Ubicacion */}
      <div className="pw-mrf-section">
        <h3 className="pw-mrf-label">Ubicacion</h3>
        <div className="pw-mrf-row" style={{ gap: 8 }}>
          <input className="pw-input" placeholder="Latitud" value={form.latitud}
            onChange={setF("latitud")} style={{ flex: 1 }} />
          <input className="pw-input" placeholder="Longitud" value={form.longitud}
            onChange={setF("longitud")} style={{ flex: 1 }} />
        </div>
        <button type="button" onClick={getLocation} className="pw-mrf-gps">
          {geoStatus || "GPS"}
        </button>
        <div className="pw-mrf-map">
          <LocationPicker lat={form.latitud ? parseFloat(form.latitud) : null}
            lng={form.longitud ? parseFloat(form.longitud) : null}
            onChange={({ latitud, longitud }) => setForm(prev => ({ ...prev, latitud, longitud }))}
            height={200} />
        </div>
        <AutocompleteInput placeholder="Km" value={form.kilometro}
          onChange={setF("kilometro")} suggestions={KmsSugeridos} historyKey="kilometro"
          type="number" style={{ maxWidth: 100 }} />
        <div className="pw-mrf-divider" />
      </div>

      {/* Seccion 3 - Tipo de incidente */}
      <div className="pw-mrf-section">
        <h3 className="pw-mrf-label">Tipo de incidente</h3>
        <div className="pw-mrf-chips">
          {ChipsMain.map(t => (
            <button key={t} type="button"
              className={`pw-mrf-chip ${form.tipo_incidente === t ? "pw-mrf-chip-active" : ""} ${t === "Otro" && showExtra ? "pw-mrf-chip-active" : ""}`}
              onClick={() => {
                if (t === "Otro") { setShowExtra(!showExtra); setForm(prev => ({ ...prev, tipo_incidente: "" })); setCustomTipo(""); }
                else { setShowExtra(false); setForm(prev => ({ ...prev, tipo_incidente: t })); setCustomTipo(""); }
              }}>
              {t}
            </button>
          ))}
        </div>

        {showExtra && (
          <div style={{ marginBottom: 16 }}>
            <div className="pw-mrf-chips">
              {ChipsExtra.map(t => (
                <button key={t} type="button"
                  className={`pw-mrf-chip ${form.tipo_incidente === t ? "pw-mrf-chip-active" : ""}`}
                  onClick={() => { setForm(prev => ({ ...prev, tipo_incidente: t })); setCustomTipo(""); }}>
                  {t}
                </button>
              ))}
            </div>
            <input className="pw-input" placeholder="O escribir otro tipo de emergencia..."
              value={customTipo} onChange={e => { setCustomTipo(e.target.value); setForm(prev => ({ ...prev, tipo_incidente: e.target.value })); }}
              style={{ marginTop: 8 }} />
          </div>
        )}

        <textarea className="pw-input" placeholder="Describi el incidente..."
          value={form.descripcion_chofer} onChange={setF("descripcion_chofer")} rows={4} />
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhoto} className="pw-input" style={{ marginTop: 8 }} />
        {photo && <img src={photo} alt="" className="pw-preview" />}
        <div className="pw-mrf-divider" />
      </div>

      {/* Seccion 4 - Confirmar */}
      <div className="pw-mrf-section">
        <h3 className="pw-mrf-label">Confirmar</h3>
        <div className="pw-mrf-summary">
          <div className="pw-mrf-s-item">
            <span className="pw-mrf-s-label">Chofer</span>
            <span className="pw-mrf-s-value">{form.chofer_id || "—"}</span>
          </div>
          <div className="pw-mrf-s-item">
            <span className="pw-mrf-s-label">Empresa</span>
            <span className="pw-mrf-s-value">{form.empresa_minera || "—"}</span>
          </div>
          <div className="pw-mrf-s-item">
            <span className="pw-mrf-s-label">Patente</span>
            <span className="pw-mrf-s-value">{form.patente_camion || "—"}</span>
          </div>
          <div className="pw-mrf-s-item">
            <span className="pw-mrf-s-label">Km</span>
            <span className="pw-mrf-s-value">{form.kilometro || "—"}</span>
          </div>
          <div className="pw-mrf-s-item">
            <span className="pw-mrf-s-label">Tipo</span>
            <span className="pw-mrf-s-value">{form.tipo_incidente || "—"}</span>
          </div>
          <div className="pw-mrf-s-item">
            <span className="pw-mrf-s-label">Descripcion</span>
            <span className="pw-mrf-s-value">{form.descripcion_chofer ? "Si" : "—"}</span>
          </div>
        </div>
        {form.descripcion_chofer && (
          <p style={{ fontSize: 12, fontStyle: "italic", color: "var(--texto-sec)", marginTop: 10, lineHeight: 1.5 }}>
            "{form.descripcion_chofer}"
          </p>
        )}
        {photo && <img src={photo} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", marginTop: 10 }} />}
      </div>

      {/* Botones */}
      <button type="button" onClick={() => {
        setForm({ chofer_id: "", empresa_minera: "", patente_camion: "", latitud: "", longitud: "", kilometro: "", tipo_incidente: "", descripcion_chofer: "" });
        setPhoto(null); setShowExtra(false); setCustomTipo("");
      }} className="pw-mrf-cancel">Cancelar</button>
      <button type="submit" className="pw-mrf-submit"
        disabled={!form.chofer_id || !form.latitud || !form.longitud || !form.tipo_incidente}>
        Enviar reporte
      </button>

      {/* Montanas */}
      <div className="pw-mrf-mountains">
        <svg viewBox="0 0 440 120" preserveAspectRatio="none" style={{ width: "100%", height: 120 }}>
          <polygon points="0,120 40,60 80,90 130,40 180,80 220,30 270,70 320,20 370,60 410,40 440,70 440,120" fill="#E8D5A3" opacity="0.35" />
          <polygon points="0,120 60,80 120,100 180,50 240,80 300,40 360,70 400,50 440,80 440,120" fill="#C9A84C" opacity="0.15" />
          <polygon points="0,120 80,100 160,110 240,80 320,100 440,70 440,120" fill="#6B1A2A" opacity="0.08" />
        </svg>
      </div>
    </form>
  );
}
