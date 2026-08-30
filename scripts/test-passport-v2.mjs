import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const adventure = fs.readFileSync("src/features/achievements/adventure-view.tsx", "utf8");
const stamp = fs.readFileSync("src/features/achievements/passport-stamp-mark.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");
const templates = fs.readFileSync("src/data/passport-templates.ts", "utf8");

const checks = [
  ["Passport renders stamp marks instead of achievement cards", () => assert.match(adventure, /<PassportStampMark achievement=\{achievement\}/)],
  ["Legacy card renderer is gone", () => assert.doesNotMatch(adventure, /passport-stamp-card/)],
  ["Locked stamps expose discovery hints", () => assert.match(adventure, /achievement\.hint \?\? achievement\.title/)],
  ["Passport uses the BRADY LOCK country asset", () => assert.match(adventure, /officialBradyAsset\(trip\.countryId\)/)],
  ["Stamp detail reuses the real stamp visual", () => assert.match(adventure, /<PassportStampMark achievement=\{achievement\} unlocked=\{unlocked\} large/)],
  ["Stamp shapes include travel-document variants", () => assert.match(stamp, /"round", "oval", "rectangle", "square", "arch", "ticket"/)],
  ["Unlocked stamps have ink treatment", () => assert.match(css, /passport-stamp-mark\.is-unlocked/)],
  ["Locked stamps use a ghost treatment", () => assert.match(css, /passport-stamp-mark\.is-locked/)],
  ["CHAK unlock animation exists", () => assert.match(css, /@keyframes passport-chak/)],
  ["New Japan trips use the official Japan catalog", () => assert.match(templates, /stamps: officialPassportCatalogs\.japan\.achievements/)],
];

for (const [name, check] of checks) test(name, check);
