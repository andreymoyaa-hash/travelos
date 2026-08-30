import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (path) => readFileSync(join(root, path), "utf8");

const canonicalAssets = {
  "README.txt": "C348EAC75F69FCB8EEDC55C56766D9DAF079A36FF7292BF5867E5F41DA34EE67",
  "apple-touch-icon.png": "617DA8CF0A1D889570EF36F8F181F6C38EFFBE2A2D52AE538C530952D8F9BA51",
  "favicon.ico": "437F69AF9FF7B1A1C43F3211CAC53A24FBD7F58BE7A7562EC8AB541580120BEA",
  "icon-192.png": "A694641B9BC3A62285C8923994CBF8D452211C8C394C17826438521EBF2639ED",
  "icon-512.png": "5F67FED79A3DBCB9F9560A4F38660189952DCE357E70439857C80D5492AC58DD",
  "nioli-logo-horizontal.png": "11ADC1F86AC755869C7D8754113CA61D972D1EEAC4D8AFE64FB5201B2658C841",
  "nioli-seal.png": "BEBA00EF2C34524D42246361EDB9EA6CF16F8E1031AB382D6DFC7D4A130937A9",
};

const pngDimensions = (path) => {
  const bytes = readFileSync(join(root, path));
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

function productionTsxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionTsxFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
  });
}

test("canonical brand drop is complete and byte-for-byte unchanged", () => {
  const directory = join(root, "public", "brand");
  const rootFiles = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  assert.deepEqual(rootFiles, Object.keys(canonicalAssets).sort());
  assert.ok(existsSync(join(directory, "countries")), "country display variants may live beside, but must not modify, canonical root assets");
  for (const [name, expectedHash] of Object.entries(canonicalAssets)) {
    const file = join(directory, name);
    assert.ok(statSync(file).isFile(), `${name} must be a file`);
    const actualHash = createHash("sha256").update(readFileSync(file)).digest("hex").toUpperCase();
    assert.equal(actualHash, expectedHash, `${name} must not be modified`);
  }
  assert.deepEqual(pngDimensions("public/brand/apple-touch-icon.png"), [180, 180]);
  assert.deepEqual(pngDimensions("public/brand/icon-192.png"), [192, 192]);
  assert.deepEqual(pngDimensions("public/brand/icon-512.png"), [512, 512]);
  assert.deepEqual(pngDimensions("public/brand/nioli-logo-horizontal.png"), [700, 225]);
  assert.deepEqual(pngDimensions("public/brand/nioli-seal.png"), [320, 320]);
});

test("obsolete icon and public legacy-brand capture are absent", () => {
  assert.equal(existsSync(join(root, "src", "app", "icon.svg")), false);
  assert.equal(existsSync(join(root, "src", "app", "icon.png")), false);
  assert.equal(existsSync(join(root, "src", "app", "favicon.ico")), false);
  assert.equal(existsSync(join(root, "public", "icon.svg")), false);
  assert.equal(existsSync(join(root, "public", "favicon.ico")), false);
  assert.equal(existsSync(join(root, "public", "nioli", "Travel OS · Tu viaje, bien pensado.html")), false);
});

test("manifest and browser metadata use canonical NIOLI identity", () => {
  const manifest = source("src/app/manifest.ts");
  const layout = source("src/app/layout.tsx");
  assert.match(manifest, /name:\s*"NIOLI"/);
  assert.match(manifest, /short_name:\s*"NIOLI"/);
  assert.match(manifest, /src:\s*"\/brand\/icon-192\.png"/);
  assert.match(manifest, /src:\s*"\/brand\/icon-512\.png"/);
  assert.doesNotMatch(manifest, /\/icon\.svg/);
  assert.match(layout, /default:\s*"NIOLI · Tu viaje, bien pensado"/);
  assert.match(layout, /\/brand\/favicon\.ico/);
  assert.match(layout, /\/brand\/apple-touch-icon\.png/);
});

test("login, setup and navigation use only canonical brand lockups", () => {
  const login = source("src/features/auth/travel-auth-gate.tsx");
  const setup = source("src/features/auth/setup-access-view.tsx");
  const sideNavigation = source("src/components/navigation/side-navigation.tsx");
  const topBar = source("src/components/navigation/top-bar.tsx");
  assert.match(login, /src="\/brand\/nioli-logo-horizontal\.png"/);
  assert.match(login, /src="\/brand\/nioli-seal\.png"/);
  assert.match(setup, /src="\/brand\/nioli-logo-horizontal\.png"/);
  assert.match(sideNavigation, /src=\{brand\.logoHorizontal\}/);
  assert.match(topBar, /src=\{brand\.seal\}/);
  for (const ui of [login, setup, sideNavigation, topBar]) {
    assert.doesNotMatch(ui, /auth-brand-mark|>旅</);
  }
});

test("production UI contains no public Travel OS lockup", () => {
  const directories = ["src/app", "src/components", "src/features"].map((path) => join(root, path));
  const matches = productionTsxFiles(directories[0])
    .concat(productionTsxFiles(directories[1]), productionTsxFiles(directories[2]))
    .filter((file) => {
      const content = readFileSync(file, "utf8");
      return /Travel\s+OS/i.test(content) || /[>"']TravelOS[<"']/i.test(content);
    })
    .map((file) => relative(root, file));
  assert.deepEqual(matches, []);
});
