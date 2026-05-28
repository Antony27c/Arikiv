import { useState, useRef } from "react";

export default function ReportForm({ onSave }) {
  const [form, setForm] = useState({
    latitude: "",
    longitude: "",
    description: "",
    driver_id: "",
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
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGeoStatus("GPS obtenido");
      },
      () => {
        setGeoStatus("Error al obtener GPS");
      },
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.latitude || !form.longitude || !form.driver_id) {
      alert("Completá latitud, longitud y chofer");
      return;
    }
    onSave({
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      timestamp: new Date().toISOString(),
      device_id: navigator.userAgent,
      photos: photo ? [{ filename: "capture.jpg", data: photo }] : [],
    });
    setForm({ latitude: "", longitude: "", description: "", driver_id: "" });
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>Nuevo Reporte</h2>

      <div style={styles.row}>
        <input placeholder="Latitud" value={form.latitude} onChange={set("latitude")} style={styles.input} />
        <input placeholder="Longitud" value={form.longitude} onChange={set("longitude")} style={styles.input} />
      </div>
      <button type="button" onClick={getLocation} style={styles.btnSecondary}>
        {geoStatus || "Obtener GPS"}
      </button>

      <input placeholder="ID del Chofer" value={form.driver_id} onChange={set("driver_id")} style={styles.input} />
      <textarea placeholder="Descripción" value={form.description} onChange={set("description")} rows={3} style={styles.input} />

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={styles.input} />
      {photo && <img src={photo} alt="preview" style={styles.preview} />}

      <button type="submit" style={styles.btnPrimary}>Guardar Localmente</button>
    </form>
  );
}

const styles = {
  form: { display: "flex", flexDirection: "column", gap: 10, maxWidth: 400, margin: "0 auto" },
  title: { fontSize: 18, fontWeight: 700, margin: 0 },
  row: { display: "flex", gap: 8 },
  input: { padding: 8, fontSize: 14, border: "1px solid #ccc", borderRadius: 4 },
  btnPrimary: { padding: "10px 16px", background: "#0055ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 },
  btnSecondary: { padding: "6px 12px", background: "#eee", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" },
  preview: { width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 4 },
};
