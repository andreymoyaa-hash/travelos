"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";

type InvitationStatus = "loading" | "ready" | "expired" | "used" | "revoked" | "invalid" | "unavailable" | "complete";

interface InvitationDetails {
  type: "trip_companion" | "independent_traveler";
  inviterName: string;
  targetName: string;
  tripName?: string;
}

function SetupBrand() {
  return <Image className="auth-brand-logo" src="/brand/nioli-logo-horizontal-transparent-v2.png" alt="NIOLI Â· Tu pasaporte al mundo" width={700} height={225} sizes="(max-width: 620px) calc(100vw - 60px), 350px" priority />;
}

const statusCopy: Partial<Record<InvitationStatus, { title: string; detail: string }>> = {
  expired: { title: "Esta invitaciÃ³n venciÃ³", detail: "Solicita una nueva invitaciÃ³n." },
  used: { title: "Esta invitaciÃ³n ya fue utilizada", detail: "Puedes iniciar sesiÃ³n con el PIN que elegiste." },
  revoked: { title: "Esta invitaciÃ³n ya no es vÃ¡lida", detail: "Solicita una nueva invitaciÃ³n." },
  invalid: { title: "No encontramos esta invitaciÃ³n", detail: "Revisa que el enlace estÃ© completo o solicita uno nuevo." },
  unavailable: { title: "No pudimos revisar la invitaciÃ³n", detail: "Intenta de nuevo en unos minutos." },
};

function pinError(code: string | undefined) {
  if (code === "weak_pin") return "Elige un PIN menos fÃ¡cil de adivinar.";
  if (code === "pin_in_use") return "Ese PIN ya estÃ¡ en uso. Elige uno diferente.";
  if (code === "used") return "Esta invitaciÃ³n ya fue utilizada.";
  if (code === "expired") return "Esta invitaciÃ³n venciÃ³. Solicita una nueva.";
  if (code === "revoked") return "Esta invitaciÃ³n ya no es vÃ¡lida.";
  if (code === "unavailable") return "NIOLI no estÃ¡ disponible en este momento.";
  return "No se pudo activar el acceso. Revisa el PIN e intenta de nuevo.";
}

export function SetupAccessView() {
  const tokenRef = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [details, setDetails] = useState<InvitationDetails>();
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let token = tokenRef.current;
    if (!token) {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const candidate = fragment.get("token");
      token = candidate && /^[0-9a-f]{64}$/.test(candidate) ? candidate : undefined;
      tokenRef.current = token;
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }

    if (!token) {
      const task = window.setTimeout(() => setStatus("invalid"), 0);
      return () => window.clearTimeout(task);
    }

    const controller = new AbortController();
    void fetch("/api/travel-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "inspect", token }),
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    }).then(async (response) => {
      const payload = await response.json() as InvitationDetails & { status?: InvitationStatus };
      if (!response.ok || payload.status !== "ready") {
        setStatus(payload.status ?? "invalid");
        return;
      }
      setDetails(payload);
      setStatus("ready");
    }).catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setStatus("unavailable");
    });
    return () => controller.abort();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    if (!/^\d{6}$/.test(pin)) {
      setError("El PIN debe tener exactamente 6 dÃ­gitos.");
      return;
    }
    if (pin !== confirmation) {
      setError("Los PIN no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const token = tokenRef.current;
      if (!token) throw new Error("invalid");
      const response = await fetch("/api/travel-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", token, pin }),
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });
      const payload = await response.json() as { activated?: boolean; error?: string };
      setPin("");
      setConfirmation("");
      if (!response.ok || !payload.activated) throw new Error(payload.error);
      tokenRef.current = undefined;
      setStatus("complete");
    } catch (reason) {
      setError(pinError(reason instanceof Error ? reason.message : undefined));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return <main className="auth-screen"><section className="login-card setup-card" aria-live="polite"><SetupBrand /><LoaderCircle className="auth-spinner" size={30} /><h1>Preparando tu invitaciÃ³n</h1></section></main>;
  }

  if (status === "complete") {
    return <main className="auth-screen"><section className="login-card setup-card"><SetupBrand /><CheckCircle2 size={42} className="setup-success" /><h1>Tu acceso estÃ¡ activo</h1><p>Ya puedes iniciar sesiÃ³n normalmente con el PIN que elegiste.</p><Link href="/" className="primary-button">Ir a iniciar sesiÃ³n</Link></section></main>;
  }

  if (status !== "ready" || !details) {
    const copy = statusCopy[status] ?? statusCopy.invalid!;
    return <main className="auth-screen"><section className="login-card setup-card"><SetupBrand /><h1>{copy.title}</h1><p>{copy.detail}</p><Link href="/" className="secondary-button">Volver a NIOLI</Link></section></main>;
  }

  const welcome = details.type === "trip_companion"
    ? `${details.inviterName} te invitÃ³ a acompaÃ±arle en ${details.tripName ?? "su viaje"}.`
    : "Tu espacio de NIOLI estÃ¡ listo.";

  return (
    <main className="auth-screen">
      <section className="login-card setup-card" aria-labelledby="setup-title">
        <SetupBrand />
        <p className="eyebrow">Bienvenido a NIOLI</p>
        <h1 id="setup-title">Hola, {details.targetName}</h1>
        <p>{welcome}</p>
        <p className="login-intro"><KeyRound size={16} /> Crea tu PIN personal de 6 dÃ­gitos.</p>
        <form onSubmit={submit}>
          <label>Crea tu PIN de 6 dÃ­gitos<input className="setup-pin-field" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus /></label>
          <label>Confirmar PIN<input className="setup-pin-field" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{6}" maxLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" className="primary-button auth-submit" disabled={submitting}>{submitting ? <><LoaderCircle className="auth-spinner" size={17} /> Activandoâ€¦</> : "Activar mi acceso"}</button>
        </form>
        <small>Tu PIN no se comparte con quien te invitÃ³.</small>
      </section>
    </main>
  );
}

