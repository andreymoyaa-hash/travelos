"use client";

import { useEffect, useState } from "react";

type State = { configured: boolean; recipients: { andy: boolean; jose: boolean }; sandbox: boolean; templateConfigured: boolean; enabled: boolean };
type Person = "andy" | "jose";

export default function WhatsAppSetup() {
  const [status, setStatus] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<Person | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lite-whatsapp", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw Error("No se pudo comprobar Twilio.");
        return response.json() as Promise<State>;
      })
      .then(value => { if (!cancelled) setStatus(value); })
      .catch(() => { if (!cancelled) setError("Inicia sesión con tu PIN de editor para ver Twilio."); });
    return () => { cancelled = true; };
  }, []);

  async function test(recipient: Person) {
    setSending(recipient); setMessage(""); setError("");
    try {
      const response = await fetch("/api/lite-whatsapp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient }),
      });
      const data: { note?: string; error?: string; twilioCode?: number; sentFieldNames?: string[]; twilioMessage?: string; requestMode?: string } = await response.json();
      if (!response.ok) throw Error((data.error || "Twilio rechazó el envío.") +
        (data.twilioCode ? " · Código Twilio " + data.twilioCode : "") +
        (data.sentFieldNames?.length ? " · Campos enviados: " + data.sentFieldNames.join(", ") : "") +
        (data.twilioMessage ? " · Twilio: " + data.twilioMessage : ""));
      setMessage("Twilio aceptó la prueba para " + (recipient === "andy" ? "Andy" : "José") +
        ". Confirma que haya llegado al teléfono.");
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión."); }
    finally { setSending(null); }
  }

  return <section className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
    <h3 className="font-bold text-green-950">Recordatorios por WhatsApp</h3>
    <p className="mt-1 text-sm text-green-900">Sandbox de Andy y José. Primero confirma que cada teléfono recibe su mensaje de prueba; los recordatorios automáticos permanecen desactivados.</p>
    {status && <p className="mt-2 text-xs font-semibold text-green-950">
      {!status.configured ? "Pendiente: configurar las claves y ambos números de Twilio en Vercel." : status.templateConfigured ? "Twilio y plantilla configurados · pruebas manuales disponibles" : "Falta TWILIO_WHATSAPP_CONTENT_SID (plantilla HX oficial de recordatorio) en Preview de Vercel."}
    </p>}
    {status?.configured && status.templateConfigured && <div className="mt-3 flex gap-2">
      <button type="button" disabled={sending !== null} onClick={() => void test("andy")} className="rounded-lg bg-green-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {sending === "andy" ? "Enviando…" : "Probar con Andy"}
      </button>
      <button type="button" disabled={sending !== null} onClick={() => void test("jose")} className="rounded-lg bg-green-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {sending === "jose" ? "Enviando…" : "Probar con José"}
      </button>
    </div>}
    {message && <p role="status" className="mt-2 text-sm text-green-900">{message}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
