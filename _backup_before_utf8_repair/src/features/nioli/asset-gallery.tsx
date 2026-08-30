"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import styles from "@/features/nioli/asset-gallery.module.css";
import { getCountryAssetPack, isNioliCountryCode } from "@/lib/nioli/assets/helpers";
import { bradyIndividualAssets, countryAssetPacks } from "@/lib/nioli/assets/manifest";
import { bradyReferenceAssets, countryReferenceAssets } from "@/lib/nioli/assets/references";
import { isProductionReadyNioliAsset } from "@/lib/nioli/assets/visual-qa";
import {
  NIOLI_COUNTRY_CODES,
  type CountryAssetPack,
  type NioliAssetCollection,
  type NioliAssetPath,
  type NioliCountryCode,
  type OptionalNioliAsset,
} from "@/lib/nioli/assets/types";

const COUNTRY_LABELS: Readonly<Record<NioliCountryCode, string>> = {
  JP: "Japan",
  MX: "Mexico",
  CO: "Colombia",
  US: "United States",
  ES: "Spain",
  CL: "Chile",
  AR: "Argentina",
  KR: "South Korea",
  CR: "Costa Rica",
};

type GallerySelection = "CORE" | "PASSPORTS" | "STAMPS" | "REFERENCES" | NioliCountryCode;

interface GalleryAsset {
  label: string;
  path: NioliAssetPath;
  reference?: boolean;
}

interface GallerySectionData {
  title: string;
  description?: string;
  assets: readonly GalleryAsset[];
}

const BACKGROUNDS = [
  { id: "light", label: "Light", className: styles.lightPreview },
  { id: "dark", label: "Dark", className: styles.darkPreview },
  { id: "checker", label: "Checker", className: styles.checkerPreview },
] as const;

function filenameFromPath(path: NioliAssetPath): string {
  return path.split("/").at(-1) ?? path;
}

function labelFromPath(path: NioliAssetPath): string {
  return filenameFromPath(path)
    .replace(/\.[^.]+$/, "")
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function optionalAsset(label: string, path: OptionalNioliAsset): GalleryAsset[] {
  return path ? [{ label, path }] : [];
}

function collectionAssets(collection: NioliAssetCollection): GalleryAsset[] {
  const primary = collection.primary ? [{ label: labelFromPath(collection.primary), path: collection.primary }] : [];
  return [...primary, ...collection.items.map((path) => ({ label: labelFromPath(path), path }))];
}

function countrySections(pack: CountryAssetPack): GallerySectionData[] {
  const references = countryReferenceAssets
    .filter((asset) => asset.countryCode === pack.countryCode)
    .map((asset) => ({ label: asset.label, path: asset.path, reference: true }));

  return [
    {
      title: "Passport",
      assets: [
        ...optionalAsset("Passport cover", pack.passport.cover),
        ...optionalAsset("Passport inside", pack.passport.inside),
        ...optionalAsset("Passport back", pack.passport.back),
      ],
    },
    { title: "Brady", assets: collectionAssets(pack.brady) },
    { title: "Stamps", assets: collectionAssets(pack.stamps) },
    { title: "Tickets", assets: collectionAssets(pack.tickets) },
    { title: "Badges / Seals", assets: collectionAssets(pack.badges) },
    {
      title: "Patterns",
      assets: [
        ...optionalAsset("Primary pattern", pack.patterns.primary),
        ...optionalAsset("Secondary pattern", pack.patterns.secondary),
        ...pack.patterns.items.map((path) => ({ label: labelFromPath(path), path })),
      ],
    },
    { title: "Decorations", assets: collectionAssets(pack.decorations) },
    { title: "Luggage Tags", assets: optionalAsset("Luggage tag", pack.luggageTag) },
    { title: "Boarding Pass", assets: optionalAsset("Boarding pass", pack.boardingPass) },
    { title: "Country Code", assets: optionalAsset("Country code label", pack.countryCodeLabel) },
    { title: "Bonus Assets", assets: collectionAssets(pack.bonusAssets) },
    {
      title: "CANON REFERENCES — REFERENCE ONLY",
      description: "Full reference sheets are shown only for visual comparison and are never production fallbacks.",
      assets: references,
    },
  ];
}

function coreSections(): GallerySectionData[] {
  return Object.entries(bradyIndividualAssets).map(([title, assets]) => ({
    title: `BRADY ${title}`,
    assets: Object.entries(assets).map(([label, path]) => ({ label, path })),
  }));
}

function AssetCard({ asset }: { asset: GalleryAsset }) {
  const [dimensions, setDimensions] = useState("Detecting…");
  const captureDimensions = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
    }
  }, []);
  const filename = filenameFromPath(asset.path);
  const fileType = filename.split(".").at(-1)?.toUpperCase() ?? "Unknown";
  const technicalStatus = asset.reference
    ? "REFERENCE ONLY"
    : asset.path.includes("/countries/")
      ? isProductionReadyNioliAsset(asset.path) ? "PRODUCTION READY" : "BLOCKING — SAFE FALLBACK REQUIRED"
      : asset.path.endsWith("brady-passport-celebrate.png") ? "PRODUCTION READY · cosmetic naming note" : "PRODUCTION READY · transparent Brady asset";

  return (
    <figure
      className={`${styles.card} ${asset.reference ? styles.referenceCard : ""}`}
      data-asset-path={asset.path}
      data-asset-reference={asset.reference ? "true" : "false"}
      data-asset-production-ready={asset.reference ? "false" : isProductionReadyNioliAsset(asset.path) ? "true" : "false"}
    >
      <div className={styles.backgroundGrid}>
        {BACKGROUNDS.map((background, index) => (
          <div className={`${styles.previewPane} ${background.className}`} key={background.id}>
            <span className={styles.backgroundLabel}>{background.label}</span>
            <div className={styles.imageFrame}>
              <Image
                alt={index === 0 ? asset.label : ""}
                className={styles.image}
                fill
                loading="lazy"
                onLoad={index === 0 ? (event) => captureDimensions(event.currentTarget) : undefined}
                ref={index === 0 ? captureDimensions : undefined}
                sizes="(max-width: 720px) 30vw, 180px"
                src={asset.path}
                unoptimized
              />
            </div>
          </div>
        ))}
      </div>
      <figcaption className={styles.caption}>
        <div className={styles.captionTitle}>
          <strong>{asset.label}</strong>
          {asset.reference ? <span className={styles.referenceTag}>REFERENCE ONLY</span> : null}
        </div>
        <dl className={styles.metadata}>
          <div>
            <dt>Filename</dt>
            <dd>{filename}</dd>
          </div>
          <div>
            <dt>Dimensions</dt>
            <dd data-asset-dimensions>{dimensions}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{fileType}</dd>
          </div>
          <div>
            <dt>QA</dt>
            <dd>{technicalStatus}</dd>
          </div>
        </dl>
        <code>{asset.path}</code>
      </figcaption>
    </figure>
  );
}

function GallerySection({ section }: { section: GallerySectionData }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>{section.title}</h2>
          {section.description ? <p>{section.description}</p> : null}
        </div>
        <span>{section.assets.length} assets</span>
      </div>
      {section.assets.length > 0 ? (
        <div className={styles.assetGrid}>
          {section.assets.map((asset) => (
            <AssetCard asset={asset} key={asset.path} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No physical assets registered.</p>
      )}
    </section>
  );
}

function SectionList({ sections }: { sections: readonly GallerySectionData[] }) {
  return sections.map((section) => <GallerySection key={section.title} section={section} />);
}

function CountryGallery({ countryCode }: { countryCode: NioliCountryCode }) {
  const pack = getCountryAssetPack(countryCode);
  return (
    <>
      <div className={styles.viewHeading}>
        <p>{countryCode}</p>
        <h2>{COUNTRY_LABELS[countryCode]} Country Pack</h2>
        <span>{pack.assetRoot}</span>
      </div>
      <SectionList sections={countrySections(pack)} />
    </>
  );
}

function PassportCollection() {
  const assets = NIOLI_COUNTRY_CODES.flatMap((countryCode) =>
    optionalAsset(`${countryCode} — ${COUNTRY_LABELS[countryCode]}`, countryAssetPacks[countryCode].passport.cover),
  );
  return (
    <GallerySection
      section={{
        title: "Passport Collection",
        description: "Nine supplied covers shown together without color normalization.",
        assets,
      }}
    />
  );
}

function StampCollection() {
  const sections = NIOLI_COUNTRY_CODES.map((countryCode) => ({
    title: `${countryCode} — ${COUNTRY_LABELS[countryCode]} stamps`,
    assets: collectionAssets(countryAssetPacks[countryCode].stamps),
  }));
  return <SectionList sections={sections} />;
}

function CanonReferences() {
  const brady = bradyReferenceAssets.map((asset) => ({ label: asset.label, path: asset.path, reference: true }));
  const countries = countryReferenceAssets.map((asset) => ({
    label: `${asset.countryCode} — ${asset.label}`,
    path: asset.path,
    reference: true,
  }));

  return (
    <SectionList
      sections={[
        {
          title: "CANON REFERENCES — BRADY",
          description: "REFERENCE ONLY. Never use these boards as production UI art.",
          assets: brady,
        },
        {
          title: "CANON REFERENCES — COUNTRIES",
          description: "REFERENCE ONLY. Master sheets and V1 boards remain separate from production crops.",
          assets: countries,
        },
      ]}
    />
  );
}

function GalleryContent({ selection }: { selection: GallerySelection }) {
  if (selection === "CORE") {
    return <SectionList sections={coreSections()} />;
  }
  if (selection === "PASSPORTS") {
    return <PassportCollection />;
  }
  if (selection === "STAMPS") {
    return <StampCollection />;
  }
  if (selection === "REFERENCES") {
    return <CanonReferences />;
  }
  if (isNioliCountryCode(selection)) {
    return <CountryGallery countryCode={selection} />;
  }
  return null;
}

export function NioliAssetGallery() {
  const [selection, setSelection] = useState<GallerySelection>("CORE");

  return (
    <main className={styles.gallery} data-gallery-selection={selection}>
      <header className={styles.header}>
        <p className={styles.environment}>Development / QA only</p>
        <h1>NIOLI Asset Gallery</h1>
        <p>
          Assets are rendered exactly as supplied on light, dark, and checker backgrounds. No crop, filter,
          recolor, or generated artwork is applied.
        </p>
      </header>

      <div className={styles.toolbar}>
        <label htmlFor="nioli-gallery-selection">Asset collection</label>
        <select
          id="nioli-gallery-selection"
          onChange={(event) => setSelection(event.target.value as GallerySelection)}
          value={selection}
        >
          <option value="CORE">Core</option>
          {NIOLI_COUNTRY_CODES.map((countryCode) => (
            <option key={countryCode} value={countryCode}>
              {COUNTRY_LABELS[countryCode]}
            </option>
          ))}
          <option value="PASSPORTS">Passport Collection</option>
          <option value="STAMPS">Stamp QA</option>
          <option value="REFERENCES">Canon References</option>
        </select>
        <p>
          Unknown country check: <strong>{getCountryAssetPack("ZZ").countryCode}</strong> fallback; never JP.
        </p>
      </div>

      <GalleryContent selection={selection} />
    </main>
  );
}
