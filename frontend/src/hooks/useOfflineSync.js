import { useState, useEffect, useCallback, useRef } from "react";
import { submitReport } from "../services/api";

const PENDING_KEY = "rutasegura_pending";
const SYNCED_KEY = "rutasegura_synced";
const MAX_RETRIES = 3;
const RETRY_COOLDOWN_MS = 15000;

function loadQueued(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function useOfflineSync() {
  const [pending, setPending] = useState(() => loadQueued(PENDING_KEY));
  const [synced, setSynced] = useState(() => loadQueued(SYNCED_KEY));
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const lastSync = useRef(0);

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
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }, [pending]);

  useEffect(() => {
    localStorage.setItem(SYNCED_KEY, JSON.stringify(synced));
  }, [synced]);

  const enqueue = useCallback((report) => {
    const entry = { ...report, _id: Date.now(), _queuedAt: new Date().toISOString(), _retries: 0 };
    setPending((prev) => [...prev, entry]);
  }, []);

  const sync = useCallback(async () => {
    if (pending.length === 0 || !online || syncing) return;
    const now = Date.now();
    if (now - lastSync.current < RETRY_COOLDOWN_MS) return;
    lastSync.current = now;

    setSyncing(true);
    const queue = [...pending];
    const done = [];
    const failed = [];

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
        const retries = (item._retries || 0) + 1;
        if (retries >= MAX_RETRIES) {
          done.push({ ...item, _result: null, _error: true });
        } else {
          failed.push({ ...item, _retries: retries });
        }
      }
    }

    setPending(failed);
    setSynced((prev) => [...prev, ...done]);
    setSyncing(false);
  }, [pending, online, syncing]);

  useEffect(() => {
    if (!online || pending.length === 0) return;
    const timer = setTimeout(() => sync(), 1000);
    return () => clearTimeout(timer);
  }, [online, pending.length, sync]);

  const clearSynced = useCallback(() => {
    setSynced([]);
  }, []);

  const clearPending = useCallback(() => {
    setPending([]);
  }, []);

  const removeFromSynced = useCallback((id) => {
    setSynced((prev) => prev.filter((s) => s._id !== id));
  }, []);

  const removeFromPending = useCallback((id) => {
    setPending((prev) => prev.filter((s) => s._id !== id));
  }, []);

  return { pending, synced, online, syncing, enqueue, sync, clearSynced, clearPending, removeFromSynced, removeFromPending };
}
