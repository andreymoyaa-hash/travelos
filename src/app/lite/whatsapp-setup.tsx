"use client";

import { useEffect, useState } from "react";
import { buildLiteAlerts } from "@/lib/lite-alerts";

type State = { configured: boolean; recipients: { andy: boolean; jose: boolean }; sandbox: boolean; templateConfigured: boolean; enabled: boolean };
type Person = "andy" | "jose";

export default function WhatsAppSetup() {
  const [status, setStatus] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<Person | null>(null);
  const [message, setMessage] = useState("");
  const [showPlan, setShowPlan] = useState(false);
  const planned = buildLiteAlerts();
  const nextAlerts = planned.filter(item => Date.parse(item.whenUTC) > Date.now()).slice(0, 7);

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
    <p className="mt-1 text-sm text-green-900">Los dos WhatsApp recibieron pruebas. La agenda está preparada en horario de Japón; los envíos automáticos requieren un remitente de producción y una plantilla autorizada.</p>
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
    <button type="button" onClick={() => setShowPlan(value => !value)}
      aria-expanded={showPlan}
      className="mt-3 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-semibold text-green-900">
      {showPlan ? "Ocultar próximos recordatorios" : "Ver próximos recordatorios (JST)"}
    </button>
    {showPlan && <div className="mt-3 space-y-2">
      {nextAlerts.length === 0 ? <p className="text-xs text-green-900">No hay avisos próximos.</p> :
        nextAlerts.map(item => <div key={item.id} className="rounded-lg bg-white p-2 text-sm text-green-950">
          <p className="font-semibold">{new Intl.DateTimeFormat("es-CR", { timeZone: "Asia/Tokyo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(item.whenUTC))} · {item.description}</p>
          <p className="mt-1 text-xs text-green-800">{item.kind === "morning" ? "Resumen diario" : "Aviso " + item.advanceMinutes + " min antes"} · Solo planificación, envío desactivado</p>
        </div>)}
      <p className="text-xs text-green-800">DisneySea no se incluye como entrada confirmada hasta registrar la compra.</p>
    </div>}
    {message && <p role="status" className="mt-2 text-sm text-green-900">{message}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
