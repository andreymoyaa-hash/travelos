"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { TripDay } from "@/types/travel";

export type LiteReceipt = { id: string; title: string; amount: number; currency: "JPY" | "CRC" | "USD"; category: string; date: string; note: string; hasPhoto: boolean };

interface CloudSyncProps {
  days: TripDay[];
  receipts: LiteReceipt[];
  onRestore: (days: TripDay[], receipts: LiteReceipt[]) => void;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  storePhoto: (id: string, file: File) => Promise<void>;
}

const BUCKET = "nioli-lite-receipts";
export default function LiteCloudSync({ days, receipts, onRestore, readPhoto, storePhoto }: CloudSyncProps) {
  const supabase = useMemo<SupabaseClient | null>(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [remoteUpdated, setRemoteUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function sendCode() {
    if (!supabase || !email.trim()) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + "/lite" },
      });
      if (error) throw error;
      setMessage("Revisa tu correo. Abre el enlace desde el mismo navegador o introduce el código si recibiste uno.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo enviar el correo."); }
    finally { setBusy(false); }
  }
  async function verifyCode() {
    if (!supabase || !otp.trim()) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: "email" });
      if (error) throw error;
      setMessage("Sesión iniciada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Código inválido."); }
    finally { setBusy(false); }
  }
  async function inspectCloud() {
    if (!supabase || !user) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.from("nioli_lite_snapshots").select("updated_at").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      setRemoteUpdated(data?.updated_at ?? null);
      setMessage(data ? "Respaldo encontrado. Puedes recuperarlo o subir uno nuevo." : "No hay un respaldo en línea todavía.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo consultar Supabase."); }
    finally { setBusy(false); }
  }
  async function uploadCloud() {
    if (!supabase || !user) return;
    if (!window.confirm("¿Subir tus datos actuales a Supabase? Esto reemplazará el respaldo anterior de esta cuenta, pero no los datos locales.")) return;
    setBusy(true); setMessage("");
    try {
      // Upload receipt photos BEFORE updating their metadata, so failed uploads cannot create broken links.
      let photos = 0;
      const adjusted = await Promise.all(receipts.map(async (receipt) => {
        if (!receipt.hasPhoto) return receipt;
        const blob = await readPhoto(receipt.id);
        if (!blob) return receipt;
        const name = user.id + "/" + receipt.id.replace(/[^a-zA-Z0-9_-]/g, "") + ".jpg";
        const { error } = await supabase.storage.from(BUCKET).upload(name, blob, { contentType: blob.type || "image/jpeg", upsert: true });
        if (error) throw error;
        photos++;
        return receipt;
      }));
      const { error } = await supabase.from("nioli_lite_snapshots").upsert({
        user_id: user.id, itinerary: days, receipts: adjusted, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      setRemoteUpdated(new Date().toISOString());
      setMessage("Respaldo guardado en línea. Fotos subidas: " + photos + ".");
    } catch (error) { setMessage("No se completó el respaldo: " + (error instanceof Error ? error.message : "error desconocido")); }
    finally { setBusy(false); }
  }
  async function downloadCloud() {
    if (!supabase || !user) return;
    if (!window.confirm("¿Recuperar la copia de Supabase? Sustituirá el itinerario y los gastos de este navegador. Exporta antes un respaldo si tienes cambios sin subir.")) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.from("nioli_lite_snapshots").select("itinerary,receipts,updated_at").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (!data || !Array.isArray(data.itinerary) || !Array.isArray(data.receipts)) throw new Error("No existe un respaldo válido.");
      if (!data.itinerary.every((day: unknown) => day !== null && typeof day === "object" && typeof (day as TripDay).date === "string" && Array.isArray((day as TripDay).activities))) throw new Error("Itinerario inválido.");
      if (!data.receipts.every((receipt: unknown) => receipt !== null && typeof receipt === "object" && typeof (receipt as LiteReceipt).id === "string" && Number.isFinite((receipt as LiteReceipt).amount))) throw new Error("Gastos inválidos.");
      let photos = 0;
      for (const receipt of data.receipts as LiteReceipt[]) {
        if (!receipt.hasPhoto) continue;
        const name = user.id + "/" + receipt.id.replace(/[^a-zA-Z0-9_-]/g, "") + ".jpg";
        const { data: file, error: photoError } = await supabase.storage.from(BUCKET).download(name);
        if (photoError || !file) continue;
        try { await storePhoto(receipt.id, new File([file], "recibo.jpg", { type: file.type || "image/jpeg" })); photos++; } catch { /* Keep metadata and warn below. */ }
      }
      onRestore(data.itinerary as TripDay[], data.receipts as LiteReceipt[]);
      setRemoteUpdated(data.updated_at);
      setMessage("Respaldo restaurado. Fotos recuperadas: " + photos + ". Si faltan fotos, conserva las originales.");
    } catch (error) { setMessage("No se restauraron los datos: " + (error instanceof Error ? error.message : "error desconocido")); }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
    <div className="mb-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 p-4 text-white">
      <h2 className="text-lg font-bold">☁️ Respaldo en línea · Supabase</h2>
      <p className="text-sm text-sky-50">Sincronización manual y privada por cuenta. Los datos locales siguen siendo independientes.</p>
    </div>
    {!supabase ? <p className="text-sm text-rose-700">La conexión a Supabase no está configurada para este despliegue.</p> :
      user ? <div className="space-y-3">
        <p className="text-sm text-slate-700">Conectado como <strong>{user.email || "usuario"}</strong></p>
        {remoteUpdated && <p className="text-xs text-slate-500">Último respaldo remoto: {new Date(remoteUpdated).toLocaleString("es-CR")}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => { void inspectCloud(); }} className="rounded-xl border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-800 disabled:opacity-40">Comprobar nube</button>
          <button type="button" disabled={busy} onClick={() => { void uploadCloud(); }} className="rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Subir respaldo</button>
          <button type="button" disabled={busy} onClick={() => { void downloadCloud(); }} className="rounded-xl bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Recuperar respaldo</button>
          <button type="button" disabled={busy} onClick={() => { void supabase.auth.signOut(); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Salir</button>
        </div>
      </div> : <div className="space-y-3">
        <p className="text-sm text-slate-700">Entra con tu correo para mantener tus datos privados. Necesitarás poder recibir el enlace o código de verificación de Supabase.</p>
        <input type="email" autoComplete="email" aria-label="Correo de Supabase" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" className="w-full rounded-xl border border-slate-300 p-3" />
        <button type="button" onClick={() => { void sendCode(); }} disabled={!email.trim() || busy} className="rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white disabled:opacity-40">Enviar enlace o código</button>
        <div className="flex gap-2">
          <input aria-label="Código del correo" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Código si recibiste uno" className="min-w-0 flex-1 rounded-xl border border-slate-300 p-3" />
          <button type="button" disabled={busy || !otp.trim()} onClick={() => { void verifyCode(); }} className="rounded-xl bg-indigo-700 px-3 font-semibold text-white disabled:opacity-40">Verificar</button>
        </div>
      </div>}
    {message && <p role="status" className="mt-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-950">{message}</p>}
    <p className="mt-3 text-xs text-slate-500">No se realizan cambios remotos sin pulsar «Subir respaldo». Antes de recuperar una copia se solicita confirmación.</p>
  </section>;
}
