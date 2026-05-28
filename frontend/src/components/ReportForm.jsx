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
    <form onSubmit={handleSubmit} style={s.form}>
      <h2 style={s.title}>Nuevo Reporte Vial</h2>

      <div style={s.block}>
        <h3 style={s.blockTitle}>Chofer / Empresa</h3>
        <input placeholder="ID del Chofer *" value={form.chofer_id} onChange={set("chofer_id")} style={s.input} />
        <div style={s.row}>
          <input placeholder="Empresa minera" value={form.empresa_minera} onChange={set("empresa_minera")} style={{ ...s.input, flex: 1 }} />
          <input placeholder="Patente" value={form.patente_camion} onChange={set("patente_camion")} style={{ ...s.input, flex: 1 }} />
        </div>
      </div>

      <div style={s.block}>
        <h3 style={s.blockTitle}>Ubicación</h3>
        <div style={s.row}>
          <input placeholder="Latitud" value={form.latitud} onChange={set("latitud")} style={{ ...s.input, flex: 1 }} />
          <input placeholder="Longitud" value={form.longitud} onChange={set("longitud")} style={{ ...s.input, flex: 1 }} />
        </div>
        <div style={s.row}>
          <button type="button" onClick={getLocation} style={s.btnSecondary}>
            {geoStatus || "Obtener GPS"}
          </button>
          <input placeholder="Km" value={form.kilometro} onChange={set("kilometro")} type="number" style={{ ...s.input, width: 80 }} />
        </div>
      </div>

      <div style={s.block}>
        <h3 style={s.blockTitle}>Incidente</h3>
        <select value={form.tipo_incidente} onChange={set("tipo_incidente")} style={s.input}>
          <option value="">Tipo de incidente *</option>
          {IncidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea placeholder="Descripción del chofer" value={form.descripcion_chofer} onChange={set("descripcion_chofer")} rows={3} style={s.input} />
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={s.input} />
        {photo && <img src={photo} alt="preview" style={s.preview} />}
      </div>

      <button type="submit" style={s.btnPrimary}>Guardar Localmente</button>
    </form>
  );
}

const s = {
  form: {
    display: "flex", flexDirection: "column", gap: 12,
    background: "#fff", padding: 20, borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  title: { fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#1a1a2e" },
  block: {
    display: "flex", flexDirection: "column", gap: 8,
    padding: 12, background: "#f8f9fa", borderRadius: 8,
  },
  blockTitle: { fontSize: 13, fontWeight: 600, margin: 0, color: "#495057", textTransform: "uppercase", letterSpacing: 0.5 },
  row: { display: "flex", gap: 8 },
  input: {
    padding: "8px 10px", fontSize: 14, border: "1px solid #dee2e6",
    borderRadius: 6, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  },
  btnSecondary: {
    padding: "8px 14px", background: "#e9ecef", border: "1px solid #ced4da",
    borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500,
    fontFamily: "inherit",
  },
  btnPrimary: {
    padding: "12px 16px", background: "linear-gradient(135deg, #4361ee, #3a0ca3)",
    color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
    fontWeight: 600, fontSize: 15, fontFamily: "inherit",
  },
  preview: { width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 6 },
};
