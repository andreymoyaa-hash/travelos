"use client";

import Image from "next/image";
import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, LockKeyhole, Plane } from "lucide-react";

import { TravelApp } from "@/features/trips/travel-app";
import { GuestWorkspaceView } from "@/features/trips/guest-workspace-view";
import { cloudTripRepository } from "@/repositories/cloud-trip-repository";
import type { CloudTripPayload, TravelAccessSession, TravelSession, TravelWorkspaceSession } from "@/types/cloud";
import type { Trip } from "@/types/travel";

type Phase = "checking" | "login" | "welcome" | "loading" | "ready";

const sleep = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), milliseconds);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

export function TravelAuthGate({ cloudConfigured, localSeedTrip }: { cloudConfigured: boolean; localSeedTrip: Trip }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [phase, setPhase] = useState<Phase>(cloudConfigured ? "checking" : "login");
  const [session, setSession] = useState<TravelSession>();
  const [workspaceSession, setWorkspaceSession] = useState<TravelWorkspaceSession>();
  const [payload, setPayload] = useState<CloudTripPayload>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const clearClientAccess = useCallback(() => {
    setPayload(undefined);
    setSession(undefined);
    setWorkspaceSession(undefined);
    setDigits(["", "", "", "", "", ""]);
    setError(undefined);
  }, []);

  const openSession = useCallback(async (nextSession: TravelSession) => {
    setWorkspaceSession(undefined);
    setSession(nextSession);
    setPayload(undefined);

    const tripLoad = (async () => {
      await withTimeout(cloudTripRepository.prepare(nextSession), 20_000, "La preparaciÃ³n del viaje tardÃ³ demasiado.");
      return withTimeout(cloudTripRepository.load(nextSession), 20_000, "La carga del viaje tardÃ³ demasiado.");
    })();

    setPhase("welcome");
    await sleep(650);
    setPhase("loading");
    const [nextPayload] = await Promise.all([tripLoad, sleep(700)]);
    setPayload(nextPayload);
    setPhase("ready");
  }, []);

  const restoreAccess = useCallback(async (nextSession: TravelAccessSession) => {
    if (nextSession.accessKind === "workspace") {
      setPayload(undefined);
      setSession(undefined);
      setWorkspaceSession(nextSession);
      setPhase("welcome");
      await sleep(650);
      setPhase("ready");
      return;
    }
    await openSession(nextSession);
  }, [openSession]);

  // Strict shared-device policy: every fresh application mount starts signed out.
  // The browser never silently restores the previous traveler from a cookie.
  useEffect(() => {
    if (!cloudConfigured) return;
    let cancelled = false;
    void fetch("/api/travel-session/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
      cache: "no-store",
    }).catch(() => undefined).finally(() => {
      if (!cancelled) {
        clearClientAccess();
        setPhase("login");
      }
    });
    return () => { cancelled = true; };
  }, [clearClientAccess, cloudConfigured]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/travel-session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: digits.join("") }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({})) as TravelAccessSession & { error?: string };
      setDigits(["", "", "", "", "", ""]);
      if (!response.ok) throw new Error(result.error ?? "No se pudo iniciar sesiÃ³n.");
      await restoreAccess(result);
    } catch (reason) {
      setPhase("login");
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesiÃ³n.");
      window.requestAnimationFrame(() => inputs.current[0]?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, currentIndex) => currentIndex === index ? digit : item));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };
  const keyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) inputs.current[index + 1]?.focus();
  };
  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""));
    inputs.current[Math.min(5, pasted.length)]?.focus();
  };

  const switchUser = async () => {
    const tripId = payload?.trip.id ?? session?.trip.id;
    await fetch("/api/travel-session/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
      cache: "no-store",
    }).catch(() => undefined);
    if (tripId) cloudTripRepository.clearTripState(tripId);
    clearClientAccess();
    setPhase("login");
    window.requestAnimationFrame(() => inputs.current[0]?.focus());
  };

  if (!cloudConfigured) return <TravelApp initialTrip={localSeedTrip} />;

  if (phase === "ready" && payload) return <TravelApp initialTrip={payload.trip} cloudSession={payload.session} onLogout={switchUser} />;
  if (phase === "ready" && workspaceSession) return <GuestWorkspaceView session={workspaceSession} onOpenSession={openSession} onLogout={switchUser} />;

  if (phase === "welcome") {
    const travelerName = session?.participant.name ?? workspaceSession?.profile.name ?? "viajero";
    const destination = session?.trip.name;
    return (
      <main className="auth-screen">
        <section className="welcome-card nioli-welcome-card" aria-live="polite">
          <Image className="auth-brand-seal" src="/brand/nioli-seal-transparent-v2.png" alt="NIOLI" width={320} height={320} sizes="92px" priority />
          <Image className="auth-welcome-brady" src="/nioli/official/brady/master.png" alt="" width={480} height={560} sizes="170px" priority />
          <p className="eyebrow">Brady te da la bienvenida</p>
          <h1>Â¡QuÃ© bueno verte, {travelerName}!</h1>
          <p>{destination ? `Todo listo para abrir ${destination}.` : "Tu espacio de NIOLI estÃ¡ listo."}</p>
        </section>
      </main>
    );
  }

  if (phase === "checking") return <NioliLoadingScreen title="Abriendo NIOLIâ€¦" detail="Preparando un inicio privado para ti." />;
  if (phase === "loading") return <NioliLoadingScreen title="Preparando tu aventuraâ€¦" detail="Brady estÃ¡ organizando tu viaje." />;

  return (
    <main className="auth-screen">
      <section className="login-card" aria-labelledby="login-title">
        <Image className="auth-brand-logo" src="/brand/nioli-logo-horizontal-transparent-v2.png" alt="NIOLI Â· Tu pasaporte al mundo" width={700} height={225} sizes="(max-width: 620px) calc(100vw - 60px), 350px" priority />
        <div className="auth-login-layout">
          <div className="auth-login-visual" aria-hidden="true">
            <span className="auth-route-line"><Plane size={20} /></span>
            <Image className="auth-brady" src="/nioli/official/brady/master.png" alt="" width={620} height={760} sizes="(max-width: 620px) 190px, 240px" priority />
            <span className="auth-passport-mark">NIOLI<br />PASSPORT</span>
          </div>
          <div className="auth-login-copy">
            <p className="eyebrow">Bienvenido a NIOLI</p>
            <h1 id="login-title">Tu viaje comienza aquÃ­</h1>
            <p className="login-intro"><LockKeyhole size={18} /> Ingresa tu PIN personal de seis dÃ­gitos.</p>
            <form onSubmit={submit}>
              <div className="pin-inputs" aria-label="PIN de 6 dÃ­gitos">
                {digits.map((digit, index) => <input key={index} ref={(element) => { inputs.current[index] = element; }} value={digit} onChange={(event) => setDigit(index, event.target.value)} onKeyDown={(event) => keyDown(index, event)} onPaste={paste} inputMode="numeric" autoComplete="off" pattern="[0-9]" maxLength={1} aria-label={`DÃ­gito ${index + 1}`} autoFocus={index === 0} disabled={submitting} />)}
              </div>
              {error ? <p className="auth-error" role="alert">{error}</p> : null}
              <button type="submit" className="primary-button auth-submit" disabled={submitting || digits.some((digit) => !digit)}>{submitting ? <><LoaderCircle className="auth-spinner" size={18} /> Entrandoâ€¦</> : "Entrar"}</button>
            </form>
            <small>Tu PIN no se guarda en este dispositivo. Cada nueva apertura de NIOLI requiere autenticarte.</small>
          </div>
        </div>
        <p className="auth-motto">Diferente paÃ­s, misma esencia. Viaja ligero. Vive profundo.</p>
      </section>
    </main>
  );
}

function NioliLoadingScreen({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="auth-screen">
      <section className="welcome-card nioli-loading-card" aria-live="polite" aria-busy="true">
        <div className="nioli-loading-mark" aria-hidden="true">
          <Image className="auth-brand-seal" src="/brand/nioli-seal-transparent-v2.png" alt="" width={320} height={320} sizes="104px" priority />
          <span className="nioli-flight-track" />
          <span className="nioli-flight-orbit"><Plane className="nioli-flight-plane" size={22} /></span>
        </div>
        <h1>{title}</h1>
        <p>{detail}</p>
      </section>
    </main>
  );
}

