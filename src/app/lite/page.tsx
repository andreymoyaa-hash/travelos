import { getTravelSession, readTravelSessionToken } from "@/lib/supabase/session";
import LiteApp from "./lite-app";
import LitePinGate from "./pin-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NioliLitePage() {
  let authorized = false;
  try {
    const token = await readTravelSessionToken();
    if (token) {
      const session = await getTravelSession(token);
      authorized = session.accessKind === "trip" && session.trip.slug === "japan-2026";
    }
  } catch {
    // An absent, expired, or invalid PIN session must never render the itinerary.
  }

  return authorized ? <LiteApp /> : <LitePinGate />;
}
