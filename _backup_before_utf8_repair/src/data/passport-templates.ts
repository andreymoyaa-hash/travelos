import { officialPassportCatalogs } from "@/data/official-passport-catalogs";
import type { Achievement, CountryId, PassportTemplate } from "@/types/travel";

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
  color: "#2E4A3A",
  unlockMethods: ["photo", "manual"],
  unlockedBy: [],
  rarity: "common",
});

export const passportTemplates: Record<PassportTemplate["id"], PassportTemplate> = {
  japan: {
    id: "japan",
    name: "Nioli Passport · Japón",
    description: "20 experiencias oficiales NIOLI para coleccionar durante el viaje por Japón.",
    categories: ["Viaje", "Cultura", "Lugares", "Naturaleza", "Comida", "Transporte", "Geek"],
    stamps: officialPassportCatalogs.japan.achievements,
  },
  colombia: {
    id: "colombia",
    name: "Nioli Passport · Colombia",
    description: "20 experiencias oficiales NIOLI con café, ciudades, Caribe, cultura y naturaleza.",
    categories: ["Viaje", "Cultura", "Lugares", "Naturaleza", "Comida", "Transporte"],
    stamps: officialPassportCatalogs.colombia.achievements,
  },
  mexico: {
    id: "mexico",
    name: "Nioli Passport · México",
    description: "20 experiencias oficiales NIOLI con sabores, cultura, pueblos y lugares mexicanos.",
    categories: ["Viaje", "Cultura", "Lugares", "Naturaleza", "Comida", "Mercados"],
    stamps: officialPassportCatalogs.mexico.achievements,
  },
  korea: {
    id: "korea",
    name: "Nioli Passport · Corea del Sur",
    description: "20 experiencias oficiales NIOLI entre palacios, barrios, comida, trenes y vida urbana.",
    categories: ["Viaje", "Cultura", "Lugares", "Naturaleza", "Comida", "Transporte"],
    stamps: officialPassportCatalogs.korea.achievements,
  },
  usa: {
    id: "usa",
    name: "Nioli Passport · Estados Unidos",
    description: "20 experiencias oficiales NIOLI de carretera, parques, ciudades, música y sabores.",
    categories: ["Viaje", "Cultura", "Lugares", "Naturaleza", "Comida", "Entretenimiento"],
    stamps: officialPassportCatalogs.usa.achievements,
  },
  generic: {
    id: "generic",
    name: "Nioli Passport",
    description: "Colección internacional que puedes ampliar con sellos personalizados.",
    categories: ["Lugares", "Cultura", "Naturaleza", "Sabores", "Recuerdos"],
    stamps: [
      templateStamp("generic-first-place", "Primer lugar", "Guarda el primer lugar que visites en este viaje.", "✦", "Destino", "travel"),
      templateStamp("generic-memory", "Primer recuerdo", "Asocia una fotografía real a este viaje.", "◫", "Destino", "entertainment"),
    ],
  },
};

export const passportTemplateForCountry = (countryId: CountryId): PassportTemplate =>
  countryId === "japan" ? passportTemplates.japan
    : countryId === "colombia" ? passportTemplates.colombia
      : countryId === "mexico" ? passportTemplates.mexico
        : countryId === "korea" ? passportTemplates.korea
          : countryId === "usa" ? passportTemplates.usa
            : passportTemplates.generic;
