/**
 * Zone resolution for Bizim Kargo.
 *
 * Maps free-text location input (a UK postcode or a Turkish il/ilçe string)
 * onto the fixed ZoneCode set used by carrier tariffs. Pure functions, no I/O.
 */

import type { CountryCode, ZoneCode } from "./types";

// ---------------------------------------------------------------------------
// Zone metadata (for coverage UIs and price-line notes)
// ---------------------------------------------------------------------------

/** Human-readable names for every zone, in British English. */
export const ZONE_LABELS: Record<ZoneCode, string> = {
  "GB-MAINLAND": "UK Mainland",
  "GB-HIGHLANDS": "Scottish Highlands",
  "GB-NI": "Northern Ireland",
  "GB-ISLANDS": "UK Islands & Isle of Man",
  "TR-MARMARA": "Marmara (incl. İstanbul)",
  "TR-ANKARA": "Ankara",
  "TR-AEGEAN": "Aegean",
  "TR-MED": "Mediterranean",
  "TR-CENTRAL": "Central Anatolia",
  "TR-BLACKSEA": "Black Sea",
  "TR-EAST": "Eastern & Southeastern Anatolia",
};

/** All UK zones, in display order — for building carrier coverage UIs. */
export const UK_ZONES: readonly ZoneCode[] = [
  "GB-MAINLAND",
  "GB-HIGHLANDS",
  "GB-NI",
  "GB-ISLANDS",
];

/** All Turkish zones, in display order — for building carrier coverage UIs. */
export const TR_ZONES: readonly ZoneCode[] = [
  "TR-MARMARA",
  "TR-ANKARA",
  "TR-AEGEAN",
  "TR-MED",
  "TR-CENTRAL",
  "TR-BLACKSEA",
  "TR-EAST",
];

// ---------------------------------------------------------------------------
// United Kingdom — outward postcode area → zone
// ---------------------------------------------------------------------------

/** Postcode areas that map to a non-mainland zone. Everything else is mainland. */
const UK_AREA_ZONES: Record<string, ZoneCode> = {
  // Northern Ireland
  BT: "GB-NI",
  // Offshore islands: Isle of Man, Guernsey, Jersey, Outer Hebrides, Shetland
  IM: "GB-ISLANDS",
  GY: "GB-ISLANDS",
  JE: "GB-ISLANDS",
  HS: "GB-ISLANDS",
  ZE: "GB-ISLANDS",
  // Scottish Highlands (Inverness, Kirkwall/Wick, Perth-shire glens)
  IV: "GB-HIGHLANDS",
  KW: "GB-HIGHLANDS",
  PH: "GB-HIGHLANDS",
};

function resolveUkZone(postcode: string): ZoneCode {
  // Case and whitespace tolerant: "bt7 1nn", " Iv2-3aa " and "BT71NN" all work.
  const cleaned = postcode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // The postcode area is the leading 1–2 letters of the outward code,
  // which must be followed by a digit to look like a real postcode.
  const match = /^([A-Z]{1,2})[0-9]/.exec(cleaned);
  if (!match) {
    // Not postcode-shaped (e.g. the user typed "London") — assume mainland,
    // which is the correct answer for the overwhelming majority of addresses.
    return "GB-MAINLAND";
  }
  return UK_AREA_ZONES[match[1]] ?? "GB-MAINLAND";
}

// ---------------------------------------------------------------------------
// Turkey — il (province) name → zone, all 81 provinces
// ---------------------------------------------------------------------------

/** Every Turkish province, grouped by the tariff zone it belongs to. */
const TR_PROVINCES_BY_ZONE: Record<string, readonly string[]> = {
  "TR-MARMARA": [
    "İstanbul", "Bursa", "Kocaeli", "Sakarya", "Tekirdağ", "Balıkesir",
    "Çanakkale", "Edirne", "Kırklareli", "Yalova", "Bilecik",
  ],
  "TR-ANKARA": ["Ankara"],
  "TR-AEGEAN": [
    "İzmir", "Aydın", "Muğla", "Manisa", "Denizli", "Uşak", "Kütahya",
    "Afyonkarahisar",
  ],
  "TR-MED": [
    "Antalya", "Mersin", "Adana", "Hatay", "Osmaniye", "Kahramanmaraş",
    "Isparta", "Burdur",
  ],
  "TR-CENTRAL": [
    "Eskişehir", "Konya", "Karaman", "Aksaray", "Niğde", "Nevşehir",
    "Kırşehir", "Kırıkkale", "Çankırı", "Yozgat", "Sivas", "Kayseri",
  ],
  "TR-BLACKSEA": [
    "Bolu", "Düzce", "Zonguldak", "Karabük", "Bartın", "Kastamonu", "Sinop",
    "Çorum", "Samsun", "Amasya", "Tokat", "Ordu", "Giresun", "Trabzon",
    "Rize", "Artvin", "Gümüşhane", "Bayburt",
  ],
  "TR-EAST": [
    // Eastern Anatolia
    "Erzurum", "Erzincan", "Kars", "Ağrı", "Iğdır", "Ardahan", "Malatya",
    "Elazığ", "Bingöl", "Tunceli", "Van", "Muş", "Bitlis", "Hakkâri",
    // Southeastern Anatolia
    "Gaziantep", "Kilis", "Şanlıurfa", "Adıyaman", "Diyarbakır", "Mardin",
    "Batman", "Şırnak", "Siirt",
  ],
};

/** Common colloquial/short spellings that should still resolve. */
const TR_ALIASES: Record<string, string> = {
  afyon: "Afyonkarahisar",
  urfa: "Şanlıurfa",
  antep: "Gaziantep",
  maras: "Kahramanmaraş",
  kmaras: "Kahramanmaraş",
  icel: "Mersin", // Mersin's pre-2002 province name (İçel)
};

/**
 * Fold Turkish text to plain lower-case ASCII so that İstanbul / Istanbul /
 * istanbul / ISTANBUL all compare equal.
 *
 * Subtlety: JavaScript's toLowerCase() turns "İ" into "i" + a combining dot
 * (U+0307), and Turkish upper-case "I" corresponds to dotless "ı" — so both
 * capital I forms are mapped to plain "i" *before* lower-casing, then any
 * remaining diacritics are stripped via NFD decomposition.
 */
function foldTurkish(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining marks (ş→s, ğ→g, â→a…)
    .replace(/[^a-z]/g, ""); // drop spaces, dots and any leftover punctuation
}

/** Folded province/alias name → zone lookup, built once at module load. */
const TR_LOOKUP: Map<string, ZoneCode> = (() => {
  const lookup = new Map<string, ZoneCode>();
  for (const [zone, provinces] of Object.entries(TR_PROVINCES_BY_ZONE)) {
    for (const province of provinces) {
      lookup.set(foldTurkish(province), zone as ZoneCode);
    }
  }
  for (const [alias, province] of Object.entries(TR_ALIASES)) {
    const zone = lookup.get(foldTurkish(province));
    if (zone) lookup.set(alias, zone);
  }
  return lookup;
})();

function resolveTrZone(cityText: string): ZoneCode {
  // Input is typically "İstanbul / Kadıköy" — the il comes first, so we try
  // separator-delimited segments in order, then fall back to individual words
  // (covers "Kadıköy, İstanbul" and "izmir bornova" style input too).
  const segments = cityText.split(/[/,;|–—-]+/);
  const words = cityText.split(/\s+/);
  for (const candidate of [...segments, ...words]) {
    const folded = foldTurkish(candidate);
    if (!folded) continue;
    const zone = TR_LOOKUP.get(folded);
    if (zone) return zone;
  }
  // Unrecognised input: Central Anatolia is the geographically middling
  // fallback, so surcharges err on the side of a typical inland delivery.
  return "TR-CENTRAL";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a customer-entered location to a tariff zone.
 *
 * @param country        which country's rules to apply
 * @param postcodeOrCity UK postcode ("SW1A 1AA", "bt71nn") or Turkish il/ilçe
 *                       text ("İstanbul / Kadıköy", "IZMIR")
 */
export function resolveZone(country: CountryCode, postcodeOrCity: string): ZoneCode {
  return country === "GB" ? resolveUkZone(postcodeOrCity) : resolveTrZone(postcodeOrCity);
}
