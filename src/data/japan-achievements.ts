import { officialPassportCatalogs } from "@/data/official-passport-catalogs";
import type { Achievement } from "@/types/travel";

export const japanAchievements: Achievement[] = structuredClone(officialPassportCatalogs.japan.achievements);
