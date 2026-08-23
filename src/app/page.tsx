import { japan2026Trip } from "@/data/trips/japan-2026";
import { TravelApp } from "@/features/trips/travel-app";

export default function HomePage() {
  return <TravelApp initialTrip={japan2026Trip} />;
}
