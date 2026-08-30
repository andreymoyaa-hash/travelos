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

const JAPAN_APPROVED_STAMP_ASSETS = [
  "jp_achievement_01_viaje_en_shinkansen.png",
  "jp_achievement_02_probe_ramen.png",
  "jp_achievement_03_comi_sushi.png",
  "jp_achievement_04_visite_un_templo.png",
  "jp_achievement_05_fui_a_un_onsen.png",
  "jp_achievement_06_cruce_shibuya.png",
  "jp_achievement_07_vi_flores_de_sakura.png",
  "jp_achievement_08_explore_akihabara.png",
  "jp_achievement_09_subi_a_una_torre.png",
  "jp_achievement_10_disfrute_un_festival.png",
  "jp_achievement_11_tome_te_matcha.png",
  "jp_achievement_12_visite_un_castillo.png",
  "jp_achievement_13_pasee_por_gion.png",
  "jp_achievement_14_conoci_un_jardin_japones.png",
  "jp_achievement_15_comi_en_un_konbini.png",
  "jp_achievement_16_navegue_por_un_canal.png",
  "jp_achievement_17_vi_el_monte_fuji.png",
  "jp_achievement_18_probe_mochi.png",
  "jp_achievement_19_fui_a_un_mercado_local.png",
  "jp_achievement_20_disfrute_la_comida_callejera.png",
] as const;

export function officialBradyAsset(countryId: CountryId): string {
  if (countryId === "japan") return "/nioli/themes/japan/brady/jp_brady_japan_happi.png";
  const code = officialCountryCode(countryId);
  return code ? `/nioli/official/brady/${code}.png` : "/nioli/official/brady/master.png";
}

export function officialRouteArt(countryId: CountryId): string | null {
  if (countryId === "japan") return "/nioli/themes/japan/tickets/jp_japan_rail_pass.png";
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
