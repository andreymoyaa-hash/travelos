import { countryAssetPacks, genericCountryAssetPack } from "@/lib/nioli/assets/manifest";
import type {
  CountryAssetPack,
  NioliAssetCollection,
  NioliAssetPath,
  NioliCountryCode,
  OptionalNioliAsset,
  PassportAssetSet,
  PatternAssetSet,
} from "@/lib/nioli/assets/types";

const PRODUCTION_READY_COUNTRY_ASSETS = [
  "/nioli/countries/jp/stamps/stamp-kyoto.webp",
  "/nioli/countries/jp/stamps/stamp-nara.webp",
  "/nioli/countries/jp/stamps/stamp-osaka.webp",
  "/nioli/countries/jp/stamps/stamp-ramen.webp",
  "/nioli/countries/jp/stamps/stamp-sakura-season.webp",
  "/nioli/countries/jp/stamps/stamp-shinkansen.webp",
  "/nioli/countries/jp/stamps/stamp-temple.webp",
  "/nioli/countries/jp/stamps/stamp-tokyo.webp",
  "/nioli/countries/jp/tickets/ticket-primary.webp",
  "/nioli/countries/jp/tickets/ticket-secondary.webp",
  "/nioli/countries/mx/stamps/stamp-cenotes.webp",
  "/nioli/countries/mx/stamps/stamp-tacos.webp",
  "/nioli/countries/co/passport/passport-cover.webp",
  "/nioli/countries/co/stamps/stamp-cali.webp",
  "/nioli/countries/co/stamps/stamp-cartagena.webp",
  "/nioli/countries/co/stamps/stamp-guatape.webp",
  "/nioli/countries/co/stamps/stamp-medellin.webp",
  "/nioli/countries/co/stamps/stamp-tayrona.webp",
  "/nioli/countries/co/tickets/ticket-secondary.webp",
  "/nioli/countries/us/passport/passport-cover.webp",
  "/nioli/countries/us/stamps/stamp-chicago.webp",
  "/nioli/countries/us/stamps/stamp-diner.webp",
  "/nioli/countries/us/stamps/stamp-grand-canyon.webp",
  "/nioli/countries/us/tickets/ticket-primary.webp",
  "/nioli/countries/us/tickets/ticket-secondary.webp",
  "/nioli/countries/us/badges/badge-secondary.webp",
  "/nioli/countries/es/passport/passport-cover.webp",
  "/nioli/countries/es/stamps/stamp-sevilla.webp",
  "/nioli/countries/es/stamps/stamp-tapas.webp",
  "/nioli/countries/es/stamps/stamp-valencia.webp",
  "/nioli/countries/es/tickets/ticket-secondary.webp",
  "/nioli/countries/cl/tickets/ticket-secondary.webp",
  "/nioli/countries/ar/stamps/stamp-cordoba.webp",
  "/nioli/countries/ar/badges/badge-primary.webp",
  "/nioli/countries/kr/tickets/ticket-primary.webp",
  "/nioli/countries/kr/tickets/ticket-secondary.webp",
  "/nioli/countries/cr/stamps/stamp-adventure.webp",
  "/nioli/countries/cr/stamps/stamp-beaches.webp",
  "/nioli/countries/cr/stamps/stamp-coffee.webp",
  "/nioli/countries/cr/stamps/stamp-pura-vida.webp",
  "/nioli/countries/cr/stamps/stamp-rainforest.webp",
  "/nioli/countries/cr/stamps/stamp-volcanos.webp",
  "/nioli/countries/cr/stamps/stamp-waterfalls.webp",
  "/nioli/countries/cr/stamps/stamp-wildlife.webp",
  "/nioli/countries/cr/badges/badge-secondary.webp",
] as const satisfies readonly NioliAssetPath[];

export const NIOLI_PRODUCTION_READY_COUNTRY_ASSET_PATHS: ReadonlySet<NioliAssetPath> = new Set(
  PRODUCTION_READY_COUNTRY_ASSETS,
);

function compactPackAssets(pack: CountryAssetPack): NioliAssetPath[] {
  return [
    pack.passport.cover,
    pack.passport.inside,
    pack.passport.back,
    pack.stamps.primary,
    ...pack.stamps.items,
    pack.tickets.primary,
    ...pack.tickets.items,
    pack.badges.primary,
    ...pack.badges.items,
    pack.patterns.primary,
    pack.patterns.secondary,
    ...pack.patterns.items,
    pack.decorations.primary,
    ...pack.decorations.items,
    pack.brady.primary,
    ...pack.brady.items,
    pack.luggageTag,
    pack.boardingPass,
    pack.countryCodeLabel,
    pack.bonusAssets.primary,
    ...pack.bonusAssets.items,
  ].filter((asset): asset is NioliAssetPath => Boolean(asset));
}

export const NIOLI_BLOCKING_ASSET_PATHS: ReadonlySet<NioliAssetPath> = new Set(
  Object.values(countryAssetPacks)
    .flatMap(compactPackAssets)
    .filter((asset) => !NIOLI_PRODUCTION_READY_COUNTRY_ASSET_PATHS.has(asset)),
);

export function isProductionReadyNioliAsset(asset: OptionalNioliAsset): asset is NioliAssetPath {
  if (!asset || asset.startsWith("/nioli/refs/")) return false;
  if (asset.startsWith("/nioli/brady/")) return true;
  return NIOLI_PRODUCTION_READY_COUNTRY_ASSET_PATHS.has(asset);
}

export function getSafeNioliAsset(asset: OptionalNioliAsset): OptionalNioliAsset {
  return isProductionReadyNioliAsset(asset) ? asset : null;
}

function safeCollection(collection: NioliAssetCollection): NioliAssetCollection {
  return {
    ...collection,
    primary: getSafeNioliAsset(collection.primary),
    items: collection.items.filter(isProductionReadyNioliAsset),
  };
}

function safePassport(passport: PassportAssetSet): PassportAssetSet {
  return {
    ...passport,
    cover: getSafeNioliAsset(passport.cover),
    inside: getSafeNioliAsset(passport.inside),
    back: getSafeNioliAsset(passport.back),
  };
}

function safePatterns(patterns: PatternAssetSet): PatternAssetSet {
  return {
    ...patterns,
    primary: getSafeNioliAsset(patterns.primary),
    secondary: getSafeNioliAsset(patterns.secondary),
    items: patterns.items.filter(isProductionReadyNioliAsset),
  };
}

function sanitizeCountryPack(pack: CountryAssetPack): CountryAssetPack {
  return {
    ...pack,
    passport: safePassport(pack.passport),
    stamps: safeCollection(pack.stamps),
    tickets: safeCollection(pack.tickets),
    badges: safeCollection(pack.badges),
    patterns: safePatterns(pack.patterns),
    decorations: safeCollection(pack.decorations),
    brady: safeCollection(pack.brady),
    luggageTag: getSafeNioliAsset(pack.luggageTag),
    boardingPass: getSafeNioliAsset(pack.boardingPass),
    countryCodeLabel: getSafeNioliAsset(pack.countryCodeLabel),
    bonusAssets: safeCollection(pack.bonusAssets),
    cities: Object.fromEntries(Object.entries(pack.cities).map(([city, assets]) => [city, safeCollection(assets)])),
  };
}

const SAFE_COUNTRY_PACKS = Object.fromEntries(
  Object.entries(countryAssetPacks).map(([countryCode, pack]) => [countryCode, sanitizeCountryPack(pack)]),
) as Readonly<Record<NioliCountryCode, CountryAssetPack>>;

export function getProductionReadyCountryAssetPack(countryCode?: string | null): CountryAssetPack {
  const normalized = countryCode?.trim().toUpperCase() as NioliCountryCode | undefined;
  return normalized && normalized in SAFE_COUNTRY_PACKS ? SAFE_COUNTRY_PACKS[normalized] : genericCountryAssetPack;
}
