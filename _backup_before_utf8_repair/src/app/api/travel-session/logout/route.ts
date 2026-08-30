import { NextResponse } from "next/server";

import { createTravelClient, createWorkspaceClient, TRAVEL_SESSION_COOKIE, WORKSPACE_CONTEXT_COOKIE, WORKSPACE_SESSION_COOKIE } from "@/lib/supabase/server";
import { readTravelSessionToken, readWorkspaceSessionToken } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = await readTravelSessionToken();
  const workspaceToken = await readWorkspaceSessionToken();
  const body = await request.json().catch(() => ({})) as { all?: boolean };
  let invalidated = false;
  if (token) {
    const { error } = await createTravelClient(token).schema("app").rpc("logout_current_session");
    invalidated = !error;
  }
  const closeWorkspace = Boolean(body.all) || (!token && Boolean(workspaceToken));
  let workspaceInvalidated = false;
  if (closeWorkspace && workspaceToken) {
    const { error } = await createWorkspaceClient(workspaceToken).schema("app").rpc("logout_guest_workspace_session");
    workspaceInvalidated = !error;
  }
  const response = NextResponse.json({ invalidated, workspaceInvalidated, workspaceAvailable: Boolean(workspaceToken) && !closeWorkspace });
  response.cookies.set(TRAVEL_SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  if (closeWorkspace) {
    response.cookies.set(WORKSPACE_SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
    response.cookies.set(WORKSPACE_CONTEXT_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  }
  return response;
}
