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
    "gion",
    "fushimi-inari",
    "tokyo",
    "nara-park",
    "kinkaku-ji",
    "meiji-jingu",
    "himeji-castle",
    "hakone-lake-ashi",
    "miyajima",
    "akihabara",
    "kiyomizu-dera",
    "tokyo-skytree",
    "ueno-park",
    "odaiba",
    "great-buddha-kamakura",
    "hiroshima-memorial",
    "kobe-harbor",
    "yokohama-minato-mirai",
    "shirakawa-go",
    "nikko-toshogu",
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

const JAPAN_APPROVED_STAMP_ASSETS = [
  "jp_place_01_gion.png",
  "jp_place_02_fushimi_inari.png",
  "jp_place_03_tokyo.png",
  "jp_place_04_nara_park.png",
  "jp_place_05_kinkaku_ji.png",
  "jp_place_06_meiji_jingu.png",
  "jp_place_07_himeji_castle.png",
  "jp_place_08_hakone_lake_ashi.png",
  "jp_place_09_miyajima.png",
  "jp_place_10_akihabara.png",
  "jp_place_11_kiyomizu_dera.png",
  "jp_place_12_tokyo_skytree.png",
  "jp_place_13_ueno_park.png",
  "jp_place_14_odaiba.png",
  "jp_place_15_great_buddha_kamakura.png",
  "jp_place_16_hiroshima_memorial.png",
  "jp_place_17_kobe_harbor.png",
  "jp_place_18_yokohama_minato_mirai.png",
  "jp_place_19_shirakawa_go.png",
  "jp_place_20_nikko_toshogu.png",
] as const;

export function officialBradyAsset(countryId: CountryId): string {
  if (countryId === "japan") return "/nioli/themes/japan/brady/companion/jp_brady_companion_neutral.png";
  const code = officialCountryCode(countryId);
  return code ? `/nioli/official/brady/${code}.png` : "/nioli/official/brady/master.png";
}

export function officialRouteArt(countryId: CountryId): string | null {
  if (countryId === "japan") return "/nioli/themes/japan/brady/companion/jp_brady_companion_neutral.png";
  const code = officialCountryCode(countryId);
  return code ? `/nioli/official/route-art/${code}.jpg` : null;
}

export function officialStampAsset(countryId: CountryId, index: number): string | null {
  if (countryId === "japan") {
    const file = JAPAN_APPROVED_STAMP_ASSETS[index];
    return file ? `/nioli/themes/japan/achievements/${file}` : null;
  }
  const code = officialCountryCode(countryId);
  if (!code) return null;
  const slug = STAMP_SLUGS[code][index];
  if (!slug) return null;
  return `/nioli/official/stamps/${code}/${String(index + 1).padStart(2, "0")}-${slug}.png`;
}

export function officialStampAssets(countryId: CountryId): string[] {
  if (countryId === "japan") return JAPAN_APPROVED_STAMP_ASSETS.map((file) => `/nioli/themes/japan/achievements/${file}`);
  const code = officialCountryCode(countryId);
  if (!code) return [];
  return STAMP_SLUGS[code].map((slug, index) => `/nioli/official/stamps/${code}/${String(index + 1).padStart(2, "0")}-${slug}.png`);
}

export function hasOfficialCountryAssets(countryId: CountryId): boolean {
  return Boolean(officialCountryCode(countryId));
}
