import { NextResponse } from "next/server";

import { createTravelClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

interface SetupRow {
  invitation_type: "trip_companion" | "independent_traveler";
  invitation_status: "ready" | "expired" | "used" | "revoked";
  inviter_name: string;
  target_name: string;
  trip_name: string | null;
  expires_at: string;
}

interface SetupBody {
  action?: unknown;
  token?: unknown;
  pin?: unknown;
}

function setupJson(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}

function validToken(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function setupError(message: string) {
  if (/setup_token_used/i.test(message)) return { status: 409, code: "used" };
  if (/setup_token_expired|access_expired/i.test(message)) return { status: 410, code: "expired" };
  if (/setup_token_revoked/i.test(message)) return { status: 410, code: "revoked" };
  if (/invalid_pin_format/i.test(message)) return { status: 400, code: "invalid_pin" };
  if (/weak_pin/i.test(message)) return { status: 400, code: "weak_pin" };
  if (/pin_in_use/i.test(message)) return { status: 409, code: "pin_in_use" };
  return { status: 400, code: "invalid" };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as SetupBody | null;
  if (!validToken(body?.token)) return setupJson({ error: "invalid" }, 400);

  if (body?.action === "inspect") {
    try {
      const result = await createTravelClient().schema("app").rpc(
        "inspect_access_setup_invitation",
        { p_setup_token: body.token },
      );
      if (result.error) throw result.error;
      const row = (result.data ?? [])[0] as SetupRow | undefined;
      if (!row) return setupJson({ status: "invalid" }, 404);
      return setupJson({
        type: row.invitation_type,
        status: row.invitation_status,
        inviterName: row.inviter_name,
        targetName: row.target_name,
        tripName: row.trip_name,
        expiresAt: row.expires_at,
      });
    } catch {
      return setupJson({ status: "unavailable" }, 503);
    }
  }

  if (body?.action === "complete" && typeof body.pin === "string") {
    try {
      const result = await createTravelClient().schema("app").rpc(
        "complete_access_setup_invitation",
        { p_setup_token: body.token, p_pin: body.pin },
      );
      if (result.error) {
        const mapped = setupError(result.error.message);
        return setupJson({ error: mapped.code }, mapped.status);
      }
      const row = (result.data ?? [])[0] as {
        access_kind?: "trip" | "workspace";
        display_name?: string;
      } | undefined;
      if (!row?.access_kind) return setupJson({ error: "invalid" }, 502);
      return setupJson({ activated: true, accessKind: row.access_kind });
    } catch {
      return setupJson({ error: "unavailable" }, 503);
    }
  }

  return setupJson({ error: "invalid" }, 400);
}
