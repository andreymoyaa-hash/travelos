"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TripDay } from "@/types/travel";

export type LiteReceipt = {
  id: string; title: string; amount: number;
  currency: "JPY" | "CRC" | "USD"; category: string;
  date: string; note: string; hasPhoto: boolean;
};
type PinSession = {
  accessKind: "trip" | "workspace";
  trip?: { id: string; name: string; slug?: string };
  participant?: { name: string; role: string };
};
type Snapshot = { itinerary: TripDay[]; receipts: LiteReceipt[]; updated_at: string };
type SyncStatus = "checking" | "signedOut" | "ready" | "pending" | "saving" | "saved" | "offline" | "conflict" | "error";

interface CloudSyncProps {
  ready: boolean;
  days: TripDay[];
  receipts: LiteReceipt[];
  onRestore: (days: TripDay[], receipts: LiteReceipt[]) => void;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  storePhoto: (id: string, file: File) => Promise<void>;
}

async function apiJson(url: string, init?: RequestInit): Promise<Record<string, unknown> | null> {
  const response = await fetch(url, { ...init, cache: "no-store", credentials: "same-origin" });
  const result: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  const data = result && typeof result === "object" ? result as Record<string, unknown> : {};
  if (!response.ok) {
    const error = new Error(typeof data.error === "string" ? data.error : "Error de conexión con Supabase.") as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : data;
}
const signature = (days: TripDay[], receipts: LiteReceipt[]) => JSON.stringify({ days, receipts });
const validSnapshot = (candidate: unknown): candidate is Snapshot => {
  if (!candidate || typeof candidate !== "object") return false;
  const value = candidate as Partial<Snapshot>;
  return typeof value.updated_at === "string" && Array.isArray(value.itinerary) && Array.isArray(value.receipts) &&
    value.itinerary.every(day => day && typeof day.date === "string" && Array.isArray(day.activities)) &&
    value.receipts.every(r => r && typeof r.id === "string" && typeof r.title === "string" && Number.isFinite(r.amount));
};
const BUCKET_LABEL = "Recibos protegidos con tu sesión PIN";

export default function LiteCloudSync({ ready, days, receipts, onRestore, readPhoto, storePhoto }: CloudSyncProps) {
  const [session, setSession] = useState<PinSession | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("checking");
  const [message, setMessage] = useState("");
  const [remoteUpdated, setRemoteUpdated] = useState<string | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [retry, setRetry] = useState(0);

  const lastSyncedRef = useRef<string | null>(null);
  const remoteVersionRef = useRef<string | null>(null);
  const knownPhotosRef = useRef<Set<string>>(new Set());
  const operationRef = useRef(false);
  const initializedTripRef = useRef<string | null>(null);
  const currentRef = useRef({ days, receipts });
  currentRef.current = { days, receipts };
  const isJapanTrip = session?.accessKind === "trip" && session.trip?.slug === "japan-2026";
  const canWrite = isJapanTrip && ["owner", "editor"].includes(session?.participant?.role || "");

  const fetchSnapshot = useCallback(async () => {
    const result = await apiJson("/api/lite-cloud");
    const value = result?.snapshot;
    if (value !== null && value !== undefined && !validSnapshot(value)) throw new Error("El respaldo remoto tiene un formato inesperado.");
    return value ? value as Snapshot : null;
  }, []);

  useEffect(() => {
    void apiJson("/api/travel-session").then(result => {
      setSession(result as PinSession | null);
      if (!result) setStatus("signedOut");
    }).catch(() => { setSession(null); setStatus("signedOut"); });
  }, []);

  useEffect(() => {
    const handler = () => setRetry(value => value + 1);
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, []);

  // Fetch and compare first. Never auto-upload a browser's starter itinerary over
  // a cloud backup until the user explicitly chooses which version is authoritative.
  useEffect(() => {
    if (!ready || !isJapanTrip || !session?.trip?.id || initializedTripRef.current === session.trip.id) return;
    initializedTripRef.current = session.trip.id;
    let cancelled = false;
    const check = async () => {
      setStatus("checking");
      setAutoEnabled(false);
      try {
        const snapshot = await fetchSnapshot();
        if (cancelled) return;
        const current = currentRef.current;
        const localSig = signature(current.days, current.receipts);
        remoteVersionRef.current = snapshot?.updated_at || null;
        setRemoteUpdated(snapshot?.updated_at || null);
        knownPhotosRef.current = new Set(snapshot?.receipts.filter(r => r.hasPhoto).map(r => r.id) || []);
        if (!snapshot) {
          lastSyncedRef.current = null;
          setStatus(canWrite ? "pending" : "ready");
          setAutoEnabled(Boolean(canWrite));
          setMessage(canWrite ? "No había respaldo remoto. Se creará automáticamente con tus datos locales." : "Aún no existe un respaldo en línea.");
        } else if (signature(snapshot.itinerary, snapshot.receipts) === localSig) {
          lastSyncedRef.current = localSig;
          setStatus("saved");
          setAutoEnabled(Boolean(canWrite));
          setMessage("Tus datos locales coinciden con Supabase.");
        } else {
          lastSyncedRef.current = signature(snapshot.itinerary, snapshot.receipts);
          setStatus("conflict");
          setMessage("Este navegador y Supabase tienen datos distintos. Por seguridad no se sincronizará nada hasta que elijas «Recuperar respaldo» o «Subir respaldo».");
        }
      } catch (error) {
        if (cancelled) return;
        initializedTripRef.current = null;
        setStatus(navigator.onLine ? "error" : "offline");
        setMessage(error instanceof Error ? error.message : "No se pudo comprobar Supabase.");
      }
    };
    void check();
    return () => { cancelled = true; };
  }, [ready, isJapanTrip, session?.trip?.id, canWrite, fetchSnapshot, retry]);

  async function login() {
    if (!/^\d{6}$/.test(pin) || busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await apiJson("/api/travel-session/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin })
      });
      initializedTripRef.current = null;
      setPin(""); setSession(result as PinSession);
      setStatus("checking"); setMessage("PIN aceptado. Verificando tu copia en línea.");
    } catch (error) {
      setPin(""); setMessage(error instanceof Error ? error.message : "No se pudo entrar.");
    } finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    try {
      await apiJson("/api/travel-session/logout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
      });
      setSession(null); setRemoteUpdated(null); setAutoEnabled(false);
      initializedTripRef.current = null; lastSyncedRef.current = null;
      remoteVersionRef.current = null; knownPhotosRef.current.clear();
      setStatus("signedOut"); setMessage("Sesión cerrada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cerrar sesión.");
    } finally { setBusy(false); }
  }

  async function uploadData(manual: boolean) {
    if (!canWrite || operationRef.current) return;
    if (manual && !window.confirm("¿Subir tus datos actuales y reemplazar la copia remota? Confirma que este teléfono contiene la versión correcta.")) return;
    if (!navigator.onLine) { setStatus("offline"); return; }
    operationRef.current = true; setBusy(true); setStatus("saving");
    if (manual) setMessage("");
    const current = currentRef.current;
    const savedSig = signature(current.days, current.receipts);
    try {
      let uploaded = 0;
      for (const receipt of current.receipts) {
        if (!receipt.hasPhoto || knownPhotosRef.current.has(receipt.id)) continue;
        const blob = await readPhoto(receipt.id);
        if (!blob) throw new Error("Falta la fotografía local de «" + receipt.title + "». No se guardó el cambio; conserva el recibo.");
        const form = new FormData();
        form.append("id", receipt.id);
        form.append("photo", new File([blob], "recibo.jpg", { type: blob.type || "image/jpeg" }));
        await apiJson("/api/lite-cloud/photo", { method: "POST", body: form });
        knownPhotosRef.current.add(receipt.id);
        uploaded++;
      }
      const result = await apiJson("/api/lite-cloud", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: current.days, receipts: current.receipts, expectedUpdatedAt: remoteVersionRef.current })
      });
      const version = typeof result?.updatedAt === "string" ? result.updatedAt : null;
      if (!version) throw new Error("El servidor no confirmó la versión guardada.");
      remoteVersionRef.current = version;
      lastSyncedRef.current = savedSig;
      setRemoteUpdated(version);
      setStatus("saved"); setAutoEnabled(true);
      if (manual) setMessage("Respaldo guardado. " + uploaded + " fotos nuevas.");
    } catch (error) {
      const code = (error as { status?: number }).status;
      if (code === 409 || code === 428) {
        setAutoEnabled(false); setStatus("conflict");
        setMessage("Otro dispositivo modificó el respaldo. Pulsa «Comprobar nube» para actualizar la versión remota, y luego elige entre «Recuperar respaldo» o «Subir respaldo manual». No se reemplazó.");
      } else {
        setStatus(navigator.onLine ? "error" : "offline");
        setMessage("Los cambios siguen guardados en este teléfono, pero no llegaron a Supabase. " +
          (error instanceof Error ? error.message : ""));
      }
    } finally {
      operationRef.current = false; setBusy(false);
      setRetry(value => value + 1);
    }
  }

  // Debounced autosave: waits for edits to settle, and never writes before cloud
  // version comparison has completed. If another save is in flight, it retries later.
  useEffect(() => {
    if (!ready || !canWrite || !autoEnabled || status === "checking" || status === "conflict" || status === "error") return;
    const sig = signature(days, receipts);
    if (sig === lastSyncedRef.current && lastSyncedRef.current !== null) return;
    if (status !== "saving") setStatus(navigator.onLine ? "pending" : "offline");
    if (!navigator.onLine) return;
    const timer = window.setTimeout(() => {
      if (!operationRef.current) void uploadData(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [days, receipts, ready, canWrite, autoEnabled, retry, status]);

  async function inspectCloud() {
    if (operationRef.current) return;
    setBusy(true); setMessage("");
    try {
      const snapshot = await fetchSnapshot();
      setRemoteUpdated(snapshot?.updated_at || null);
      if (snapshot?.updated_at !== remoteVersionRef.current) {
        remoteVersionRef.current = snapshot?.updated_at || null;
        setAutoEnabled(false); setStatus("conflict");
        setMessage("Hay un respaldo diferente en Supabase. Elige cuál conservar antes de sincronizar.");
      } else {
        setMessage(snapshot ? "Respaldo disponible y versión confirmada." : "No existe un respaldo remoto.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Error revisando respaldo."); }
    finally { setBusy(false); }
  }

  async function restoreCloud() {
    if (!window.confirm("¿Recuperar el respaldo de Supabase? Reemplazará el itinerario y los gastos locales. Exporta tu JSON si tienes cambios sin guardar.")) return;
    setBusy(true); setMessage("");
    setAutoEnabled(false);
    try {
      const snapshot = await fetchSnapshot();
      if (!snapshot) throw new Error("No existe un respaldo en línea.");
      let restored = 0;
      let missing = 0;
      for (const receipt of snapshot.receipts) {
        if (!receipt.hasPhoto) continue;
        try {
          const response = await fetch("/api/lite-cloud/photo?id=" + encodeURIComponent(receipt.id), {
            credentials: "same-origin", cache: "no-store"
          });
          if (!response.ok) throw new Error("Foto no encontrada");
          const photo = await response.blob();
          await storePhoto(receipt.id, new File([photo], "recibo.jpg", { type: photo.type || "image/jpeg" }));
          restored++;
        } catch { missing++; }
      }
      remoteVersionRef.current = snapshot.updated_at;
      lastSyncedRef.current = signature(snapshot.itinerary, snapshot.receipts);
      knownPhotosRef.current = new Set(snapshot.receipts.filter(r => r.hasPhoto).map(r => r.id));
      setRemoteUpdated(snapshot.updated_at);
      onRestore(snapshot.itinerary, snapshot.receipts);
      setStatus("saved"); setAutoEnabled(Boolean(canWrite));
      setMessage("Respaldo recuperado. Fotos: " + restored +
        (missing ? ". Faltaron " + missing + " fotos; guarda los originales." : "."));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo recuperar el respaldo.");
    } finally { setBusy(false); }
  }

  const descriptions: Record<SyncStatus, string> = {
    checking: "Comprobando respaldo…",
    signedOut: "Inicia sesión para sincronizar",
    ready: "Acceso de solo lectura",
    pending: "Cambios pendientes de subir",
    saving: "Guardando en Supabase…",
    saved: "Datos guardados en Supabase",
    offline: "Sin conexión · datos locales conservados",
    conflict: "Versiones distintas · elige cuál conservar",
    error: "Sin sincronizar · revisa el error",
  };

  return <section className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
    <div className="mb-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-700 p-4 text-white">
      <h2 className="text-lg font-bold">🔐 Nioli Cloud · PIN y guardado automático</h2>
      <p className="text-sm text-sky-50">Viaje Japón 2026 · {BUCKET_LABEL}</p>
    </div>
    <div role="status" aria-live="polite" className="mb-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-800">
      {descriptions[status]}
      {remoteUpdated && <p className="mt-1 text-xs font-normal text-slate-600">Último respaldo remoto: {new Date(remoteUpdated).toLocaleString("es-CR")}</p>}
    </div>
    {isJapanTrip ? <div className="space-y-3">
      <p className="text-sm">Conectado como <strong>{session?.participant?.name}</strong> · {session?.participant?.role}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => { void inspectCloud(); }} className="rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 disabled:opacity-40">Comprobar nube</button>
        {canWrite && <button type="button" disabled={busy} onClick={() => { void uploadData(true); }} className="rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Subir respaldo manual</button>}
        <button type="button" disabled={busy} onClick={() => { void restoreCloud(); }} className="rounded-xl bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Recuperar respaldo</button>
        <button type="button" disabled={busy} onClick={() => { void signOut(); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Cerrar sesión</button>
      </div>
      {canWrite && status === "conflict" && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Hay diferencias entre este dispositivo y la nube. Para evitar perder información, el guardado automático está pausado. «Recuperar respaldo» conserva la versión remota; «Subir respaldo manual» reemplaza esa versión solo después de tu confirmación.</p>}
      {!canWrite && <p className="text-xs text-amber-800">Tu PIN tiene acceso de lectura; no puede cambiar el respaldo.</p>}
    </div> : <div className="space-y-3">
      {session && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Tu sesión corresponde a otro viaje. Ingresa con un PIN autorizado para Japón 2026.</p>}
      <label htmlFor="lite-pin" className="block text-sm font-semibold">PIN de Nioli (6 dígitos)</label>
      <input id="lite-pin" type="password" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={6} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="● ● ● ● ● ●" className="w-full rounded-xl border border-slate-300 p-3 text-center text-xl tracking-widest"/>
      <button type="button" onClick={() => { void login(); }} disabled={pin.length !== 6 || busy} className="rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-40">{busy ? "Verificando…" : "Entrar con PIN"}</button>
    </div>}
    {message && <p role="status" className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-950">{message}</p>}
    <p className="mt-3 text-xs text-slate-500">El guardado automático se activa cuando coinciden tus datos locales y la nube o cuando eliges una versión. Funciona al cambiar itinerario o gastos, y reintenta al volver Internet. No compartas tu PIN.</p>
  </section>;
}
