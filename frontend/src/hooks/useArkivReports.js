import { useState, useEffect, useRef } from "react";
import { queryReports } from "../lib/arkiv";

export function useArkivReports(filters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersRef = useRef(filters);

  const fetchReports = () => {
    const f = filtersRef.current;
    setLoading(true);
    setError(null);
    queryReports(f)
      .then(setData)
      .catch((err) => {
        console.error("useArkivReports error:", err);
        setError(err.message || "Error al consultar ARKIV Network");
        setData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    filtersRef.current = filters;
    fetchReports();
  }, [filters.tipo_incidente, filters.urgencia, filters.limit]);

  return { data, loading, error, refetch: fetchReports };
}
