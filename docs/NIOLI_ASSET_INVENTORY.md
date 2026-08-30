# NIOLI Asset Inventory

Audited against the physical files under `/public/nioli` after Asset Drop V2 ingestion.

## Summary

- Visual assets found: **214**
- Production assets: **194**
- BRADY core production assets: **14**
- Country production assets: **180** — 20 per Country Pack
- Canon reference assets: **20**
- QA/test visual assets: **0**
- Non-visual support files: **4** — two READMEs, one JSON inventory, and the V1 ZIP scaffold

References are counted separately and are never production-ready merely because they exist.

Physical presence in this inventory is not visual approval. Production eligibility and all retained blockers are recorded in [`NIOLI_ASSET_VISUAL_QA.md`](./NIOLI_ASSET_VISUAL_QA.md).

## Brand

- [ ] Primary NIOLI logo
- [ ] Compact NIOLI logo
- [ ] NIOLI mark
- [ ] App icon set

## BRADY core — 14 physical assets

### Base

- [x] Backpack prop — `brady-backpack.png`
- [x] Neutral full body — `brady-neutral.png`
- [x] Seated/resting pose — `brady-resting.png`
- [x] Standing pose — `brady-standing.png`

### Actions

- [x] Camera — `brady-camera.png`
- [x] Camera review — `brady-camera-review.png`
- [x] Celebrate — `brady-celebrate.png`
- [x] Exploring — `brady-exploring.png`
- [x] Map/confused — `brady-map-confused.png`
- [x] Passport — `brady-passport.png`
- [x] Passport/celebrate variant — `brady-passport-celebrate.png`
- [x] Pointing — `brady-pointing.png`

### States

- [x] Offline — `brady-offline.png`
- [x] Sleepy variant — `brady-sleepy-alt.png`

### BRADY assets still missing

- [ ] Neutral head
- [ ] Dedicated happy, curious, excited, proud, worried, and confused expressions
- [ ] Loading, syncing, empty-trip, new-stamp, and trip-complete functional states
- [ ] Planning action
- [ ] Mini 128 px, mini 256 px, and avatar 512 px

## JP — Japan — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): Kyoto, Nara, Osaka, ramen, sakura season, Shinkansen, temple, Tokyo
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## MX — Mexico — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): CDMX, cempasúchil, cenotes, desierto, Oaxaca, Puebla, tacos, Talavera
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## CO — Colombia — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): Bogotá, café, Cali, Cartagena, Guatapé, Medellín, Salento, Tayrona
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## US — United States — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): California, Chicago, diner, Grand Canyon, national parks, New York, Route 66, Yellowstone
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## ES — Spain — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): Barcelona, Bilbao, Camino, Granada, Madrid, Sevilla, tapas, Valencia
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## CL — Chile — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): Atacama, costa chilena, Los Andes, observatorio, Patagonia, Santiago, Torres del Paine, Valparaíso
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## AR — Argentina — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): Bariloche, Buenos Aires, Córdoba, Iguazú, mate, Mendoza, Patagonia, Tren a las Nubes
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## KR — South Korea — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): bibimbap, bonus stamp, Busan, Gyeongju, hanok, KTX, night city, Seoul
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## CR — Costa Rica — 20 production assets

- [x] Passport cover
- [x] Country Brady
- [x] Stamps (8): adventure, beaches, coffee, pura vida, rainforest, volcanos, waterfalls, wildlife
- [x] Tickets (2): primary and secondary
- [x] Badges / seals (2): primary and secondary
- [x] Primary pattern
- [x] Decorations
- [x] Luggage tag
- [x] Boarding pass
- [x] Country code label
- [x] Bonus assets crop

## Country Pack gaps and QA observations

- All nine packs contain every requested V2 category and exactly 20 physical production files.
- [ ] No country includes passport-inside or passport-back assets.
- [ ] No standalone transit/bonus file exists beyond each `bonus-assets.webp` crop; transit-themed stamps exist where supplied.
- All 180 country WebP crops are opaque. The supplied V2 README says paper texture may be intentional.
- Several crops retain master-sheet headings or neighboring artwork and some content touches or crosses crop edges. These files require manual design review before broad UI integration; they were not altered.

## Generic / international

- [ ] Generic passport cover
- [ ] Generic primary stamp
- [ ] Generic main ticket
- [ ] Generic primary pattern
- [ ] Generic empty-state illustration

Unknown countries continue to resolve to this empty international pack, never to Japan.

## Canon references — 20 physical assets, not production

### BRADY references

- [x] Master reference sheet — `brady-master-reference.png`
- [x] Sticker reference sheet — `brady-sticker-reference.png`

### Country references

- [x] JP — V1 reference pack and V2 country master
- [x] MX — V1 reference pack and V2 country master
- [x] CO — V1 reference pack and V2 country master
- [x] US — V1 reference pack and V2 country master
- [x] ES — V1 reference pack and V2 country master
- [x] CL — V1 reference pack and V2 country master
- [x] AR — V1 reference pack and V2 country master
- [x] KR — V1 reference pack and V2 country master
- [x] CR — V1 reference pack and V2 country master

## QA-only

- [ ] Mock GPS asset
- [ ] Fake-location asset
- [ ] Test photo
- [ ] Test stamp
