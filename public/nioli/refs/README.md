# NIOLI visual references

This directory stores the visual canon supplied manually for **NIOLI** and its official mascot, **BRADY**.

## Purpose

- `brady/` documents Brady's approved proportions, face, green scarf, ochre backpack, expressions, and poses.
- `countries/` documents the approved visual identity for future Country Packs.
- Reference boards are used for comparison and design guidance only.

Files in `refs/` are not production assets. Application components should normally obtain production assets from `src/lib/nioli/assets/manifest.ts`, and those assets must live elsewhere under `/public/nioli/`.

Example:

- Reference: `/public/nioli/refs/countries/japan-reference.png`
- Production: `/public/nioli/countries/jp/passport/passport-cover.webp`

## Canon rules

Do not redraw, modernize, recolor, filter, crop automatically, or change Brady's proportions. Do not alter Brady's face, green scarf, or ochre backpack. Country Packs may add context around Brady, but they must not create a different country-specific Brady design.

Reference boards should use lowercase kebab-case names and normally remain PNG or JPG files. Never import a reference path as a silent production fallback.
