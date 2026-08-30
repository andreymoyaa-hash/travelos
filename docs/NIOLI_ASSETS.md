# NIOLI Asset System

NIOLI is the user-facing brand. The repository and technical project may continue to use the name TravelOS. BRADY is NIOLI's official mascot.

This foundation centralizes visual asset discovery without changing the current interface. No production component should invent asset paths or depend on reference boards.

## 1. Structure

```text
public/nioli/
├── brand/                 # logos, marks, icons
├── brady/                 # base, heads, expressions, actions, states, mini
├── countries/             # isolated Country Packs (jp, mx, co, us, es, cl, ar, kr, cr)
├── passport/              # generic assets and reusable templates
├── stamps/                # generic assets and reusable templates
├── tickets/               # generic ticket assets
├── ui/                    # onboarding, empty states, offline, camera, trip complete
├── qa/test-only/          # assets that must never ship as real travel content
└── refs/                  # manually supplied canon boards; not production

src/lib/nioli/assets/
├── types.ts               # asset and Country Pack contracts
├── manifest.ts            # the principal source of asset locations
├── visual-qa.ts           # production allowlist and retained blockers
└── helpers.ts             # lookup and fallback functions
```

Empty leaf directories contain `.gitkeep` only until real assets arrive. Do not create fake PNGs, placeholder SVGs, or speculative images.

## 2. Visual canon

Files supplied under `/public/nioli/refs/` define the visual canon. They must not be reinterpreted, modernized, recolored, filtered, converted automatically, or cropped from boards automatically.

BRADY must retain the approved face, proportions, green scarf, and ochre backpack. Country identity belongs to the surrounding Country Pack; it must not produce a different version of Brady for each country.

## 3. Brady

The manifest prepares three independent dimensions:

- Expressions: `neutral`, `happy`, `curious`, `sleepy`, `excited`, `proud`, `worried`, `confused`.
- Actions: `camera`, `map`, `pointing`, `passport`, `celebrate`, `exploring`, `planning`, `resting`.
- Functional states: `offline`, `loading`, `syncing`, `emptyTrip`, `newStamp`, `tripComplete`.

An entry remains `null` until its production file exists. Components must use the helpers and render nothing when the returned asset is `null`.

## 4. Country Packs

The initial packs are isolated by ISO-like two-letter code:

| Code | Country | Root |
| --- | --- | --- |
| JP | Japan | `/nioli/countries/jp` |
| MX | Mexico | `/nioli/countries/mx` |
| CO | Colombia | `/nioli/countries/co` |
| US | United States | `/nioli/countries/us` |
| ES | Spain | `/nioli/countries/es` |
| CL | Chile | `/nioli/countries/cl` |
| AR | Argentina | `/nioli/countries/ar` |
| KR | South Korea | `/nioli/countries/kr` |
| CR | Costa Rica | `/nioli/countries/cr` |

Each root separates `passport`, `stamps`, `tickets`, `badges`, `patterns`, `decorations`, and contextual `brady` assets. `countryAssetPacks` and `nioliAssets.countries` are defined in the manifest; components must not hardcode these strings.

Unknown country codes resolve to the generic international pack. Japan is never used as a fallback.

Conceptual flow:

```text
CountryExperience → getProductionReadyCountryAssetPack(code) → audited asset or null → safe fallback
```

## 5. References versus production

Reference files belong under `/public/nioli/refs/`. They document canon and enable later visual comparison. Production files belong in the appropriate non-`refs` directory and are the only files that may be registered in the manifest for normal UI use.

```text
Reference:  public/nioli/refs/countries/japan-reference.png
Production: public/nioli/countries/jp/passport/passport-cover.webp
URL:        /nioli/countries/jp/passport/passport-cover.webp
```

Do not use a reference board as a production fallback.

## 6. Naming

Use lowercase kebab-case names without spaces or accents.

Good examples:

- `brady-neutral.webp`
- `brady-camera.webp`
- `brady-sleepy.webp`
- `passport-cover.webp`
- `stamp-tokyo.webp`
- `ticket-main.webp`
- `pattern-primary.svg`

Do not use generator names, version chatter, or ambiguous names such as `imagegen.png`, `final-final2.png`, or `brady nuevo bueno.png`.

## 7. Formats

| Asset | Preferred format |
| --- | --- |
| Brady and illustrations | WEBP or transparent PNG |
| Logos, marks, simple patterns | SVG |
| Passport covers | WEBP |
| Complex stamps | WEBP or PNG |
| Simple graphic stamps | SVG when practical |
| Reference boards | PNG or JPG |

Do not convert, optimize, recolor, or filter supplied images automatically during this foundation sprint.

## 8. Recommended sizes

| Asset | Recommended size |
| --- | --- |
| Brady full | About 1024 × 1024, transparent |
| Brady mini | 128 × 128 and 256 × 256 |
| Brady avatar | About 512 × 512 |
| Passport cover | About 1200 × 1600 |
| Stamp | About 512 × 512 or proportional |
| UI empty state | About 1200 px on the longest axis |

These are production guidelines, not strict crop requirements.

## 9. Add an asset

1. Confirm that the file follows the approved canon.
2. Rename it using lowercase kebab-case.
3. Place it in the correct production directory outside `refs/`.
4. Remove that directory's `.gitkeep` if the real file now preserves the directory.
5. Add the file URL to `src/lib/nioli/assets/manifest.ts`.
6. Add it to the visual QA allowlist only after a complete visual review; physical existence alone is insufficient.
7. Access it through `getProductionReadyCountryAssetPack` or `getSafeNioliAsset`; do not duplicate the path in a component.
8. Run TypeScript, ESLint, and the production build.

Only register a path after the physical file exists. Until then, keep the manifest value `null`.

## 10. Add a country

1. Add its uppercase code to `NIOLI_COUNTRY_CODES` in `types.ts`.
2. Create `public/nioli/countries/<lowercase-code>/` with the seven standard categories.
3. Add a `.gitkeep` only to categories that remain empty.
4. Register the pack once in `countryAssetPacks` and expose its lowercase key in `nioliAssets.countries`.
5. Leave missing assets as `null`; do not borrow Japan assets.
6. Add a fully unchecked section to `docs/NIOLI_ASSET_INVENTORY.md`.

## 11. Add a city

Create city folders only when real city assets are ready. Use a structure such as:

```text
public/nioli/countries/jp/cities/tokyo/
public/nioli/countries/jp/cities/kyoto/
public/nioli/countries/co/cities/bogota/
public/nioli/countries/co/cities/cartagena/
```

Register the lowercase kebab-case city key in the pack's `cities` map. Do not create large sets of empty city directories in advance.

## 12. Add a Brady expression

1. Add the expression name to `BRADY_EXPRESSIONS` in `types.ts`.
2. Place the approved file under `public/nioli/brady/expressions/`.
3. Register it in `bradyAssets.expressions` in the manifest.
4. Read it through `getBradyExpressionAsset`.
5. Confirm that a missing entry still resolves safely to neutral or `null`.

## 13. Add a stamp

1. Place the approved production file in the country's `stamps/` directory, or in `stamps/generic/` only when it is genuinely international.
2. Use a descriptive name such as `stamp-tokyo.webp`.
3. Register the path in that pack's stamp `items` array; set `primary` only when the asset is the approved primary stamp.
4. Add the inventory item and keep it unchecked until the file physically exists.
5. Never overwrite live Passport or unlocked-stamp data when adding visual assets.

## 14. QA-only assets

Mock GPS images, fake locations, test photos, and test stamps belong exclusively in `/public/nioli/qa/test-only/`. Production manifests and Country Packs must not reference them. QA files should be visibly named as test data and must never be presented as a traveler's real memory or achievement.
