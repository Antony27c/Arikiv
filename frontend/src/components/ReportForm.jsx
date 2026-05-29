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
    if (file.size > 5 * 1024 * 1024) {
      alert("La foto es muy grande (máx 5MB)");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1024;
        if (img.width <= maxW) { setPhoto(reader.result); return; }
        const ratio = maxW / img.width;
        const c = document.createElement("canvas");
        c.width = maxW;
        c.height = img.height * ratio;
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
      alert("Completá chofer, coordenadas y tipo de incidente");
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
      } catch {
        imagen_hash = null;
      }
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="pw-block">
        <h3 className="pw-block-title">🚛 Chofer / Empresa</h3>
        <AutocompleteInput
          placeholder="ID del Chofer *"
          value={form.chofer_id}
          onChange={set("chofer_id")}
          suggestions={[]}
          historyKey="chofer"
          required
        />
        <div className="pw-row" style={{ flexWrap: "wrap" }}>
          <AutocompleteInput
            placeholder="Empresa minera"
            value={form.empresa_minera}
            onChange={set("empresa_minera")}
            suggestions={Empresas}
            historyKey="empresa"
            style={{ flex: "1 1 140px" }}
          />
          <AutocompleteInput
            placeholder="Patente"
            value={form.patente_camion}
            onChange={set("patente_camion")}
            suggestions={[]}
            historyKey="patente"
            style={{ flex: "1 1 120px" }}
          />
        </div>
      </div>

      <div className="pw-block">
        <h3 className="pw-block-title">📍 Ubicación</h3>
        <button type="button" onClick={getLocation} className="pw-gps-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
          {geoStatus || "Obtener ubicación actual"}
        </button>
        <div className="pw-row" style={{ flexWrap: "wrap", gap: 8 }}>
          <input className="pw-input" placeholder="Latitud *" value={form.latitud} onChange={set("latitud")} style={{ flex: "1 1 140px" }} />
          <input className="pw-input" placeholder="Longitud *" value={form.longitud} onChange={set("longitud")} style={{ flex: "1 1 140px" }} />
        </div>
        <LocationPicker
          lat={form.latitud ? parseFloat(form.latitud) : null}
          lng={form.longitud ? parseFloat(form.longitud) : null}
          onChange={({ latitud, longitud }) => setForm(prev => ({ ...prev, latitud, longitud }))}
          height={260}
        />
        <div className="pw-row" style={{ flexWrap: "wrap", marginTop: 4 }}>
          <AutocompleteInput
            placeholder="Km aproximado"
            value={form.kilometro}
            onChange={set("kilometro")}
            suggestions={KmsSugeridos}
            historyKey="kilometro"
            type="number"
            style={{ flex: "0 1 120px" }}
          />
        </div>
      </div>

      <div className="pw-block">
        <h3 className="pw-block-title">⚠️ Incidente</h3>
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
