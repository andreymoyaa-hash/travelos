import { officialPassportCatalogForCountry } from "@/data/official-passport-catalogs";
import type { Achievement, Trip } from "@/types/travel";

const preserveUnlockState = (base: Achievement, previous?: Achievement): Achievement => previous ? {
  ...base,
  unlockedBy: [...(previous.unlockedBy ?? [])],
  unlockedAt: previous.unlockedAt ? { ...previous.unlockedAt } : undefined,
  unlockedPhotoIds: previous.unlockedPhotoIds ? { ...previous.unlockedPhotoIds } : undefined,
} : structuredClone(base);

export function withOfficialPassportCatalog(trip: Trip): Trip {
  const catalog = officialPassportCatalogForCountry(trip.countryId);
  if (!catalog) return trip;

  const existing = trip.achievements ?? [];
  const byId = new Map(existing.map((achievement) => [achievement.id, achievement]));
  const officialIds = new Set(catalog.achievements.map((achievement) => achievement.id));
  const official = catalog.achievements.map((achievement) => preserveUnlockState(achievement, byId.get(achievement.id)));
  const custom = existing.filter((achievement) => achievement.custom && !officialIds.has(achievement.id));
  const unlockedLegacy = existing.filter((achievement) => !achievement.custom && !officialIds.has(achievement.id) && (achievement.unlockedBy?.length ?? 0) > 0).map((achievement) => ({ ...achievement, custom: true }));

  const templateId = trip.countryId === "japan" ? "japan"
    : trip.countryId === "colombia" ? "colombia"
      : trip.countryId === "mexico" ? "mexico"
        : trip.countryId === "korea" ? "korea"
          : trip.countryId === "usa" ? "usa"
            : "generic";

  return {
    ...trip,
    achievements: [...official, ...custom, ...unlockedLegacy],
    settings: trip.settings ? { ...trip.settings, passportTemplateId: templateId } : trip.settings,
  };
}
