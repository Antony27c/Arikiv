import NuevoReporteMobile from "../components/NuevoReporteMobile";
import { useAuth } from "../context/AuthContext";

export default function ReportPage({ onSave }) {
  const { user } = useAuth();

  return (
    <div>
      <NuevoReporteMobile onSave={onSave} user={user} />
    </div>
  );
}
