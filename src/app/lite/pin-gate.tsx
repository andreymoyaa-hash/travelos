"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LitePinGate() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !/^\d{6}$/.test(pin)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/travel-session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ pin }),
      });
      const result: unknown = await response.json().catch(() => null);
      const data = result && typeof result === "object" ? result as Record<string, unknown> : {};
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "No se pudo comprobar el PIN.");
      const trip = data.trip && typeof data.trip === "object" ? data.trip as Record<string, unknown> : {};
      if (data.accessKind !== "trip" || trip.slug !== "japan-2026") {
        // Avoid keeping a session for another workspace/trip when accessing this private itinerary.
        await fetch("/api/travel-session/logout", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }), credentials: "same-origin",
        }).catch(() => undefined);
        throw new Error("Este PIN no corresponde al viaje Japón 2026.");
      }
      setPin("");
      router.refresh();
    } catch (cause) {
      setPin("");
      setError(cause instanceof Error ? cause.message : "No se pudo acceder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-violet-50 to-rose-50 px-4 py-8 text-slate-900">
      <section className="w-full max-w-sm overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100/70">
        <div className="bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-500 px-6 py-7 text-white">
          <p className="text-xs font-bold tracking-widest text-indigo-100">NIOLI LITE · JAPÓN 2026</p>
          <h1 className="mt-2 text-2xl font-bold">Bienvenidos a Nioli</h1>
          <p className="mt-1 text-sm text-indigo-100">Tu viaje comienza con tu PIN.</p>
        </div>
        <form onSubmit={(event) => { void login(event); }} className="space-y-4 p-6">
          <label htmlFor="nioli-lite-pin" className="block text-sm font-semibold">PIN de acceso · 6 dígitos</label>
          <input
            id="nioli-lite-pin"
            aria-label="PIN de acceso a Nioli Lite"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{6}"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="● ● ● ● ● ●"
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-center text-2xl tracking-widest outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          />
          <button type="submit" disabled={busy || pin.length !== 6} className="w-full rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Verificando acceso…" : "Ingresar al viaje"}
          </button>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
          <p className="text-center text-xs text-slate-500">Utiliza tu PIN de Nioli original. No lo compartas.</p>
        </form>
      </section>
    </main>
  );
}
