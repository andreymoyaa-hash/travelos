# NIOLI Asset Visual QA

Production visual audit completed against `/qa/nioli-assets` on 2026-08-26. Every physical production image was rendered on light, dark, and checker backgrounds and reviewed as artwork, not only decoded as a file.

## Decision

- Production assets reviewed: **194 / 194** — 14 Brady core assets and 180 Country Pack assets.
- Production-ready: **59 / 194** — all 14 Brady core assets plus 45 Country Pack assets.
- Blocking Country Pack assets retained for replacement: **135**.
- Canon reference boards reviewed only for comparison: **20**. They remain under `/refs` and are not production assets or fallbacks.
- All 14 Brady core PNG files preserve transparency. All 180 Country Pack WebP files are opaque; paper texture is accepted where the asset is a self-contained passport, stamp, badge, or ticket. Opaque country Brady crops and master-sheet fragments are blocking.
- No image was edited, cropped, filtered, recolored, or generated during this audit.

## Country summary

| Country | Production-ready |
| --- | ---: |
| JP | **10/20** |
| MX | **2/20** |
| CO | **7/20** |
| US | **7/20** |
| ES | **5/20** |
| CL | **1/20** |
| AR | **2/20** |
| KR | **2/20** |
| CR | **9/20** |

The production helper uses this review as an allowlist. A blocking asset resolves to `null`; the UI must use a CSS/text treatment or a Brady core asset as its safe fallback. The QA gallery is deliberately exempt so rejected files remain inspectable.

## Brady core observation

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| Core | Actions | `brady-passport-celebrate.png` | `/nioli/brady/actions/brady-passport-celebrate.png` | 1024 × 1536 | The supplied composition is a close head-and-shoulders portrait and does not visually communicate passport use or celebration as clearly as its filename. Transparency and edges are correct. | cosmetic |

## JP — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| JP | Passport | `passport-cover.webp` | `/nioli/countries/jp/passport/passport-cover.webp` | 260 × 365 | Cropped master/reference heading remains at the top edge. | blocking |
| JP | Brady | `brady-jp.webp` | `/nioli/countries/jp/brady/brady-jp.webp` | 220 × 395 | Cropped section heading remains above Brady; feet are cut and the opaque sheet crop is unusable as standalone character art. | blocking |
| JP | Badges / Seals | `badge-primary.webp` | `/nioli/countries/jp/badges/badge-primary.webp` | 177 × 210 | Includes neighboring master-board content and an awkward sheet-crop boundary. | blocking |
| JP | Badges / Seals | `badge-secondary.webp` | `/nioli/countries/jp/badges/badge-secondary.webp` | 178 × 210 | Includes neighboring master-board content and an awkward sheet-crop boundary. | blocking |
| JP | Patterns | `pattern-primary.webp` | `/nioli/countries/jp/patterns/pattern-primary.webp` | 230 × 215 | Not a clean repeatable tile; visible sheet labels/adjacent composition make the proportions unusable as a pattern. | blocking |
| JP | Decorations | `decorations.webp` | `/nioli/countries/jp/decorations/decorations.webp` | 215 × 275 | Multiple decorations are still attached as one cropped master-sheet region with cut neighboring content. | blocking |
| JP | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/jp/decorations/luggage-tag.webp` | 230 × 280 | Contains surrounding sheet content and does not isolate the luggage tag cleanly. | blocking |
| JP | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/jp/tickets/boarding-pass.webp` | 430 × 265 | Crop includes master-board/neighboring content instead of a self-contained boarding pass. | blocking |
| JP | Country Code | `country-code-label.webp` | `/nioli/countries/jp/badges/country-code-label.webp` | 160 × 270 | Tall crop contains adjacent artwork and board text; proportion is unusable as a compact code label. | blocking |
| JP | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/jp/decorations/bonus-assets.webp` | 1050 × 155 | Horizontal strip contains several attached assets and clipped fragments; it is a master-sheet slice, not a production asset. | blocking |

Production-ready JP files: all eight stamps and both ticket files.

## MX — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| MX | Passport | `passport-cover.webp` | `/nioli/countries/mx/passport/passport-cover.webp` | 270 × 415 | Cropped master/reference heading remains at the top. | blocking |
| MX | Brady | `brady-mx.webp` | `/nioli/countries/mx/brady/brady-mx.webp` | 220 × 435 | Section heading and opaque board background remain; lower character edge is cut. | blocking |
| MX | Stamps | `stamp-cdmx.webp` | `/nioli/countries/mx/stamps/stamp-cdmx.webp` | 119 × 155 | Adjacent heading/neighbor fragment remains at the crop edge. | blocking |
| MX | Stamps | `stamp-cempasuchil.webp` | `/nioli/countries/mx/stamps/stamp-cempasuchil.webp` | 118 × 156 | Adjacent master-board fragment remains at the crop edge. | blocking |
| MX | Stamps | `stamp-desierto.webp` | `/nioli/countries/mx/stamps/stamp-desierto.webp` | 118 × 156 | Adjacent artwork intrudes into the stamp crop. | blocking |
| MX | Stamps | `stamp-oaxaca.webp` | `/nioli/countries/mx/stamps/stamp-oaxaca.webp` | 118 × 155 | Neighboring stamp/board marks remain on the edge. | blocking |
| MX | Stamps | `stamp-puebla.webp` | `/nioli/countries/mx/stamps/stamp-puebla.webp` | 119 × 156 | Adjacent master-sheet marks remain and the stamp is pressed awkwardly against the boundary. | blocking |
| MX | Stamps | `stamp-talavera.webp` | `/nioli/countries/mx/stamps/stamp-talavera.webp` | 118 × 156 | Neighboring sheet content remains at the crop edge. | blocking |
| MX | Tickets | `ticket-primary.webp` | `/nioli/countries/mx/tickets/ticket-primary.webp` | 395 × 150 | Small neighboring decoration is attached at the lower edge. | blocking |
| MX | Tickets | `ticket-secondary.webp` | `/nioli/countries/mx/tickets/ticket-secondary.webp` | 395 × 150 | Master-board text “7. LUGGAGE TAG” remains below the ticket. | blocking |
| MX | Badges / Seals | `badge-primary.webp` | `/nioli/countries/mx/badges/badge-primary.webp` | 165 × 235 | Badge crop contains adjacent master-sheet content. | blocking |
| MX | Badges / Seals | `badge-secondary.webp` | `/nioli/countries/mx/badges/badge-secondary.webp` | 165 × 235 | Badge crop contains adjacent master-sheet content. | blocking |
| MX | Patterns | `pattern-primary.webp` | `/nioli/countries/mx/patterns/pattern-primary.webp` | 275 × 230 | Includes board labeling/adjacent objects and is not a seamless, reusable pattern tile. | blocking |
| MX | Decorations | `decorations.webp` | `/nioli/countries/mx/decorations/decorations.webp` | 250 × 280 | Multiple assets and cropped neighbor parts remain joined in one sheet slice. | blocking |
| MX | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/mx/decorations/luggage-tag.webp` | 200 × 285 | Tag is not isolated; surrounding master-board content remains. | blocking |
| MX | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/mx/tickets/boarding-pass.webp` | 420 × 275 | Contains adjacent board material and an uncomfortable cut along the composition. | blocking |
| MX | Country Code | `country-code-label.webp` | `/nioli/countries/mx/badges/country-code-label.webp` | 175 × 255 | Tall master-sheet crop contains other content and unusable whitespace/proportion for a code label. | blocking |
| MX | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/mx/decorations/bonus-assets.webp` | 1065 × 200 | Wide master-sheet strip contains multiple attached and clipped assets. | blocking |

Production-ready MX files: `stamp-cenotes.webp` and `stamp-tacos.webp`.

## CO — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| CO | Brady | `brady-co.webp` | `/nioli/countries/co/brady/brady-co.webp` | 210 × 410 | Cropped section heading and opaque master-board background remain; character edge is cut. | blocking |
| CO | Stamps | `stamp-bogota.webp` | `/nioli/countries/co/stamps/stamp-bogota.webp` | 116 × 199 | Handwritten text from the neighboring board area intrudes at the left edge. | blocking |
| CO | Stamps | `stamp-cafe.webp` | `/nioli/countries/co/stamps/stamp-cafe.webp` | 116 × 199 | Perforated edge of a neighboring stamp remains at the left. | blocking |
| CO | Stamps | `stamp-salento.webp` | `/nioli/countries/co/stamps/stamp-salento.webp` | 116 × 199 | Neighboring marks/leaf artwork intrudes at the left edge. | blocking |
| CO | Tickets | `ticket-primary.webp` | `/nioli/countries/co/tickets/ticket-primary.webp` | 360 × 110 | Adjacent master-board content remains attached to the ticket crop. | blocking |
| CO | Badges / Seals | `badge-primary.webp` | `/nioli/countries/co/badges/badge-primary.webp` | 177 × 215 | Includes neighboring master-sheet content and an awkward cut. | blocking |
| CO | Badges / Seals | `badge-secondary.webp` | `/nioli/countries/co/badges/badge-secondary.webp` | 178 × 215 | Includes neighboring master-sheet content and an awkward cut. | blocking |
| CO | Patterns | `pattern-primary.webp` | `/nioli/countries/co/patterns/pattern-primary.webp` | 290 × 215 | Contains sheet labels/objects and cannot be used as a clean repeating pattern. | blocking |
| CO | Decorations | `decorations.webp` | `/nioli/countries/co/decorations/decorations.webp` | 325 × 255 | Several objects remain joined with cropped neighboring content. | blocking |
| CO | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/co/decorations/luggage-tag.webp` | 175 × 260 | Tag is not isolated from the master-board composition. | blocking |
| CO | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/co/tickets/boarding-pass.webp` | 340 × 265 | Boarding-pass region includes adjacent/cut board content. | blocking |
| CO | Country Code | `country-code-label.webp` | `/nioli/countries/co/badges/country-code-label.webp` | 180 × 235 | Country-code crop includes unrelated board content and unusable tall proportions. | blocking |
| CO | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/co/decorations/bonus-assets.webp` | 1055 × 200 | Horizontal master-sheet slice contains multiple attached and clipped assets. | blocking |

Production-ready CO files: passport cover; Cali, Cartagena, Guatapé, Medellín, and Tayrona stamps; and the secondary ticket.

## US — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| US | Brady | `brady-us.webp` | `/nioli/countries/us/brady/brady-us.webp` | 215 × 465 | Section heading/board background remains and the character composition is cut at the edge. | blocking |
| US | Stamps | `stamp-california.webp` | `/nioli/countries/us/stamps/stamp-california.webp` | 117 × 219 | Neighboring master-sheet content intrudes at the crop boundary. | blocking |
| US | Stamps | `stamp-national-parks.webp` | `/nioli/countries/us/stamps/stamp-national-parks.webp` | 117 × 220 | Adjacent artwork/board marks remain at the edge. | blocking |
| US | Stamps | `stamp-new-york.webp` | `/nioli/countries/us/stamps/stamp-new-york.webp` | 117 × 219 | Neighboring sheet content remains attached to the crop. | blocking |
| US | Stamps | `stamp-route-66.webp` | `/nioli/countries/us/stamps/stamp-route-66.webp` | 118 × 219 | Neighboring master-board fragment remains at the edge. | blocking |
| US | Stamps | `stamp-yellowstone.webp` | `/nioli/countries/us/stamps/stamp-yellowstone.webp` | 117 × 219 | Adjacent stamp/board marks intrude into the crop. | blocking |
| US | Badges / Seals | `badge-primary.webp` | `/nioli/countries/us/badges/badge-primary.webp` | 147 × 230 | Badge includes neighboring sheet content and an accidental cut. | blocking |
| US | Patterns | `pattern-primary.webp` | `/nioli/countries/us/patterns/pattern-primary.webp` | 320 × 225 | Sheet composition/labels make the image unusable as a repeatable pattern. | blocking |
| US | Decorations | `decorations.webp` | `/nioli/countries/us/decorations/decorations.webp` | 240 × 265 | Multiple objects remain attached with clipped neighboring artwork. | blocking |
| US | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/us/decorations/luggage-tag.webp` | 175 × 255 | Luggage tag is not isolated from surrounding board content. | blocking |
| US | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/us/tickets/boarding-pass.webp` | 405 × 260 | Boarding-pass crop includes adjacent/cut master-board content. | blocking |
| US | Country Code | `country-code-label.webp` | `/nioli/countries/us/badges/country-code-label.webp` | 205 × 255 | Country-code crop contains unrelated sheet material and unusable proportions. | blocking |
| US | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/us/decorations/bonus-assets.webp` | 1055 × 205 | Wide master-sheet strip contains multiple attached and clipped assets. | blocking |

Production-ready US files: passport cover; Chicago, diner, and Grand Canyon stamps; both tickets; and the secondary badge.

## ES — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| ES | Brady | `brady-es.webp` | `/nioli/countries/es/brady/brady-es.webp` | 200 × 405 | Cropped section heading and opaque board background remain; character is cut at the edge. | blocking |
| ES | Stamps | `stamp-barcelona.webp` | `/nioli/countries/es/stamps/stamp-barcelona.webp` | 119 × 201 | Neighboring master-sheet marks remain at the crop edge. | blocking |
| ES | Stamps | `stamp-bilbao.webp` | `/nioli/countries/es/stamps/stamp-bilbao.webp` | 118 × 202 | Stamp title/art is visibly cut on the right edge (`BILBA…`). | blocking |
| ES | Stamps | `stamp-camino.webp` | `/nioli/countries/es/stamps/stamp-camino.webp` | 118 × 202 | Neighboring sheet fragment intrudes at the boundary. | blocking |
| ES | Stamps | `stamp-granada.webp` | `/nioli/countries/es/stamps/stamp-granada.webp` | 119 × 202 | Adjacent master-board marks remain in the crop. | blocking |
| ES | Stamps | `stamp-madrid.webp` | `/nioli/countries/es/stamps/stamp-madrid.webp` | 118 × 201 | Neighboring artwork/board marks remain at the edge. | blocking |
| ES | Tickets | `ticket-primary.webp` | `/nioli/countries/es/tickets/ticket-primary.webp` | 435 × 117 | Adjacent master-sheet content remains attached. | blocking |
| ES | Badges / Seals | `badge-primary.webp` | `/nioli/countries/es/badges/badge-primary.webp` | 155 × 235 | Badge contains neighboring board content. | blocking |
| ES | Badges / Seals | `badge-secondary.webp` | `/nioli/countries/es/badges/badge-secondary.webp` | 155 × 235 | Badge contains neighboring board content. | blocking |
| ES | Patterns | `pattern-primary.webp` | `/nioli/countries/es/patterns/pattern-primary.webp` | 290 × 235 | Includes board labels/objects and is not a clean repeatable tile. | blocking |
| ES | Decorations | `decorations.webp` | `/nioli/countries/es/decorations/decorations.webp` | 255 × 280 | Multiple decorations remain joined with clipped neighboring content. | blocking |
| ES | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/es/decorations/luggage-tag.webp` | 185 × 275 | Tag remains embedded in the board crop rather than isolated. | blocking |
| ES | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/es/tickets/boarding-pass.webp` | 420 × 275 | Boarding-pass region includes adjacent/cut master-sheet content. | blocking |
| ES | Country Code | `country-code-label.webp` | `/nioli/countries/es/badges/country-code-label.webp` | 165 × 270 | Tall crop contains unrelated board material and is unusable as a compact label. | blocking |
| ES | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/es/decorations/bonus-assets.webp` | 1055 × 200 | Wide master-sheet strip contains several attached and clipped assets. | blocking |

Production-ready ES files: passport cover; Sevilla, tapas, and Valencia stamps; and the secondary ticket.

## CL — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| CL | Passport | `passport-cover.webp` | `/nioli/countries/cl/passport/passport-cover.webp` | 355 × 440 | Master/reference heading remains above the passport. | blocking |
| CL | Brady | `brady-cl.webp` | `/nioli/countries/cl/brady/brady-cl.webp` | 325 × 450 | Section heading and opaque board background remain; composition is not standalone Brady art. | blocking |
| CL | Stamps | `stamp-atacama.webp` | `/nioli/countries/cl/stamps/stamp-atacama.webp` | 236 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Stamps | `stamp-costa-chilena.webp` | `/nioli/countries/cl/stamps/stamp-costa-chilena.webp` | 236 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Stamps | `stamp-los-andes.webp` | `/nioli/countries/cl/stamps/stamp-los-andes.webp` | 236 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Stamps | `stamp-observatorio.webp` | `/nioli/countries/cl/stamps/stamp-observatorio.webp` | 236 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Stamps | `stamp-patagonia.webp` | `/nioli/countries/cl/stamps/stamp-patagonia.webp` | 236 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Stamps | `stamp-santiago.webp` | `/nioli/countries/cl/stamps/stamp-santiago.webp` | 236 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Stamps | `stamp-torres-del-paine.webp` | `/nioli/countries/cl/stamps/stamp-torres-del-paine.webp` | 235 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Stamps | `stamp-valparaiso.webp` | `/nioli/countries/cl/stamps/stamp-valparaiso.webp` | 235 × 107 | Contains two adjacent partial stamps side by side; category proportion is unusable. | blocking |
| CL | Tickets | `ticket-primary.webp` | `/nioli/countries/cl/tickets/ticket-primary.webp` | 405 × 77 | Master-board heading remains attached above/beside the ticket strip. | blocking |
| CL | Badges / Seals | `badge-primary.webp` | `/nioli/countries/cl/badges/badge-primary.webp` | 152 × 150 | Includes adjacent sheet content and an accidental crop boundary. | blocking |
| CL | Badges / Seals | `badge-secondary.webp` | `/nioli/countries/cl/badges/badge-secondary.webp` | 153 × 150 | Includes adjacent sheet content and an accidental crop boundary. | blocking |
| CL | Patterns | `pattern-primary.webp` | `/nioli/countries/cl/patterns/pattern-primary.webp` | 320 × 150 | Retains ticket/board fragments and is not a seamless pattern tile. | blocking |
| CL | Decorations | `decorations.webp` | `/nioli/countries/cl/decorations/decorations.webp` | 365 × 185 | Decoration strip includes adjacent header/content from the master board. | blocking |
| CL | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/cl/decorations/luggage-tag.webp` | 195 × 245 | Luggage tag is not isolated from surrounding board content. | blocking |
| CL | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/cl/tickets/boarding-pass.webp` | 445 × 255 | Contains severe neighboring/cut board content rather than a clean boarding pass. | blocking |
| CL | Country Code | `country-code-label.webp` | `/nioli/countries/cl/badges/country-code-label.webp` | 385 × 170 | Contains adjacent artwork/labels and unusable proportions for a country-code label. | blocking |
| CL | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/cl/decorations/bonus-assets.webp` | 675 × 185 | Master-sheet strip contains multiple attached and clipped objects. | blocking |

Production-ready CL file: the secondary ticket only.

## AR — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| AR | Passport | `passport-cover.webp` | `/nioli/countries/ar/passport/passport-cover.webp` | 260 × 440 | Cropped master/reference heading remains at the top. | blocking |
| AR | Brady | `brady-ar.webp` | `/nioli/countries/ar/brady/brady-ar.webp` | 215 × 435 | Character is visibly cut on the right and bottom and remains on an opaque board crop. | blocking |
| AR | Stamps | `stamp-bariloche.webp` | `/nioli/countries/ar/stamps/stamp-bariloche.webp` | 119 × 206 | Neighboring master-sheet content intrudes at the crop edge. | blocking |
| AR | Stamps | `stamp-buenos-aires.webp` | `/nioli/countries/ar/stamps/stamp-buenos-aires.webp` | 119 × 206 | Stamp/title is visibly clipped on the right edge. | blocking |
| AR | Stamps | `stamp-iguazu.webp` | `/nioli/countries/ar/stamps/stamp-iguazu.webp` | 119 × 207 | Neighboring board content remains at the boundary. | blocking |
| AR | Stamps | `stamp-mate.webp` | `/nioli/countries/ar/stamps/stamp-mate.webp` | 119 × 207 | Adjacent artwork/marks intrude into the crop. | blocking |
| AR | Stamps | `stamp-mendoza.webp` | `/nioli/countries/ar/stamps/stamp-mendoza.webp` | 119 × 206 | Neighboring master-sheet fragment remains at the edge. | blocking |
| AR | Stamps | `stamp-patagonia.webp` | `/nioli/countries/ar/stamps/stamp-patagonia.webp` | 119 × 207 | Stamp/neighboring content is cut awkwardly at the boundary. | blocking |
| AR | Stamps | `stamp-tren-a-las-nubes.webp` | `/nioli/countries/ar/stamps/stamp-tren-a-las-nubes.webp` | 119 × 207 | Adjacent sheet content remains and the composition is cramped against the edge. | blocking |
| AR | Tickets | `ticket-primary.webp` | `/nioli/countries/ar/tickets/ticket-primary.webp` | 400 × 110 | Neighboring master-board material remains attached. | blocking |
| AR | Tickets | `ticket-secondary.webp` | `/nioli/countries/ar/tickets/ticket-secondary.webp` | 400 × 110 | Neighboring master-board material remains attached. | blocking |
| AR | Badges / Seals | `badge-secondary.webp` | `/nioli/countries/ar/badges/badge-secondary.webp` | 148 × 215 | Contains neighboring board content and an accidental cut. | blocking |
| AR | Patterns | `pattern-primary.webp` | `/nioli/countries/ar/patterns/pattern-primary.webp` | 305 × 225 | Includes board labels/objects and is not a reusable pattern tile. | blocking |
| AR | Decorations | `decorations.webp` | `/nioli/countries/ar/decorations/decorations.webp` | 235 × 245 | Wrong crop includes country-code/header content rather than isolated decorations. | blocking |
| AR | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/ar/decorations/luggage-tag.webp` | 195 × 265 | Tag remains embedded in surrounding master-board content. | blocking |
| AR | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/ar/tickets/boarding-pass.webp` | 420 × 265 | Boarding-pass crop contains adjacent/cut sheet content. | blocking |
| AR | Country Code | `country-code-label.webp` | `/nioli/countries/ar/badges/country-code-label.webp` | 180 × 255 | Wrong region: mostly boarding-pass/barcode material, not an isolated country-code label. | blocking |
| AR | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/ar/decorations/bonus-assets.webp` | 1065 × 195 | Wide master-sheet strip contains several attached and clipped assets. | blocking |

Production-ready AR files: Córdoba stamp and primary badge.

## KR — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| KR | Passport | `passport-cover.webp` | `/nioli/countries/kr/passport/passport-cover.webp` | 270 × 390 | Cropped master/reference heading remains at the top. | blocking |
| KR | Brady | `brady-kr.webp` | `/nioli/countries/kr/brady/brady-kr.webp` | 200 × 460 | Section heading/opaque board remains and the character is cut at the edge. | blocking |
| KR | Stamps | `stamp-bibimbap.webp` | `/nioli/countries/kr/stamps/stamp-bibimbap.webp` | 95 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Stamps | `stamp-bonus-stamp.webp` | `/nioli/countries/kr/stamps/stamp-bonus-stamp.webp` | 96 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Stamps | `stamp-busan.webp` | `/nioli/countries/kr/stamps/stamp-busan.webp` | 96 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Stamps | `stamp-gyeongju.webp` | `/nioli/countries/kr/stamps/stamp-gyeongju.webp` | 95 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Stamps | `stamp-hanok.webp` | `/nioli/countries/kr/stamps/stamp-hanok.webp` | 96 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Stamps | `stamp-ktx.webp` | `/nioli/countries/kr/stamps/stamp-ktx.webp` | 96 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Stamps | `stamp-night-city.webp` | `/nioli/countries/kr/stamps/stamp-night-city.webp` | 95 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Stamps | `stamp-seoul.webp` | `/nioli/countries/kr/stamps/stamp-seoul.webp` | 95 × 250 | Contains two vertically stacked partial stamps; proportion and composition are unusable. | blocking |
| KR | Badges / Seals | `badge-primary.webp` | `/nioli/countries/kr/badges/badge-primary.webp` | 167 × 220 | Badge contains neighboring master-sheet content. | blocking |
| KR | Badges / Seals | `badge-secondary.webp` | `/nioli/countries/kr/badges/badge-secondary.webp` | 168 × 220 | Badge contains neighboring master-sheet content. | blocking |
| KR | Patterns | `pattern-primary.webp` | `/nioli/countries/kr/patterns/pattern-primary.webp` | 335 × 170 | Contains ticket/board fragments and cannot tile as a production pattern. | blocking |
| KR | Decorations | `decorations.webp` | `/nioli/countries/kr/decorations/decorations.webp` | 270 × 250 | Multiple objects remain joined with cropped neighboring content. | blocking |
| KR | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/kr/decorations/luggage-tag.webp` | 175 × 260 | Luggage tag is not isolated from the master board. | blocking |
| KR | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/kr/tickets/boarding-pass.webp` | 380 × 255 | Boarding-pass region includes adjacent/cut board content. | blocking |
| KR | Country Code | `country-code-label.webp` | `/nioli/countries/kr/badges/country-code-label.webp` | 185 × 245 | Country-code crop contains unrelated sheet material and unusable proportions. | blocking |
| KR | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/kr/decorations/bonus-assets.webp` | 1055 × 205 | Wide master-sheet strip contains multiple attached and clipped assets. | blocking |

Production-ready KR files: primary and secondary tickets.

## CR — blockers

| Country | Category | Filename | Path | Dimensions | Visual problem | Severity |
| --- | --- | --- | --- | ---: | --- | --- |
| CR | Passport | `passport-cover.webp` | `/nioli/countries/cr/passport/passport-cover.webp` | 245 × 425 | Cropped master/reference heading remains at the top. | blocking |
| CR | Brady | `brady-cr.webp` | `/nioli/countries/cr/brady/brady-cr.webp` | 220 × 450 | Section heading and opaque board background remain; character crop is not standalone. | blocking |
| CR | Tickets | `ticket-primary.webp` | `/nioli/countries/cr/tickets/ticket-primary.webp` | 400 × 120 | Master-board heading remains attached to the ticket crop. | blocking |
| CR | Tickets | `ticket-secondary.webp` | `/nioli/countries/cr/tickets/ticket-secondary.webp` | 400 × 120 | A strip from another ticket remains above the intended ticket. | blocking |
| CR | Badges / Seals | `badge-primary.webp` | `/nioli/countries/cr/badges/badge-primary.webp` | 162 × 235 | Master-board heading/neighbor content remains. | blocking |
| CR | Patterns | `pattern-primary.webp` | `/nioli/countries/cr/patterns/pattern-primary.webp` | 295 × 235 | Includes board labels/objects and is not a clean repeatable pattern tile. | blocking |
| CR | Decorations | `decorations.webp` | `/nioli/countries/cr/decorations/decorations.webp` | 240 × 260 | Multiple decorations remain joined with cut neighboring artwork. | blocking |
| CR | Luggage Tags | `luggage-tag.webp` | `/nioli/countries/cr/decorations/luggage-tag.webp` | 190 × 280 | Luggage tag is visibly cut/attached to surrounding board content. | blocking |
| CR | Boarding Pass | `boarding-pass.webp` | `/nioli/countries/cr/tickets/boarding-pass.webp` | 420 × 265 | Boarding-pass region contains neighboring/cut master-sheet material. | blocking |
| CR | Country Code | `country-code-label.webp` | `/nioli/countries/cr/badges/country-code-label.webp` | 180 × 255 | Country-code crop contains unrelated board content and unusable tall proportions. | blocking |
| CR | Bonus Assets | `bonus-assets.webp` | `/nioli/countries/cr/decorations/bonus-assets.webp` | 1060 × 200 | Wide master-sheet strip contains several attached and clipped assets. | blocking |

Production-ready CR files: all eight stamps and the secondary badge.

## Safe fallback contract

- Country assets may enter the main UI only through `getProductionReadyCountryAssetPack` or `getSafeNioliAsset`.
- The 135 blocking paths are exposed as `NIOLI_BLOCKING_ASSET_PATHS` so replacements can be tracked without deleting supplied files.
- A missing/rejected passport falls back to the existing generated passport treatment.
- A missing/rejected country Brady falls back to the transparent Brady core action/state appropriate to the screen.
- Rejected decorative, ticket, badge, pattern, and stamp art is omitted; the existing semantic UI remains intact.
- `/qa/nioli-assets` continues to show every supplied production file and every canon reference for development review only.
