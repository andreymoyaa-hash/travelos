import type { CompanionProfile, CountryId } from "@/types/travel";

export const companionProfiles: Record<CompanionProfile["id"], CompanionProfile> = {
  "japan-geek": { id: "japan-geek", name: "Brady · Geek Mode", icon: "🧭", countryId: "japan", style: "Brady con contexto geek opcional para Japón" },
  "travel-os": { id: "travel-os", name: "Brady", icon: "🧭", countryId: "international", style: "Compañero internacional de NIOLI" },
};

export const companionProfileForCountry = (countryId: CountryId): CompanionProfile =>
  countryId === "japan" ? companionProfiles["japan-geek"] : companionProfiles["travel-os"];
