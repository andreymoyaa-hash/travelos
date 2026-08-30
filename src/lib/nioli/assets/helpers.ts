import { bradyAssets, countryAssetPacks, genericCountryAssetPack } from "@/lib/nioli/assets/manifest";
import {
  NIOLI_COUNTRY_CODES,
  type BradyAction,
  type BradyExpression,
  type BradyState,
  type CountryAssetPack,
  type NioliCountryCode,
  type OptionalNioliAsset,
  type PassportAssetSet,
  type PatternAssetSet,
  type StampAssetSet,
} from "@/lib/nioli/assets/types";
export { getProductionReadyCountryAssetPack, getSafeNioliAsset, isProductionReadyNioliAsset } from "@/lib/nioli/assets/visual-qa";

export function isNioliCountryCode(value: string): value is NioliCountryCode {
  return NIOLI_COUNTRY_CODES.includes(value as NioliCountryCode);
}

export function getCountryAssetPack(countryCode?: string | null): CountryAssetPack {
  const normalized = countryCode?.trim().toUpperCase() ?? "";
  return isNioliCountryCode(normalized) ? countryAssetPacks[normalized] : genericCountryAssetPack;
}

export function getBradyExpressionAsset(expression: BradyExpression): OptionalNioliAsset {
  return bradyAssets.expressions[expression] ?? bradyAssets.base.neutral;
}

export function getBradyActionAsset(action: BradyAction): OptionalNioliAsset {
  return bradyAssets.actions[action] ?? bradyAssets.base.neutral;
}

export function getBradyStateAsset(state: BradyState): OptionalNioliAsset {
  return bradyAssets.states[state] ?? bradyAssets.base.neutral;
}

export function getPassportAssets(countryCode?: string | null): PassportAssetSet {
  return getCountryAssetPack(countryCode).passport;
}

export function getStampAssets(countryCode?: string | null): StampAssetSet {
  return getCountryAssetPack(countryCode).stamps;
}

export function getPatternAssets(countryCode?: string | null): PatternAssetSet {
  return getCountryAssetPack(countryCode).patterns;
}
