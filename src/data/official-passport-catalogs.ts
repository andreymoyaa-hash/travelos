import { officialStampAsset } from "@/lib/nioli/official-assets";
import type { Achievement, AchievementCatalog, AchievementCategory, CountryId } from "@/types/travel";

type Seed = {
  id: string;
  title: string;
  location: string;
  category: AchievementCategory;
  description?: string;
  hint?: string;
  city?: string;
  region?: string;
  unlockMethods?: Achievement["unlockMethods"];
  geoTriggers?: Achievement["geoTriggers"];
  rarity?: Achievement["rarity"];
};

type CatalogDefinition = {
  countryId: CountryId;
  countryCode: "JP" | "CO" | "MX" | "KR" | "US";
  color: string;
  seeds: readonly Seed[];
};

const makeCatalog = ({ countryId, countryCode, color, seeds }: CatalogDefinition): AchievementCatalog => ({
  countryId,
  countryCode,
  version: 2,
  categories: Array.from(new Set(seeds.map((seed) => seed.category))),
  achievements: seeds.map((seed, index): Achievement => ({
    id: seed.id,
    title: seed.title,
    description: seed.description ?? `Guarda un recuerdo real de esta experiencia durante tu viaje por ${countryCode}.`,
    hint: seed.hint ?? "Completa la experiencia y conserva una foto o validación manual en tu pasaporte.",
    icon: "✦",
    color,
    category: seed.category,
    unlockMethods: seed.unlockMethods ?? ["photo", "manual"],
    geoTriggers: seed.geoTriggers,
    unlockedBy: [],
    location: seed.location,
    city: seed.city,
    region: seed.region,
    discovery: "visible",
    rarity: seed.rarity ?? (index % 7 === 0 ? "special" : "common"),
    stamp: {
      shape: "rectangle",
      ink: color,
      motif: seed.id,
      label: seed.title.toUpperCase(),
      rotationDeg: 0,
      assetPath: officialStampAsset(countryId, index) ?? undefined,
    },
  })),
});

const japanSeeds: readonly Seed[] = [
  { id: "first-shinkansen", title: "Viajé en Shinkansen", location: "Japón", category: "transport" },
  { id: "fushimi-inari", title: "Probé ramen", location: "Japón", category: "food" },
  { id: "first-ramen", title: "Comí sushi", location: "Japón", category: "food" },
  { id: "kiyomizu-dera", title: "Visité un templo", location: "Japón", category: "culture" },
  { id: "jp-onsen", title: "Fui a un onsen", location: "Japón", category: "culture" },
  { id: "sushi", title: "Crucé Shibuya", location: "Shibuya Crossing", city: "Tokyo", category: "landmark", unlockMethods: ["gps", "photo", "manual"], geoTriggers: [{ latitude: 35.6595, longitude: 139.7005, radiusMeters: 350 }] },
  { id: "jp-shibuya", title: "Vi flores de sakura", location: "Japón", category: "nature" },
  { id: "jp-sakura", title: "Exploré Akihabara", location: "Akihabara", city: "Tokyo", category: "geek", unlockMethods: ["gps", "photo", "manual"], geoTriggers: [{ latitude: 35.6984, longitude: 139.7731, radiusMeters: 700 }] },
  { id: "akihabara", title: "Subí a una torre", location: "Tokyo", city: "Tokyo", category: "landmark" },
  { id: "jp-tokyo-tower", title: "Disfruté un festival", location: "Japón", category: "culture" },
  { id: "jp-okonomiyaki", title: "Tomé té matcha", location: "Japón", category: "food" },
  { id: "jp-ryokan", title: "Visité un castillo", location: "Japón", category: "landmark" },
  { id: "jp-mount-fuji", title: "Paseé por Gion", location: "Gion", city: "Kyoto", category: "neighborhood" },
  { id: "jp-matcha", title: "Conocí un jardín japonés", location: "Japón", category: "nature" },
  { id: "jp-karaoke", title: "Comí en un konbini", location: "Japón", category: "food" },
  { id: "jp-castle", title: "Navegué por un canal", location: "Japón", category: "travel" },
  { id: "konbini", title: "Vi el Monte Fuji", location: "Monte Fuji", category: "nature" },
  { id: "first-metro", title: "Probé mochi", location: "Japón", category: "food" },
  { id: "jp-takoyaki", title: "Fui a un mercado local", location: "Japón", category: "market" },
  { id: "gion", title: "Disfruté la comida callejera", location: "Japón", category: "food" },
];

const colombiaSeeds: readonly Seed[] = [
  { id: "co-origin-coffee", title: "Tomé café colombiano", location: "Colombia", category: "food" },
  { id: "co-bogota-monserrate", title: "Subí a Monserrate", location: "Monserrate", city: "Bogotá", category: "landmark", unlockMethods: ["gps", "photo", "manual"], geoTriggers: [{ latitude: 4.60725, longitude: -74.05431, radiusMeters: 450 }] },
  { id: "co-cartagena-getsemani", title: "Recorrí Getsemaní", location: "Getsemaní", city: "Cartagena", category: "neighborhood" },
  { id: "co-medellin-metrocable", title: "Viajé en Metrocable", location: "Medellín", city: "Medellín", category: "transport" },
  { id: "co-arepa", title: "Comí arepa", location: "Colombia", category: "food" },
  { id: "co-pueblo-colorido", title: "Vi un pueblo colorido", location: "Colombia", category: "culture" },
  { id: "co-bandeja-paisa", title: "Probé bandeja paisa", location: "Antioquia", category: "food" },
  { id: "co-salsa", title: "Bailé salsa", location: "Colombia", category: "culture" },
  { id: "co-cartagena", title: "Navegué por Cartagena", location: "Cartagena", city: "Cartagena", category: "travel" },
  { id: "co-cocora-palmas-cera", title: "Vi palmas de cera", location: "Valle del Cocora", city: "Salento", category: "nature" },
  { id: "co-empanadas", title: "Comí empanadas", location: "Colombia", category: "food" },
  { id: "co-ajiaco", title: "Probé ajiaco", location: "Bogotá", city: "Bogotá", category: "food" },
  { id: "co-medellin-penol", title: "Subí al Peñol", location: "Piedra del Peñol", city: "Guatapé", category: "landmark" },
  { id: "co-medellin-comuna-13", title: "Conocí Comuna 13", location: "Comuna 13", city: "Medellín", category: "culture" },
  { id: "co-bogota-candelaria", title: "Paseé por La Candelaria", location: "La Candelaria", city: "Bogotá", category: "neighborhood" },
  { id: "co-coffee-farm", title: "Visité una finca cafetera", location: "Eje Cafetero", category: "culture" },
  { id: "co-oblea", title: "Probé oblea", location: "Colombia", category: "food" },
  { id: "co-arte-urbano", title: "Descubrí arte urbano", location: "Colombia", category: "culture" },
  { id: "co-barichara", title: "Caminé por Barichara", location: "Barichara", city: "Barichara", category: "neighborhood" },
  { id: "co-caribe", title: "Vi el Caribe colombiano", location: "Caribe colombiano", category: "nature" },
];

const mexicoSeeds: readonly Seed[] = [
  { id: "mx-tacos", title: "Comí tacos callejeros", location: "México", category: "food" },
  { id: "mx-piramide", title: "Visité una pirámide", location: "México", category: "landmark" },
  { id: "mx-mole", title: "Probé mole", location: "México", category: "food" },
  { id: "mx-lucha-libre", title: "Vi lucha libre", location: "México", category: "entertainment" },
  { id: "mx-trajinera", title: "Navegué en trajinera", location: "Xochimilco", city: "Ciudad de México", category: "travel" },
  { id: "mx-tequila", title: "Brindé con tequila", location: "México", category: "food" },
  { id: "mx-pan-muerto", title: "Comí pan de muerto", location: "México", category: "food" },
  { id: "mx-mercado", title: "Fui a un mercado", location: "México", category: "market" },
  { id: "mx-mariachis", title: "Vi mariachis", location: "México", category: "culture" },
  { id: "mx-cenote", title: "Exploré un cenote", location: "México", category: "nature" },
  { id: "mx-pueblo-magico", title: "Visité un Pueblo Mágico", location: "México", category: "culture" },
  { id: "mx-elote", title: "Comí elote", location: "México", category: "food" },
  { id: "mx-dia-muertos", title: "Vi un altar de Día de Muertos", location: "México", category: "culture" },
  { id: "mx-zocalo", title: "Caminé por el Zócalo", location: "Centro Histórico", city: "Ciudad de México", category: "landmark" },
  { id: "mx-chilaquiles", title: "Probé chilaquiles", location: "México", category: "food" },
  { id: "mx-ruina-maya", title: "Subí a una ruina maya", location: "México", category: "landmark" },
  { id: "mx-oaxaca", title: "Descubrí Oaxaca", location: "Oaxaca", city: "Oaxaca", category: "culture" },
  { id: "mx-desierto", title: "Vi cactus del desierto", location: "México", category: "nature" },
  { id: "mx-pozole", title: "Comí pozole", location: "México", category: "food" },
  { id: "mx-chocolate", title: "Tomé chocolate caliente", location: "México", category: "food" },
];

const koreaSeeds: readonly Seed[] = [
  { id: "kr-palace", title: "Visité un palacio", location: "Corea del Sur", category: "landmark" },
  { id: "kr-hanbok", title: "Vestí hanbok", location: "Corea del Sur", category: "culture" },
  { id: "kr-tteokbokki", title: "Probé tteokbokki", location: "Corea del Sur", category: "food" },
  { id: "kr-noraebang", title: "Fui a un noraebang", location: "Corea del Sur", category: "entertainment" },
  { id: "kr-ktx", title: "Viajé en KTX", location: "Corea del Sur", category: "transport" },
  { id: "kr-ikseon", title: "Descubrí Ikseon-dong", location: "Ikseon-dong", city: "Seúl", category: "neighborhood" },
  { id: "kr-bibimbap", title: "Comí bibimbap", location: "Corea del Sur", category: "food" },
  { id: "kr-kimchi", title: "Probé kimchi", location: "Corea del Sur", category: "food" },
  { id: "kr-n-seoul", title: "Subí a N Seoul Tower", location: "N Seoul Tower", city: "Seúl", category: "landmark" },
  { id: "kr-bukchon", title: "Exploré Bukchon Hanok", location: "Bukchon", city: "Seúl", category: "culture" },
  { id: "kr-temple", title: "Visité un templo", location: "Corea del Sur", category: "culture" },
  { id: "kr-jjimjilbang", title: "Fui a un jjimjilbang", location: "Corea del Sur", category: "culture" },
  { id: "kr-cherry", title: "Vi cerezos en flor", location: "Corea del Sur", category: "nature" },
  { id: "kr-busan", title: "Paseé por Busan", location: "Busan", city: "Busan", category: "travel" },
  { id: "kr-hotteok", title: "Probé hotteok", location: "Corea del Sur", category: "food" },
  { id: "kr-han-river", title: "Caminé junto al Han", location: "Río Han", city: "Seúl", category: "nature" },
  { id: "kr-coffee", title: "Tomé café coreano", location: "Corea del Sur", category: "food" },
  { id: "kr-night-market", title: "Fui a un mercado nocturno", location: "Corea del Sur", category: "market" },
  { id: "kr-mural-village", title: "Vi una aldea mural", location: "Corea del Sur", category: "culture" },
  { id: "kr-jeju", title: "Descubrí Jeju", location: "Jeju", city: "Jeju", category: "nature" },
];

const usaSeeds: readonly Seed[] = [
  { id: "us-road-trip", title: "Hice road trip", location: "Estados Unidos", category: "travel" },
  { id: "us-route-66", title: "Manejé por Route 66", location: "Route 66", category: "travel" },
  { id: "us-diner", title: "Comí en un diner", location: "Estados Unidos", category: "food" },
  { id: "us-national-park", title: "Entré a un National Park", location: "Estados Unidos", category: "nature" },
  { id: "us-skyline", title: "Vi un skyline", location: "Estados Unidos", category: "landmark" },
  { id: "us-game", title: "Asistí a un partido", location: "Estados Unidos", category: "entertainment" },
  { id: "us-golden-gate", title: "Crucé el Golden Gate", location: "Golden Gate Bridge", city: "San Francisco", category: "landmark" },
  { id: "us-liberty", title: "Vi la Estatua de la Libertad", location: "Statue of Liberty", city: "New York", category: "landmark" },
  { id: "us-bbq", title: "Probé BBQ", location: "Estados Unidos", category: "food" },
  { id: "us-smithsonian", title: "Fui al Smithsonian", location: "Smithsonian", city: "Washington, D.C.", category: "museum" },
  { id: "us-canyon", title: "Vi un cañón", location: "Estados Unidos", category: "nature" },
  { id: "us-jazz", title: "Escuché jazz en vivo", location: "Estados Unidos", category: "culture" },
  { id: "us-coffee", title: "Tomé café to-go", location: "Estados Unidos", category: "food" },
  { id: "us-boardwalk", title: "Paseé por un boardwalk", location: "Estados Unidos", category: "travel" },
  { id: "us-red-desert", title: "Vi el desierto rojo", location: "Suroeste de Estados Unidos", category: "nature" },
  { id: "us-burger", title: "Comí hamburguesa", location: "Estados Unidos", category: "food" },
  { id: "us-skyscraper", title: "Vi un rascacielos", location: "Estados Unidos", category: "landmark" },
  { id: "us-iconic-bridge", title: "Crucé un puente icónico", location: "Estados Unidos", category: "landmark" },
  { id: "us-pacific", title: "Vi un atardecer del Pacífico", location: "Costa del Pacífico", category: "nature" },
  { id: "us-lodge", title: "Exploré un lodge", location: "Estados Unidos", category: "travel" },
];

export const officialPassportCatalogs = {
  japan: makeCatalog({ countryId: "japan", countryCode: "JP", color: "#B83232", seeds: japanSeeds }),
  colombia: makeCatalog({ countryId: "colombia", countryCode: "CO", color: "#2F6649", seeds: colombiaSeeds }),
  mexico: makeCatalog({ countryId: "mexico", countryCode: "MX", color: "#B85A2E", seeds: mexicoSeeds }),
  korea: makeCatalog({ countryId: "korea", countryCode: "KR", color: "#315A87", seeds: koreaSeeds }),
  usa: makeCatalog({ countryId: "usa", countryCode: "US", color: "#2E4968", seeds: usaSeeds }),
} as const;

export const officialPassportCatalogForCountry = (countryId: CountryId): AchievementCatalog | undefined =>
  countryId === "japan" ? officialPassportCatalogs.japan
    : countryId === "colombia" ? officialPassportCatalogs.colombia
      : countryId === "mexico" ? officialPassportCatalogs.mexico
        : countryId === "korea" ? officialPassportCatalogs.korea
          : countryId === "usa" ? officialPassportCatalogs.usa
            : undefined;
