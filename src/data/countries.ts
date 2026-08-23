import type { CountryTheme } from "@/types/travel";

export const countryThemes: CountryTheme[] = [
  {
    id: "japan",
    name: "Japón",
    flag: "🇯🇵",
    headline: "Entre neón y tradición",
    description: "Templos, trenes, ramen y aventuras urbanas.",
    landmark: "鳥居",
    colors: {
      accent: "#e94b48",
      accentDark: "#bd2f36",
      soft: "#fff0e9",
      highlight: "#ffd850",
    },
    categories: ["Templos", "Trenes", "Pokémon", "Gaming", "Gastronomía"],
  },
  {
    id: "mexico",
    name: "México",
    flag: "🇲🇽",
    headline: "Color que se saborea",
    description: "Mercados, historia, diseño y cocina regional.",
    landmark: "✺",
    colors: {
      accent: "#0c8f69",
      accentDark: "#076c51",
      soft: "#e6f7ef",
      highlight: "#f3b63f",
    },
    categories: ["Mercados", "Museos", "Tacos", "Artesanía", "Playas"],
  },
  {
    id: "korea",
    name: "Corea",
    flag: "🇰🇷",
    headline: "Ritmo, sabor y diseño",
    description: "Palacios, cafés, barrios creativos y K-culture.",
    landmark: "한",
    colors: {
      accent: "#5d63c8",
      accentDark: "#3f459f",
      soft: "#eeeefe",
      highlight: "#f3c7d5",
    },
    categories: ["Palacios", "Cafés", "K-pop", "Skincare", "Street food"],
  },
  {
    id: "usa",
    name: "Estados Unidos",
    flag: "🇺🇸",
    headline: "Grandes rutas, grandes historias",
    description: "Road trips, parques, ciudades y entretenimiento.",
    landmark: "★",
    colors: {
      accent: "#2773b9",
      accentDark: "#164e84",
      soft: "#e8f3fc",
      highlight: "#ef5350",
    },
    categories: ["Road trips", "Parques", "Deportes", "Compras", "Ciudades"],
  },
  {
    id: "other",
    name: "Otro destino",
    flag: "🌎",
    headline: "Tu siguiente historia",
    description: "Una plantilla flexible para cualquier rincón del mundo.",
    landmark: "✦",
    colors: {
      accent: "#8267c7",
      accentDark: "#6248a6",
      soft: "#f1edfb",
      highlight: "#efbb4b",
    },
    categories: ["Imperdibles", "Sabores", "Cultura", "Naturaleza", "Recuerdos"],
  },
];

export const countryThemeById = Object.fromEntries(
  countryThemes.map((theme) => [theme.id, theme]),
) as Record<CountryTheme["id"], CountryTheme>;
