import { NextResponse } from "next/server";
import { getTravelSession, readTravelSessionToken } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Recipient = "andy" | "jose";

function configured() {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_WHATSAPP_FROM || "";
  const numbers: Record<Recipient, string> = {
    andy: process.env.TWILIO_WHATSAPP_TO_ANDY || "",
    jose: process.env.TWILIO_WHATSAPP_TO_JOSE || "",
  };
  const valid = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);
  return {
    sid, token, from, numbers,
    ready: /^AC[a-f\d]{32}$/i.test(sid) && token.length > 10 && valid(from) &&
      valid(numbers.andy) && valid(numbers.jose),
  };
}

async function authorized() {
  const sessionToken = await readTravelSessionToken();
  if (!sessionToken) return false;
  try {
    const session = await getTravelSession(sessionToken);
    return session.trip.slug === "japan-2026" &&
      (session.participant.role === "owner" || session.participant.role === "editor");
  } catch { return false; }
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  try { return !!origin && !!host && new URL(origin).host === host &&
    (new URL(origin).protocol === "https:" || host.startsWith("localhost")); }
  catch { return false; }
}
function status() {
  const c = configured();
  return { configured: c.ready, recipients: {
    andy: Boolean(c.numbers.andy), jose: Boolean(c.numbers.jose),
  }, sandbox: true,
  enabled: false };
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Se requiere el PIN de editor." }, { status: 401 });
  return NextResponse.json(status(), { headers: { "Cache-Control": "no-store" } });
}

// This endpoint only sends a manually approved SINGLE test. Automated sending
// remains disabled until a production sender and approved template are ready.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  if (!(await authorized())) return NextResponse.json({ error: "Se requiere el PIN de editor." }, { status: 401 });
  const cfg = configured();
  if (!cfg.ready) return NextResponse.json({ error: "Faltan las variables privadas de Twilio en Vercel." }, { status: 503 });
  let recipient: Recipient;
  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || !("recipient" in data)) throw Error();
    const name = (data as { recipient: unknown }).recipient;
    if (name !== "andy" && name !== "jose") throw Error();
    recipient = name;
  } catch { return NextResponse.json({ error: "Destinatario inválido." }, { status: 400 }); }

  const form = new URLSearchParams();
  form.set("From", "whatsapp:" + cfg.from);
  form.set("To", "whatsapp:" + cfg.numbers[recipient]);
  // Sandbox diagnostic: always send a freeform Body only, never ContentVariables.
  // This requires a WhatsApp message from the recipient within the preceding 24h.
  form.set("Body", "Nioli Lite: mensaje de prueba para " + (recipient === "andy" ? "Andy" : "José") +
    ". Los recordatorios automáticos aún no están activos.");

  try {
    const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + cfg.sid + "/Messages.json", {
      method: "POST", cache: "no-store",
      headers: {
        "Authorization": "Basic " + Buffer.from(cfg.sid + ":" + cfg.token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form, signal: AbortSignal.timeout(12000),
    });
    const data: unknown = await response.json();
    const result = data && typeof data === "object" ? data as Record<string, unknown> : {};
    if (!response.ok) {
      const code = typeof result.code === "number" ? result.code : null;
      const messages: Record<number, string> = {
        21654: "Twilio exige un ContentSid para variables de plantilla. Esta prueba envía solo Body; revisa el detalle del intento en la consola si persiste.",
        63007: "El número remitente no corresponde al Sandbox de esta cuenta de Twilio.",
        63015: "El destinatario no está unido a este Sandbox o su inscripción caducó.",
        63016: "Pasó la ventana de 24 horas para mensajes libres. Envía un WhatsApp al Sandbox y repite la prueba.",
        21211: "El número de destino tiene formato incorrecto.",
        21608: "El número de destino no está verificado para esta cuenta de prueba.",
        20003: "Twilio rechazó las credenciales o la cuenta no tiene permiso.",
      };
      // Only show non-sensitive field NAMES and a sanitized Twilio message.
      // Never return credentials, message content, phone numbers, or API response data.
      const rawMessage = typeof result.message === "string" ? result.message : "";
      const safeMessage = rawMessage
        .replace(/(?:whatsapp:)?\\+\\d[\\d\\s().-]{6,}/gi, "[número oculto]")
        .replace(/(?:AC|SK|HX|SM)[a-f0-9]{32}/gi, "[identificador oculto]")
        .replace(/https?:\\/\\/\\S+/gi, "[enlace oculto]")
        .slice(0, 280);
      return NextResponse.json({
        error: code !== null && messages[code] ? messages[code] : "Twilio rechazó el envío. Consulta el código de error para identificar el motivo.",
        twilioCode: code,
        httpStatus: response.status,
        requestMode: "sandbox-body-only",
        sentFieldNames: [...form.keys()],
        twilioMessage: safeMessage,
      }, { status: 502 });
    }
    return NextResponse.json({
      accepted: true,
      recipient,
      twilioStatus: typeof result.status === "string" ? result.status : "queued",
      note: "Twilio aceptó el envío. Confirma la recepción en WhatsApp.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "No se pudo contactar con Twilio." }, { status: 502 }); }
}
