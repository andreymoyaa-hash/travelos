import type { CompanionProfile, CountryId } from "@/types/travel";

export const companionProfiles: Record<CompanionProfile["id"], CompanionProfile> = {
  "japan-geek": { id: "japan-geek", name: "Pikachu", icon: "⚡", countryId: "japan", style: "Geek Mode opcional para Japón" },
  "travel-os": { id: "travel-os", name: "Compañero Travel OS", icon: "✦", countryId: "international", style: "Compañero internacional neutral" },
};

export const companionProfileForCountry = (countryId: CountryId): CompanionProfile =>
  countryId === "japan" ? companionProfiles["japan-geek"] : companionProfiles["travel-os"];
