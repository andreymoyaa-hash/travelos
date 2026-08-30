import { NextResponse } from "next/server";

import { TRAVEL_SESSION_COOKIE, WORKSPACE_CONTEXT_COOKIE, WORKSPACE_SESSION_COOKIE } from "@/lib/supabase/server";
import { getTravelSession, getTravelWorkspaceSession, readTravelSessionToken, readWorkspaceSessionToken } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const tripToken = await readTravelSessionToken();
  const workspaceToken = await readWorkspaceSessionToken();
  if (tripToken) {
    try {
      const session = await getTravelSession(tripToken);
      if (workspaceToken) {
        const workspace = await getTravelWorkspaceSession(workspaceToken).catch(() => undefined);
        if (workspace) session.workspace = { id: workspace.workspace.id, name: workspace.workspace.name };
      }
      return NextResponse.json(session);
    } catch {
      // An expired trip session may still belong to a valid guest workspace.
    }
  }
  if (workspaceToken) {
    try {
      const response = NextResponse.json(await getTravelWorkspaceSession(workspaceToken));
      response.cookies.set(TRAVEL_SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
      return response;
    } catch {
      // Missing/expired access is a normal signed-out state.
    }
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(TRAVEL_SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  response.cookies.set(WORKSPACE_SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  response.cookies.set(WORKSPACE_CONTEXT_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
