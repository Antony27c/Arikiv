import { useState, useRef } from "react";

const IncidentTypes = [
  "Derrumbe", "Bache", "Neblina", "Lluvia", "Animal suelto",
  "Vehículo averiado", "Accidente", "Corte de ruta", "Señalización dañada",
  "Otro",
];

export default function ReportForm({ onSave }) {
  const [form, setForm] = useState({
    chofer_id: "",
    empresa_minera: "",
    patente_camion: "",
    latitud: "",
    longitud: "",
    kilometro: "",
    tipo_incidente: "",
    descripcion_chofer: "",
  });
  const [photo, setPhoto] = useState(null);
  const [geoStatus, setGeoStatus] = useState("");

  const fileRef = useRef();

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("GPS no disponible");
      return;
    }
    setGeoStatus("Obteniendo GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitud: pos.coords.latitude.toFixed(6),
          longitud: pos.coords.longitude.toFixed(6),
        }));
        setGeoStatus("GPS obtenido");
      },
      () => setGeoStatus("Error al obtener GPS"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.chofer_id || !form.latitud || !form.longitud || !form.tipo_incidente) {
      alert("Completá chofer, coordenadas y tipo de incidente");
      return;
    }

    let imagen_hash = "";
    if (photo) {
      const buf = new TextEncoder().encode(photo);
      const hash = await crypto.subtle.digest("SHA-256", buf);
      imagen_hash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    }

    onSave({
      metadata_origen: {
        chofer_id: form.chofer_id,
        empresa_minera: form.empresa_minera || null,
        patente_camion: form.patente_camion || null,
        timestamp_offline: new Date().toISOString(),
      },
      geolocalizacion_reportada: {
        ruta: "Ruta Nacional 51",
        kilometro: form.kilometro ? parseInt(form.kilometro, 10) : null,
        coordenadas: {
          latitud: parseFloat(form.latitud),
          longitud: parseFloat(form.longitud),
        },
      },
      datos_evento: {
        tipo_incidente: form.tipo_incidente,
        descripcion_chofer: form.descripcion_chofer,
        imagen_hash_sha256: imagen_hash || null,
        fotos: photo ? [{ filename: "capture.jpg", data: photo }] : [],
      },
    });

    setForm({
      chofer_id: "", empresa_minera: "", patente_camion: "",
      latitud: "", longitud: "", kilometro: "",
      tipo_incidente: "", descripcion_chofer: "",
    });
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="pw-form">
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#1a1a2e" }}>Nuevo Reporte Vial</h2>

      <div className="pw-block">
        <h3 className="pw-block-title">Chofer / Empresa</h3>
        <input className="pw-input" placeholder="ID del Chofer *" value={form.chofer_id} onChange={set("chofer_id")} />
        <div className="pw-row" style={{ flexWrap: "wrap" }}>
          <input className="pw-input" placeholder="Empresa minera" value={form.empresa_minera} onChange={set("empresa_minera")} style={{ flex: "1 1 140px" }} />
          <input className="pw-input" placeholder="Patente" value={form.patente_camion} onChange={set("patente_camion")} style={{ flex: "1 1 120px" }} />
        </div>
      </div>

      <div className="pw-block">
        <h3 className="pw-block-title">Ubicación</h3>
        <div className="pw-row" style={{ flexWrap: "wrap" }}>
          <input className="pw-input" placeholder="Latitud" value={form.latitud} onChange={set("latitud")} style={{ flex: "1 1 140px" }} />
          <input className="pw-input" placeholder="Longitud" value={form.longitud} onChange={set("longitud")} style={{ flex: "1 1 140px" }} />
        </div>
        <div className="pw-row" style={{ flexWrap: "wrap" }}>
          <button type="button" onClick={getLocation} className="pw-btn-secondary" style={{ flex: "1 1 160px" }}>
            {geoStatus || "Obtener GPS"}
          </button>
          <input className="pw-input" placeholder="Km" value={form.kilometro} onChange={set("kilometro")} type="number" style={{ flex: "0 1 100px" }} />
        </div>
      </div>

      <div className="pw-block">
        <h3 className="pw-block-title">Incidente</h3>
        <select className="pw-input" value={form.tipo_incidente} onChange={set("tipo_incidente")}>
          <option value="">Tipo de incidente *</option>
          {IncidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea className="pw-input" placeholder="Descripción del chofer" value={form.descripcion_chofer} onChange={set("descripcion_chofer")} rows={3} />
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="pw-input" />
        {photo && <img src={photo} alt="preview" className="pw-preview" />}
      </div>

      <button type="submit" className="pw-btn-primary">Guardar Localmente</button>
    </form>
  );
}
