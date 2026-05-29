import ReportForm from "../components/ReportForm";
import { useAuth } from "../context/AuthContext";

export default function ReportPage({ onSave }) {
  const { user } = useAuth();

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--texto-secundario)", marginBottom: 12, textAlign: "center" }}>
        Completá los datos del incidente vial. Se guarda offline y se sincroniza automáticamente.
      </p>
      <ReportForm onSave={onSave} user={user} />
    </div>
  );
}
