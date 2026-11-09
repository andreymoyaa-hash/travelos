"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bradyAssets } from "@/lib/nioli/assets/manifest";
import { getSafeNioliAsset } from "@/lib/nioli/assets/helpers";

const brady = getSafeNioliAsset(bradyAssets.base.neutral);

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
      // The login endpoint can omit the trip slug. Verify the actual
      // server-side session after the secure cookie has been set.
      const check = await fetch("/api/travel-session", {
        credentials: "same-origin", cache: "no-store",
      });
      const checked: unknown = check.ok && check.status !== 204 ? await check.json().catch(() => null) : null;
      const session = checked && typeof checked === "object" ? checked as Record<string, unknown> : {};
      const trip = session.trip && typeof session.trip === "object" ? session.trip as Record<string, unknown> : {};
      if (session.accessKind !== "trip" || trip.slug !== "japan-2026") {
        throw new Error("Este acceso no tiene una sesión activa para Japón 2026.");
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
    <main className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-8 text-[#283b30]">
      <section className="w-full max-w-sm overflow-hidden rounded-[30px] border border-[#e3dfd1] bg-white shadow-[0_20px_60px_-26px_rgba(32,61,40,0.3)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f3f5ed] to-[#e5eee6] px-6 py-8 text-[#2f503a]">
          {brady && <img src={brady} alt="Brady, mascota de Nioli" className="absolute right-1 top-2 h-28 w-24 object-contain opacity-95" />}
          <div className="relative pr-14">
          <p className="text-xs font-bold tracking-widest text-[#658367]">NIOLI LITE · JAPÓN 2026</p>
          <h1 className="mt-2 text-2xl font-bold">Bienvenidos a Nioli</h1>
          <p className="mt-1 text-sm text-[#54715a]">Tu viaje comienza con tu PIN.</p>
          </div>
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
            className="w-full rounded-xl border border-[#cddccb] bg-[#f2f6ef] px-4 py-4 text-center text-2xl tracking-widest outline-none focus:border-[#597e60] focus:ring-2 focus:ring-[#d5e4d4]"
          />
          <button type="submit" disabled={busy || pin.length !== 6} className="w-full rounded-xl bg-[#365a45] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Verificando acceso…" : "Ingresar al viaje"}
          </button>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
          <p className="text-center text-xs text-slate-500">Utiliza tu PIN de Nioli original. No lo compartas.</p>
        </form>
      </section>
    </main>
  );
}
