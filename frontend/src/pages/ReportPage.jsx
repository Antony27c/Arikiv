import ReportForm from "../components/ReportForm";
import { useAuth } from "../context/AuthContext";

export default function ReportPage({ onSave }) {
  const { user } = useAuth();

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--texto-sec)", marginBottom: 16, textAlign: "center" }}>
        Complete los datos del incidente vial. Se guarda offline y se sincroniza automaticamente.
      </p>
      <ReportForm onSave={onSave} user={user} />
    </div>
  );
}
