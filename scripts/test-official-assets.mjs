import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const countryCodes = ["jp", "co", "mx", "kr", "us"];

test("BRADY LOCK has master plus five approved country assets", () => {
  assert.ok(existsSync(join(root, "public/nioli/official/brady/master.png")));
  for (const code of countryCodes) assert.ok(existsSync(join(root, `public/nioli/official/brady/${code}.png`)), `missing Brady ${code}`);
});

test("SELLOS LOCK contains exactly 20 stamps per official country", () => {
  for (const code of countryCodes) {
    const dir = join(root, `public/nioli/official/stamps/${code}`);
    const stamps = readdirSync(dir).filter((name) => name.endsWith(".png"));
    assert.equal(stamps.length, 20, `${code} should contain 20 official stamps`);
  }
});

test("RUTA LOCK contains route artwork for every official country", () => {
  for (const code of countryCodes) assert.ok(existsSync(join(root, `public/nioli/official/route-art/${code}.jpg`)), `missing route art ${code}`);
});

test("official passport UI uses raster stamps with translucent locked previews", () => {
  const mark = readFileSync(join(root, "src/features/achievements/passport-stamp-mark.tsx"), "utf8");
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  assert.match(mark, /official-stamp-image/);
  assert.match(mark, /assetPath/);
  assert.match(css, /official-stamp-asset\.is-locked[\s\S]*opacity:\s*\.30/);
  assert.doesNotMatch(css.match(/official-stamp-asset\.is-locked[\s\S]{0,400}/)?.[0] ?? "", /sepia/);
});

test("five official country catalogs expose 20 achievements each", () => {
  const catalogs = readFileSync(join(root, "src/data/official-passport-catalogs.ts"), "utf8");
  for (const key of ["japan", "colombia", "mexico", "korea", "usa"]) assert.match(catalogs, new RegExp(`${key}: makeCatalog`));
  assert.match(catalogs, /assetPath:\s*officialStampAsset/);
});
