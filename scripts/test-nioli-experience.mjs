import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (path) => readFileSync(join(root, path), "utf8");

const COUNTRY_CODES = ["JP", "MX", "CO", "US", "ES", "CL", "AR", "KR", "CR"];

test("country display variants exist while official app identity stays global", () => {
  for (const code of COUNTRY_CODES) {
    assert.equal(existsSync(join(root, "public", "brand", "countries", code, "nioli-seal.png")), true, `${code} seal variant missing`);
    assert.equal(existsSync(join(root, "public", "brand", "countries", code, "nioli-logo-horizontal.png")), true, `${code} logo variant missing`);
  }
  const brand = source("src/lib/nioli/brand.ts");
  assert.match(brand, /return OFFICIAL_NIOLI_BRAND/);
  assert.match(brand, /\/brand\/countries\/\$\{normalized\}\/nioli-logo-horizontal\.png/);
  assert.match(brand, /\/brand\/countries\/\$\{normalized\}\/nioli-seal\.png/);
});

test("fresh cloud app start revokes prior browser session and requires PIN", () => {
  const gate = source("src/features/auth/travel-auth-gate.tsx");
  assert.match(gate, /fetch\("\/api\/travel-session\/logout"/);
  assert.match(gate, /body:\s*JSON\.stringify\(\{ all: true \}\)/);
  assert.doesNotMatch(gate, /fetch\("\/api\/travel-session"\s*,\s*\{\s*cache:\s*"no-store"\s*\}\)/);
  assert.match(gate, /setPhase\("login"\)/);
  assert.match(gate, /Cambiar usuario|switchUser/);
});

test("trip loading has a bounded wait and NIOLI airplane animation", () => {
  const gate = source("src/features/auth/travel-auth-gate.tsx");
  const css = source("src/app/globals.css");
  assert.match(gate, /withTimeout\(cloudTripRepository\.prepare/);
  assert.match(gate, /withTimeout\(cloudTripRepository\.load/);
  assert.match(gate, /Preparando tu aventura…/);
  assert.match(gate, /nioli-flight-plane/);
  assert.match(css, /@keyframes nioli-flight-orbit/);
  assert.match(css, /prefers-reduced-motion/);
});

test("login remains official NIOLI while trip navigation uses country brand variants", () => {
  const gate = source("src/features/auth/travel-auth-gate.tsx");
  const side = source("src/components/navigation/side-navigation.tsx");
  const top = source("src/components/navigation/top-bar.tsx");
  const css = source("src/app/globals.css");
  assert.match(gate, /src="\/brand\/nioli-logo-horizontal\.png"/);
  assert.match(gate, /src="\/brand\/nioli-seal\.png"/);
  assert.match(side, /brand\.logoHorizontal/);
  assert.match(top, /brand\.seal/);
  assert.match(css, /--nioli-green:\s*#2e4a3a/i);
  assert.match(css, /--nioli-brown:\s*#8b5e34/i);
  assert.match(css, /--nioli-cream:\s*#f8f0e7/i);
});

test("unknown country falls back to official NIOLI instead of Japan", () => {
  const brand = source("src/lib/nioli/brand.ts");
  const experience = source("src/lib/nioli/country-experience.ts");
  assert.match(brand, /if \(!COUNTRY_BRAND_CODES\.has\(normalized\)\) return OFFICIAL_NIOLI_BRAND/);
  assert.match(experience, /other:\s*undefined/);
});

test("access modal uses dynamic viewport scrolling and aligned permission rows", () => {
  const css = source("src/app/globals.css");
  assert.match(css, /max-height:\s*calc\(100dvh - 32px\)/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /\.access-view\s*\{[^}]*animation:\s*none/s);
  assert.match(css, /\.access-modal \.permission-check \{[^}]*grid-template-columns:\s*20px minmax\(0, 1fr\)/s);
  assert.match(css, /\.modal-backdrop \{[^}]*overflow-y:\s*auto/s);
});
