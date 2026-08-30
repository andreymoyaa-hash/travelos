import type { CountryId } from "@/types/travel";

export const OFFICIAL_COUNTRY_CODES = ["jp", "co", "mx", "kr", "us"] as const;
export type OfficialCountryCode = (typeof OFFICIAL_COUNTRY_CODES)[number];

const COUNTRY_CODE_BY_ID: Partial<Record<CountryId, OfficialCountryCode>> = {
  japan: "jp",
  colombia: "co",
  mexico: "mx",
  korea: "kr",
  usa: "us",
};

const STAMP_SLUGS: Record<OfficialCountryCode, readonly string[]> = {
  jp: [
    "shinkansen", "torii", "ramen", "temple", "onsen",
    "sushi", "shibuya", "sakura", "akihabara", "tokyo-tower",
    "okonomiyaki", "ryokan", "mount-fuji", "matcha", "karaoke",
    "castle", "konbini", "metro", "takoyaki", "kyoto",
  ],
  co: [
    "cafe-colombiano", "monserrate", "getsemani", "metrocable", "arepa",
    "pueblo-colorido", "bandeja-paisa", "salsa", "cartagena", "palmas-cera",
    "empanadas", "ajiaco", "penol", "comuna-13", "candelaria",
    "finca-cafetera", "oblea", "arte-urbano", "barichara", "caribe",
  ],
  mx: [
    "tacos-callejeros", "piramide", "mole", "lucha-libre", "trajinera",
    "tequila", "pan-de-muerto", "mercado", "mariachis", "cenotes",
    "pueblo-magico", "elote", "altar-dia-muertos", "zocalo", "chilaquiles",
    "ruina-maya", "oaxaca", "cactus-desierto", "pozole", "chocolate-caliente",
  ],
  kr: [
    "palacio", "hanbok", "tteokbokki", "noraebang", "ktx",
    "ikseon-dong", "bibimbap", "kimchi", "n-seoul-tower", "bukchon",
    "templo", "jjimjilbang", "cerezos", "busan", "hotteok",
    "han-river", "cafe-coreano", "mercado-nocturno", "aldea-mural", "jeju",
  ],
  us: [
    "road-trip", "route-66", "diner", "national-park", "skyline",
    "partido", "golden-gate", "statue-liberty", "bbq", "smithsonian",
    "canyon", "jazz", "coffee-to-go", "boardwalk", "red-desert",
    "burger", "skyscraper", "iconic-bridge", "pacific-sunset", "lodge",
  ],
};

export function officialCountryCode(countryId: CountryId): OfficialCountryCode | undefined {
  return COUNTRY_CODE_BY_ID[countryId];
}

export function officialBradyAsset(countryId: CountryId): string {
  const code = officialCountryCode(countryId);
  return code ? `/nioli/official/brady/${code}.png` : "/nioli/official/brady/master.png";
}

export function officialRouteArt(countryId: CountryId): string | null {
  const code = officialCountryCode(countryId);
  return code ? `/nioli/official/route-art/${code}.jpg` : null;
}

export function officialStampAsset(countryId: CountryId, index: number): string | null {
  const code = officialCountryCode(countryId);
  if (!code) return null;
  const slug = STAMP_SLUGS[code][index];
  if (!slug) return null;
  return `/nioli/official/stamps/${code}/${String(index + 1).padStart(2, "0")}-${slug}.png`;
}

export function officialStampAssets(countryId: CountryId): string[] {
  const code = officialCountryCode(countryId);
  if (!code) return [];
  return STAMP_SLUGS[code].map((slug, index) => `/nioli/official/stamps/${code}/${String(index + 1).padStart(2, "0")}-${slug}.png`);
}

export function hasOfficialCountryAssets(countryId: CountryId): boolean {
  return Boolean(officialCountryCode(countryId));
}
