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
      .then((results) => {
        setData(results);
        setError(null);
      })
      .catch((err) => {
        console.warn("useArkivReports (esperado si no hay datos on-chain):", err.message);
        setData([]);
        setError(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    filtersRef.current = filters;
    fetchReports();
  }, [filters.tipo_incidente, filters.urgencia, filters.limit]);

  return { data, loading, error, refetch: fetchReports };
}
