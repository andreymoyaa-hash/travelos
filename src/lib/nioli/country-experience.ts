import { companionProfileForCountry } from "@/data/companion-profiles";
import { countryThemeById } from "@/data/countries";
import { passportTemplateForCountry } from "@/data/passport-templates";
import { getBradyActionAsset } from "@/lib/nioli/assets/helpers";
import { getCountryNioliBrand } from "@/lib/nioli/brand";
import { getProductionReadyCountryAssetPack } from "@/lib/nioli/assets/visual-qa";
import type { BradyAction, NioliCountryCode } from "@/lib/nioli/assets/types";
import type { CompanionProgress, CountryId } from "@/types/travel";

const COUNTRY_CODES: Readonly<Record<CountryId, NioliCountryCode | undefined>> = {
  japan: "JP",
  mexico: "MX",
  colombia: "CO",
  usa: "US",
  spain: "ES",
  chile: "CL",
  argentina: "AR",
  korea: "KR",
  "costa-rica": "CR",
  other: undefined,
};

const actionForMood: Readonly<Record<CompanionProgress["mood"], BradyAction>> = {
  curious: "exploring",
  happy: "celebrate",
  resting: "resting",
  excited: "passport",
};

export function countryCodeForCountryId(countryId: CountryId) {
  return COUNTRY_CODES[countryId];
}

export function getCountryExperience(countryId: CountryId) {
  const countryCode = countryCodeForCountryId(countryId);
  return {
    countryCode,
    theme: countryThemeById[countryId] ?? countryThemeById.other,
    passportTemplate: passportTemplateForCountry(countryId),
    companionProfile: companionProfileForCountry(countryId),
    assets: getProductionReadyCountryAssetPack(countryCode),
    brand: getCountryNioliBrand(countryCode),
  };
}

export function getContextualBradyAsset(mood: CompanionProgress["mood"]) {
  return getBradyActionAsset(actionForMood[mood]);
}
