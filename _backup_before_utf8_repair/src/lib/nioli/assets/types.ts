export const NIOLI_COUNTRY_CODES = ["JP", "MX", "CO", "US", "ES", "CL", "AR", "KR", "CR"] as const;

export const BRADY_EXPRESSIONS = [
  "neutral",
  "happy",
  "curious",
  "sleepy",
  "excited",
  "proud",
  "worried",
  "confused",
] as const;

export const BRADY_ACTIONS = [
  "camera",
  "map",
  "pointing",
  "passport",
  "celebrate",
  "exploring",
  "planning",
  "resting",
] as const;

export const BRADY_STATES = [
  "offline",
  "loading",
  "syncing",
  "emptyTrip",
  "newStamp",
  "tripComplete",
] as const;

export type NioliCountryCode = (typeof NIOLI_COUNTRY_CODES)[number];
export type BradyExpression = (typeof BRADY_EXPRESSIONS)[number];
export type BradyAction = (typeof BRADY_ACTIONS)[number];
export type BradyState = (typeof BRADY_STATES)[number];

export type NioliAssetPath = `/${string}`;
export type OptionalNioliAsset = NioliAssetPath | null;

export interface NioliAssetCollection {
  assetRoot: NioliAssetPath;
  primary: OptionalNioliAsset;
  items: readonly NioliAssetPath[];
}

export interface BradyIndividualAssetGroups {
  base: Readonly<Record<string, NioliAssetPath>>;
  actions: Readonly<Record<string, NioliAssetPath>>;
  states: Readonly<Record<string, NioliAssetPath>>;
}

export interface BradyAssetSet {
  assetRoot: NioliAssetPath;
  individual: BradyIndividualAssetGroups;
  base: Readonly<Record<"neutral" | "standing" | "resting" | "backpack", OptionalNioliAsset>>;
  heads: Readonly<Record<"neutral", OptionalNioliAsset>>;
  expressions: Readonly<Record<BradyExpression, OptionalNioliAsset>>;
  actions: Readonly<Record<BradyAction, OptionalNioliAsset>>;
  states: Readonly<Record<BradyState, OptionalNioliAsset>>;
  mini: Readonly<{
    neutral: OptionalNioliAsset;
    avatar128: OptionalNioliAsset;
    avatar256: OptionalNioliAsset;
  }>;
}

export interface PassportAssetSet {
  assetRoot: NioliAssetPath;
  cover: OptionalNioliAsset;
  inside: OptionalNioliAsset;
  back: OptionalNioliAsset;
}

export type StampAssetSet = NioliAssetCollection;

export type TicketAssetSet = NioliAssetCollection;

export interface PatternAssetSet {
  assetRoot: NioliAssetPath;
  primary: OptionalNioliAsset;
  secondary: OptionalNioliAsset;
  items: readonly NioliAssetPath[];
}

export interface CountryAssetPack {
  countryCode: NioliCountryCode | "INTERNATIONAL";
  assetRoot: NioliAssetPath;
  passport: PassportAssetSet;
  stamps: StampAssetSet;
  tickets: TicketAssetSet;
  badges: NioliAssetCollection;
  patterns: PatternAssetSet;
  decorations: NioliAssetCollection;
  brady: NioliAssetCollection;
  luggageTag: OptionalNioliAsset;
  boardingPass: OptionalNioliAsset;
  countryCodeLabel: OptionalNioliAsset;
  bonusAssets: NioliAssetCollection;
  cities: Readonly<Record<string, NioliAssetCollection>>;
}
