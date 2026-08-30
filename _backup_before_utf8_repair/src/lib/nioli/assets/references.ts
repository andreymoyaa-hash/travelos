import type { NioliAssetPath, NioliCountryCode } from "@/lib/nioli/assets/types";

interface NioliReferenceAsset {
  id: string;
  label: string;
  path: NioliAssetPath;
  width: number;
  height: number;
}

interface NioliCountryReferenceAsset extends NioliReferenceAsset {
  countryCode: NioliCountryCode;
}

// Canon boards are intentionally separate from the production manifest.
// Only development and QA tooling should import this module.
export const bradyReferenceAssets: readonly NioliReferenceAsset[] = [
  {
    id: "master-reference",
    label: "BRADY master reference",
    path: "/nioli/refs/brady/brady-master-reference.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "sticker-reference",
    label: "BRADY sticker reference",
    path: "/nioli/refs/brady/brady-sticker-reference.png",
    width: 1448,
    height: 1086,
  },
];

export const countryReferenceAssets: readonly NioliCountryReferenceAsset[] = [
  {
    id: "japan-v1",
    countryCode: "JP",
    label: "Japan reference pack V1",
    path: "/nioli/refs/countries/japan-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "japan-v2-master",
    countryCode: "JP",
    label: "Japan country master V2",
    path: "/nioli/refs/countries/jp-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "mexico-v1",
    countryCode: "MX",
    label: "Mexico reference pack V1",
    path: "/nioli/refs/countries/mexico-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "mexico-v2-master",
    countryCode: "MX",
    label: "Mexico country master V2",
    path: "/nioli/refs/countries/mx-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "colombia-v1",
    countryCode: "CO",
    label: "Colombia reference pack V1",
    path: "/nioli/refs/countries/colombia-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "colombia-v2-master",
    countryCode: "CO",
    label: "Colombia country master V2",
    path: "/nioli/refs/countries/co-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "usa-v1",
    countryCode: "US",
    label: "United States reference pack V1",
    path: "/nioli/refs/countries/usa-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "usa-v2-master",
    countryCode: "US",
    label: "United States country master V2",
    path: "/nioli/refs/countries/us-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "spain-v1",
    countryCode: "ES",
    label: "Spain reference pack V1",
    path: "/nioli/refs/countries/spain-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "spain-v2-master",
    countryCode: "ES",
    label: "Spain country master V2",
    path: "/nioli/refs/countries/es-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "chile-v1",
    countryCode: "CL",
    label: "Chile reference pack V1",
    path: "/nioli/refs/countries/chile-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "chile-v2-master",
    countryCode: "CL",
    label: "Chile country master V2",
    path: "/nioli/refs/countries/cl-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "argentina-v1",
    countryCode: "AR",
    label: "Argentina reference pack V1",
    path: "/nioli/refs/countries/argentina-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "argentina-v2-master",
    countryCode: "AR",
    label: "Argentina country master V2",
    path: "/nioli/refs/countries/ar-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "south-korea-v1",
    countryCode: "KR",
    label: "South Korea reference pack V1",
    path: "/nioli/refs/countries/south-korea-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "south-korea-v2-master",
    countryCode: "KR",
    label: "South Korea country master V2",
    path: "/nioli/refs/countries/kr-country-master.png",
    width: 1122,
    height: 1402,
  },
  {
    id: "costa-rica-v1",
    countryCode: "CR",
    label: "Costa Rica reference pack V1",
    path: "/nioli/refs/countries/costa-rica-reference-pack.png",
    width: 1448,
    height: 1086,
  },
  {
    id: "costa-rica-v2-master",
    countryCode: "CR",
    label: "Costa Rica country master V2",
    path: "/nioli/refs/countries/cr-country-master.png",
    width: 1122,
    height: 1402,
  },
];
