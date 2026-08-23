import { japanTrip } from "@/data/japan-trip";
import { TravelApp } from "@/features/trips/travel-app";

export default function HomePage() {
  return <TravelApp initialTrip={japanTrip} />;
}
