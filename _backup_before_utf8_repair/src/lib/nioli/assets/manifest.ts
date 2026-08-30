import type {
  BradyAssetSet,
  BradyIndividualAssetGroups,
  CountryAssetPack,
  NioliAssetCollection,
  NioliAssetPath,
  NioliCountryCode,
  PassportAssetSet,
  PatternAssetSet,
} from "@/lib/nioli/assets/types";

export const bradyIndividualAssets = {
  base: {
    backpack: "/nioli/brady/base/brady-backpack.png",
    neutral: "/nioli/brady/base/brady-neutral.png",
    resting: "/nioli/brady/base/brady-resting.png",
    standing: "/nioli/brady/base/brady-standing.png",
  },
  actions: {
    camera: "/nioli/brady/actions/brady-camera.png",
    cameraReview: "/nioli/brady/actions/brady-camera-review.png",
    celebrate: "/nioli/brady/actions/brady-celebrate.png",
    exploring: "/nioli/brady/actions/brady-exploring.png",
    mapConfused: "/nioli/brady/actions/brady-map-confused.png",
    passport: "/nioli/brady/actions/brady-passport.png",
    passportCelebrate: "/nioli/brady/actions/brady-passport-celebrate.png",
    pointing: "/nioli/brady/actions/brady-pointing.png",
  },
  states: {
    offline: "/nioli/brady/states/brady-offline.png",
    sleepyAlt: "/nioli/brady/states/brady-sleepy-alt.png",
  },
} as const satisfies BradyIndividualAssetGroups;

const emptyCollection = (assetRoot: NioliAssetPath): NioliAssetCollection => ({
  assetRoot,
  primary: null,
  items: [],
});

const emptyPassport = (assetRoot: NioliAssetPath): PassportAssetSet => ({
  assetRoot,
  cover: null,
  inside: null,
  back: null,
});

const emptyPatterns = (assetRoot: NioliAssetPath): PatternAssetSet => ({
  assetRoot,
  primary: null,
  secondary: null,
  items: [],
});

const assetAt = (assetRoot: NioliAssetPath, filename: string): NioliAssetPath =>
  `${assetRoot}/${filename}` as NioliAssetPath;

const createCountryAssetPack = (
  countryCode: NioliCountryCode,
  slug: Lowercase<NioliCountryCode>,
  stampFilenames: readonly string[],
): CountryAssetPack => {
  const assetRoot = `/nioli/countries/${slug}` as NioliAssetPath;
  const passportRoot = `${assetRoot}/passport` as NioliAssetPath;
  const stampsRoot = `${assetRoot}/stamps` as NioliAssetPath;
  const ticketsRoot = `${assetRoot}/tickets` as NioliAssetPath;
  const badgesRoot = `${assetRoot}/badges` as NioliAssetPath;
  const patternsRoot = `${assetRoot}/patterns` as NioliAssetPath;
  const decorationsRoot = `${assetRoot}/decorations` as NioliAssetPath;
  const bradyRoot = `${assetRoot}/brady` as NioliAssetPath;

  return {
    countryCode,
    assetRoot,
    passport: {
      assetRoot: passportRoot,
      cover: assetAt(passportRoot, "passport-cover.webp"),
      inside: null,
      back: null,
    },
    stamps: {
      assetRoot: stampsRoot,
      primary: null,
      items: stampFilenames.map((filename) => assetAt(stampsRoot, filename)),
    },
    tickets: {
      assetRoot: ticketsRoot,
      primary: assetAt(ticketsRoot, "ticket-primary.webp"),
      items: [assetAt(ticketsRoot, "ticket-secondary.webp")],
    },
    badges: {
      assetRoot: badgesRoot,
      primary: assetAt(badgesRoot, "badge-primary.webp"),
      items: [assetAt(badgesRoot, "badge-secondary.webp")],
    },
    patterns: {
      assetRoot: patternsRoot,
      primary: assetAt(patternsRoot, "pattern-primary.webp"),
      secondary: null,
      items: [],
    },
    decorations: {
      assetRoot: decorationsRoot,
      primary: assetAt(decorationsRoot, "decorations.webp"),
      items: [],
    },
    brady: {
      assetRoot: bradyRoot,
      primary: assetAt(bradyRoot, `brady-${slug}.webp`),
      items: [],
    },
    luggageTag: assetAt(decorationsRoot, "luggage-tag.webp"),
    boardingPass: assetAt(ticketsRoot, "boarding-pass.webp"),
    countryCodeLabel: assetAt(badgesRoot, "country-code-label.webp"),
    bonusAssets: {
      assetRoot: decorationsRoot,
      primary: assetAt(decorationsRoot, "bonus-assets.webp"),
      items: [],
    },
    cities: {},
  };
};

export const bradyAssets: BradyAssetSet = {
  assetRoot: "/nioli/brady",
  individual: bradyIndividualAssets,
  base: {
    neutral: bradyIndividualAssets.base.neutral,
    standing: bradyIndividualAssets.base.standing,
    resting: bradyIndividualAssets.base.resting,
    backpack: bradyIndividualAssets.base.backpack,
  },
  heads: { neutral: null },
  expressions: {
    neutral: bradyIndividualAssets.base.neutral,
    happy: null,
    curious: null,
    sleepy: bradyIndividualAssets.states.sleepyAlt,
    excited: null,
    proud: null,
    worried: null,
    confused: null,
  },
  actions: {
    camera: bradyIndividualAssets.actions.camera,
    map: bradyIndividualAssets.actions.mapConfused,
    pointing: bradyIndividualAssets.actions.pointing,
    passport: bradyIndividualAssets.actions.passport,
    celebrate: bradyIndividualAssets.actions.celebrate,
    exploring: bradyIndividualAssets.actions.exploring,
    planning: null,
    resting: bradyIndividualAssets.base.resting,
  },
  states: {
    offline: bradyIndividualAssets.states.offline,
    loading: null,
    syncing: null,
    emptyTrip: null,
    newStamp: null,
    tripComplete: null,
  },
  mini: {
    neutral: null,
    avatar128: null,
    avatar256: null,
  },
};

export const countryAssetPacks: Readonly<Record<NioliCountryCode, CountryAssetPack>> = {
  JP: createCountryAssetPack("JP", "jp", [
    "stamp-kyoto.webp",
    "stamp-nara.webp",
    "stamp-osaka.webp",
    "stamp-ramen.webp",
    "stamp-sakura-season.webp",
    "stamp-shinkansen.webp",
    "stamp-temple.webp",
    "stamp-tokyo.webp",
  ]),
  MX: createCountryAssetPack("MX", "mx", [
    "stamp-cdmx.webp",
    "stamp-cempasuchil.webp",
    "stamp-cenotes.webp",
    "stamp-desierto.webp",
    "stamp-oaxaca.webp",
    "stamp-puebla.webp",
    "stamp-tacos.webp",
    "stamp-talavera.webp",
  ]),
  CO: createCountryAssetPack("CO", "co", [
    "stamp-bogota.webp",
    "stamp-cafe.webp",
    "stamp-cali.webp",
    "stamp-cartagena.webp",
    "stamp-guatape.webp",
    "stamp-medellin.webp",
    "stamp-salento.webp",
    "stamp-tayrona.webp",
  ]),
  US: createCountryAssetPack("US", "us", [
    "stamp-california.webp",
    "stamp-chicago.webp",
    "stamp-diner.webp",
    "stamp-grand-canyon.webp",
    "stamp-national-parks.webp",
    "stamp-new-york.webp",
    "stamp-route-66.webp",
    "stamp-yellowstone.webp",
  ]),
  ES: createCountryAssetPack("ES", "es", [
    "stamp-barcelona.webp",
    "stamp-bilbao.webp",
    "stamp-camino.webp",
    "stamp-granada.webp",
    "stamp-madrid.webp",
    "stamp-sevilla.webp",
    "stamp-tapas.webp",
    "stamp-valencia.webp",
  ]),
  CL: createCountryAssetPack("CL", "cl", [
    "stamp-atacama.webp",
    "stamp-costa-chilena.webp",
    "stamp-los-andes.webp",
    "stamp-observatorio.webp",
    "stamp-patagonia.webp",
    "stamp-santiago.webp",
    "stamp-torres-del-paine.webp",
    "stamp-valparaiso.webp",
  ]),
  AR: createCountryAssetPack("AR", "ar", [
    "stamp-bariloche.webp",
    "stamp-buenos-aires.webp",
    "stamp-cordoba.webp",
    "stamp-iguazu.webp",
    "stamp-mate.webp",
    "stamp-mendoza.webp",
    "stamp-patagonia.webp",
    "stamp-tren-a-las-nubes.webp",
  ]),
  KR: createCountryAssetPack("KR", "kr", [
    "stamp-bibimbap.webp",
    "stamp-bonus-stamp.webp",
    "stamp-busan.webp",
    "stamp-gyeongju.webp",
    "stamp-hanok.webp",
    "stamp-ktx.webp",
    "stamp-night-city.webp",
    "stamp-seoul.webp",
  ]),
  CR: createCountryAssetPack("CR", "cr", [
    "stamp-adventure.webp",
    "stamp-beaches.webp",
    "stamp-coffee.webp",
    "stamp-pura-vida.webp",
    "stamp-rainforest.webp",
    "stamp-volcanos.webp",
    "stamp-waterfalls.webp",
    "stamp-wildlife.webp",
  ]),
};

export const genericCountryAssetPack: CountryAssetPack = {
  countryCode: "INTERNATIONAL",
  assetRoot: "/nioli",
  passport: emptyPassport("/nioli/passport/generic"),
  stamps: emptyCollection("/nioli/stamps/generic"),
  tickets: emptyCollection("/nioli/tickets/generic"),
  badges: emptyCollection("/nioli"),
  patterns: emptyPatterns("/nioli"),
  decorations: emptyCollection("/nioli"),
  brady: emptyCollection("/nioli/brady"),
  luggageTag: null,
  boardingPass: null,
  countryCodeLabel: null,
  bonusAssets: emptyCollection("/nioli"),
  cities: {},
};

export const nioliAssets = {
  brand: {
    name: "NIOLI",
    technicalProjectName: "TravelOS",
    mascotName: "BRADY",
    assetRoot: "/nioli/brand",
    logos: [] as readonly NioliAssetPath[],
    marks: [] as readonly NioliAssetPath[],
    icons: [] as readonly NioliAssetPath[],
  },
  brady: bradyAssets,
  countries: {
    jp: countryAssetPacks.JP,
    mx: countryAssetPacks.MX,
    co: countryAssetPacks.CO,
    us: countryAssetPacks.US,
    es: countryAssetPacks.ES,
    cl: countryAssetPacks.CL,
    ar: countryAssetPacks.AR,
    kr: countryAssetPacks.KR,
    cr: countryAssetPacks.CR,
  },
  generic: genericCountryAssetPack,
} as const;
