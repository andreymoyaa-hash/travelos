"use client";

import { useEffect, useState } from "react";
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

interface CloudSyncProps {
  days: TripDay[];
  receipts: LiteReceipt[];
  onRestore: (days: TripDay[], receipts: LiteReceipt[]) => void;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  storePhoto: (id: string, file: File) => Promise<void>;
}

async function apiJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store", credentials: "same-origin" });
  const result: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  const data: Record<string, unknown> = result && typeof result === "object" ? result as Record<string, unknown> : {};
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Error de conexión con Supabase.");
  return response.status === 204 ? null : data;
}

export default function LiteCloudSync({ days, receipts, onRestore, readPhoto, storePhoto }: CloudSyncProps) {
  const [session, setSession] = useState<PinSession | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [remoteUpdated, setRemoteUpdated] = useState<string | null>(null);

  async function refreshSession() {
    try {
      const result = await apiJson("/api/travel-session");
      setSession(result as PinSession | null);
    } catch {
      setSession(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { void refreshSession(); }, []);

  const isJapanTrip = session?.accessKind === "trip" && session.trip?.slug === "japan-2026";
  const canWrite = isJapanTrip && ["owner", "editor"].includes(session?.participant?.role || "");

  async function login() {
    if (!/^\d{6}$/.test(pin) || busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await apiJson("/api/travel-session/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      setPin("");
      setSession(result as PinSession);
      setMessage("PIN aceptado. Sesión protegida activa.");
    } catch (error) {
      setPin("");
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setMessage("");
    try {
      await apiJson("/api/travel-session/logout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      setSession(null); setRemoteUpdated(null); setMessage("Sesión cerrada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo cerrar sesión."); }
    finally { setBusy(false); }
  }

  async function inspectCloud() {
    setBusy(true); setMessage("");
    try {
      const result = await apiJson("/api/lite-cloud");
      const snapshot = result?.snapshot as { updated_at?: string } | null | undefined;
      setRemoteUpdated(snapshot?.updated_at || null);
      setMessage(snapshot ? "Respaldo en línea encontrado." : "Aún no existe un respaldo para este viaje.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo revisar la nube."); }
    finally { setBusy(false); }
  }

  async function uploadCloud() {
    if (!canWrite) return;
    if (!window.confirm("¿Guardar el itinerario y gastos de este navegador en Supabase? Reemplazará la copia anterior del viaje. Conserva un JSON local por seguridad.")) return;
    setBusy(true); setMessage("");
    try {
      let uploaded = 0;
      for (const receipt of receipts) {
        if (!receipt.hasPhoto) continue;
        const blob = await readPhoto(receipt.id);
        if (!blob) throw new Error("Falta la foto local de «" + receipt.title + "». Conserva los archivos y vuelve a intentarlo.");
        const form = new FormData();
        form.append("id", receipt.id);
        form.append("photo", new File([blob], "recibo.jpg", { type: blob.type || "image/jpeg" }));
        await apiJson("/api/lite-cloud/photo", { method: "POST", body: form });
        uploaded++;
      }
      const result = await apiJson("/api/lite-cloud", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, receipts }),
      });
      setRemoteUpdated(typeof result?.updatedAt === "string" ? result.updatedAt : new Date().toISOString());
      setMessage("Respaldo guardado en Supabase. Fotografías: " + uploaded + ".");
    } catch (error) {
      setMessage("No se completó el respaldo: " + (error instanceof Error ? error.message : "error desconocido"));
    } finally { setBusy(false); }
  }

  async function downloadCloud() {
    if (!window.confirm("¿Restaurar la copia en línea? Reemplazará el itinerario y los gastos guardados en este navegador. Exporta primero tu JSON si tienes cambios locales.")) return;
    setBusy(true); setMessage("");
    try {
      const result = await apiJson("/api/lite-cloud");
      const snapshot = result?.snapshot as { itinerary?: unknown; receipts?: unknown; updated_at?: string } | null | undefined;
      if (!snapshot || !Array.isArray(snapshot.itinerary) || !Array.isArray(snapshot.receipts)) throw new Error("No existe una copia válida en línea.");
      if (!snapshot.itinerary.every((day: unknown) => day !== null && typeof day === "object" && typeof (day as TripDay).date === "string" && Array.isArray((day as TripDay).activities))) throw new Error("El itinerario remoto no es válido.");
      if (!snapshot.receipts.every((receipt: unknown) => receipt !== null && typeof receipt === "object" && typeof (receipt as LiteReceipt).id === "string" && typeof (receipt as LiteReceipt).title === "string" && Number.isFinite((receipt as LiteReceipt).amount))) throw new Error("Los gastos remotos no son válidos.");
      let restored = 0;
      let missing = 0;
      for (const receipt of snapshot.receipts as LiteReceipt[]) {
        if (!receipt.hasPhoto) continue;
        try {
          const response = await fetch("/api/lite-cloud/photo?id=" + encodeURIComponent(receipt.id), { credentials: "same-origin", cache: "no-store" });
          if (!response.ok) throw new Error("Foto no disponible");
          const blob = await response.blob();
          await storePhoto(receipt.id, new File([blob], "recibo.jpg", { type: blob.type || "image/jpeg" }));
          restored++;
        } catch { missing++; }
      }
      onRestore(snapshot.itinerary as TripDay[], snapshot.receipts as LiteReceipt[]);
      setRemoteUpdated(snapshot.updated_at || null);
      setMessage("Respaldo recuperado. Fotos: " + restored + (missing ? "; " + missing + " fotografías no se pudieron recuperar." : "."));
    } catch (error) { setMessage("No se recuperaron los datos: " + (error instanceof Error ? error.message : "error desconocido")); }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
    <div className="mb-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-700 p-4 text-white">
      <h2 className="text-lg font-bold">🔐 Supabase con PIN · Nioli Lite</h2>
      <p className="text-sm text-sky-50">Usa el PIN de seis dígitos de Nioli original. Sin enlaces al correo.</p>
    </div>
    {checking ? <p className="text-sm">Comprobando sesión PIN...</p> : isJapanTrip ? <div className="space-y-3">
      <p className="text-sm">Conectado como <strong>{session?.participant?.name}</strong> · {session?.participant?.role}</p>
      {remoteUpdated && <p className="text-xs text-slate-600">Última copia en línea: {new Date(remoteUpdated).toLocaleString("es-CR")}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => { void inspectCloud(); }} className="rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 disabled:opacity-40">Comprobar nube</button>
        {canWrite && <button type="button" disabled={busy} onClick={() => { void uploadCloud(); }} className="rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Subir respaldo</button>}
        <button type="button" disabled={busy} onClick={() => { void downloadCloud(); }} className="rounded-xl bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Recuperar respaldo</button>
        <button type="button" disabled={busy} onClick={() => { void signOut(); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Cerrar sesión</button>
      </div>
      {!canWrite && <p className="text-xs text-amber-800">Tu PIN tiene acceso de lectura. Solo el propietario y editores pueden guardar respaldos.</p>}
    </div> : <div className="space-y-3">
      {session && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Tu sesión pertenece a otro viaje o a un invitado. Usa el PIN autorizado para Japón 2026.</p>}
      <label htmlFor="lite-pin" className="block text-sm font-semibold">PIN de Nioli (6 dígitos)</label>
      <input id="lite-pin" type="password" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="● ● ● ● ● ●" className="w-full rounded-xl border border-slate-300 p-3 text-center text-xl tracking-widest" />
      <button type="button" onClick={() => { void login(); }} disabled={pin.length !== 6 || busy} className="rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-40">{busy ? "Verificando..." : "Entrar con PIN"}</button>
    </div>}
    {message && <p role="status" className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-950">{message}</p>}
    <p className="mt-3 text-xs text-slate-500">La sincronización es manual: el PIN no sube tus datos por sí solo. Las fotos se almacenan en un depósito privado de Supabase. No compartas tu PIN.</p>
  </section>;
}
