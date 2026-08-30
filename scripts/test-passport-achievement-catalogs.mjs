import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve("src/data/passport-achievement-catalogs.ts"), "utf8");

const checks = [
  ["Colombia catalog exists", source.includes("colombiaPassportAchievementCatalog")],
  ["Japan catalog exists", source.includes("japanPassportAchievementCatalog")],
  ["Colombia has 18 stable IDs", (source.match(/id: \"co-/g) ?? []).length === 18],
  ["Japan has 20 stable IDs", (source.match(/id: \"jp-/g) ?? []).length === 20],
  ["Stamp visual metadata exists", source.includes("stamp: { shape:")],
  ["Discovery hints exist", source.includes('discovery: "hinted"') && source.includes("hint:" )],
  ["GPS POIs exist", source.includes("geoTriggers:") && source.includes("radiusMeters")],
  ["Photo/manual experiences exist", source.includes('unlockMethods: ["photo", "manual"]')],
  ["Official Colombia sources included", source.includes("colombia.travel")],
  ["Official Japan sources included", source.includes("japan.travel")],
];

for (const [label, ok] of checks) {
  if (!ok) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
}

console.log(`\n${checks.length}/${checks.length} passport catalog checks passed.`);
