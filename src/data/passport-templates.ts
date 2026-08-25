import type { Achievement, CountryId, PassportTemplate } from "@/types/travel";
import { japanAchievements } from "@/data/japan-achievements";

const templateStamp = (
  id: string,
  title: string,
  description: string,
  icon: string,
  location: string,
  category: Achievement["category"],
): Achievement => ({
  id,
  title,
  description,
  icon,
  location,
  category,
  color: "#6f56b7",
  unlockMethods: ["photo", "manual"],
  unlockedBy: [],
  rarity: "common",
});

export const passportTemplates: Record<PassportTemplate["id"], PassportTemplate> = {
  japan: {
    id: "japan",
    name: "Japan Passport",
    description: "La colección real del viaje Japón 2026 se conserva en el viaje original.",
    categories: ["Lugares", "Ciudades", "Templos", "Barrios", "Pokémon", "Estaciones", "Experiencias"],
    stamps: japanAchievements,
  },
  mexico: {
    id: "mexico",
    name: "Pasaporte México",
    description: "Una colección inicial editable, sin sellos japoneses.",
    categories: ["Barrios", "Mercados", "Museos", "Comida", "Monumentos", "Experiencias"],
    stamps: [
      templateStamp("mx-barrio", "Explorar un barrio", "Guarda un recuerdo de un barrio que hayas visitado.", "▦", "México", "travel"),
      templateStamp("mx-mercado", "Visitar un mercado", "Registra una visita real a un mercado.", "✺", "México", "food"),
      templateStamp("mx-museo", "Descubrir un museo", "Guarda una fotografía de un museo visitado.", "◇", "México", "entertainment"),
      templateStamp("mx-sabor", "Probar un sabor local", "Conserva el recuerdo de una experiencia gastronómica.", "◉", "México", "food"),
    ],
  },
  generic: {
    id: "generic",
    name: "Travel Passport",
    description: "Colección internacional que puedes ampliar con sellos personalizados.",
    categories: ["Lugares", "Cultura", "Naturaleza", "Sabores", "Recuerdos"],
    stamps: [
      templateStamp("generic-first-place", "Primer lugar", "Guarda el primer lugar que visites en este viaje.", "✦", "Destino", "travel"),
      templateStamp("generic-memory", "Primer recuerdo", "Asocia una fotografía real a este viaje.", "◫", "Destino", "entertainment"),
    ],
  },
};

export const passportTemplateForCountry = (countryId: CountryId): PassportTemplate =>
  countryId === "japan" ? passportTemplates.japan : countryId === "mexico" ? passportTemplates.mexico : passportTemplates.generic;
