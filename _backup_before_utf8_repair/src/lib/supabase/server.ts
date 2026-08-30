import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const TRAVEL_SESSION_COOKIE = "travel_session";
export const WORKSPACE_SESSION_COOKIE = "travel_workspace_session";
export const WORKSPACE_CONTEXT_COOKIE = "travel_workspace_context";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) throw new Error("Supabase no está configurado.");
  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export function createTravelClient(sessionToken?: string): SupabaseClient {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: sessionToken ? { headers: { "x-travel-session": sessionToken } } : undefined,
  });
}

export function createWorkspaceClient(sessionToken: string): SupabaseClient {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { headers: { "x-workspace-session": sessionToken } },
  });
}

export async function callPinLogin(pin: string) {
  const { url, publishableKey } = getSupabaseConfig();
  const response = await fetch(`${url}/functions/v1/access-login`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ error: "invalid_response" })) as Record<string, unknown>;
  return { response, payload };
}
