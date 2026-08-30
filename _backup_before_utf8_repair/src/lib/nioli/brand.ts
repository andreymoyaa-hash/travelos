export interface NioliBrandAssets {
  logoHorizontal: string;
  seal: string;
}

const OFFICIAL_NIOLI_BRAND: NioliBrandAssets = {
  logoHorizontal: "/brand/nioli-logo-horizontal-transparent-v2.png",
  seal: "/brand/nioli-seal-transparent-v2.png",
};

const COUNTRY_BRAND_CODES = new Set(["JP", "MX", "CO", "US", "ES", "CL", "AR", "KR", "CR"]);

export function getOfficialNioliBrand(): NioliBrandAssets {
  return OFFICIAL_NIOLI_BRAND;
}

export function getCountryNioliBrand(countryCode?: string | null): NioliBrandAssets {
  const normalized = countryCode?.trim().toUpperCase() ?? "";
  if (!COUNTRY_BRAND_CODES.has(normalized)) return OFFICIAL_NIOLI_BRAND;
  return {
    logoHorizontal: `/brand/countries/${normalized}/nioli-logo-horizontal-transparent-v2.png`,
    seal: `/brand/countries/${normalized}/nioli-seal-transparent-v2.png`,
  };
}

