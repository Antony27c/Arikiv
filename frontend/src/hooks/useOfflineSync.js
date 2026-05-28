import { useState, useEffect, useCallback } from "react";
import { submitReport } from "../services/api";

const STORAGE_KEY = "rutasegura_pending";

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useOfflineSync() {
  const [pending, setPending] = useState(loadQueue);
  const [synced, setSynced] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  }, [pending]);

  const enqueue = useCallback((report) => {
    const entry = { ...report, _id: Date.now(), _queuedAt: new Date().toISOString() };
    setPending((prev) => [...prev, entry]);
  }, []);

  const sync = useCallback(async () => {
    if (pending.length === 0 || !online) return;
    setSyncing(true);
    const queue = [...pending];
    const done = [];

    for (const item of queue) {
      try {
        const payload = {
          metadata_origen: item.metadata_origen,
          geolocalizacion_reportada: item.geolocalizacion_reportada,
          datos_evento: item.datos_evento,
        };
        const result = await submitReport(payload);
        done.push({ ...item, _result: result, _error: false });
      } catch {
        done.push({ ...item, _error: true });
      }
    }

    setPending([]);
    setSynced((prev) => [...prev, ...done]);
    setSyncing(false);
  }, [pending, online]);

  useEffect(() => {
    if (online && pending.length > 0 && !syncing) {
      sync();
    }
  }, [online, pending.length, sync]);

  return { pending, synced, online, syncing, enqueue, sync };
}
