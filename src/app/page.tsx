import { TravelAuthGate } from "@/features/auth/travel-auth-gate";
import { japan2026Trip } from "@/data/trips/japan-2026";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function HomePage() {
  return <TravelAuthGate cloudConfigured={isSupabaseConfigured()} localSeedTrip={japan2026Trip} />;
}
