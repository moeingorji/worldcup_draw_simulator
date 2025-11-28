import { Confederation, Team } from "../draw";

// ISO country codes for each known team id.
const TEAM_ISO_MAP: Record<string, string> = {
  usa: "us",
  mexico: "mx",
  canada: "ca",
  spain: "es",
  argentina: "ar",
  france: "fr",
  england: "gb-eng",
  brazil: "br",
  portugal: "pt",
  netherlands: "nl",
  belgium: "be",
  germany: "de",
  croatia: "hr",
  morocco: "ma",
  colombia: "co",
  uruguay: "uy",
  switzerland: "ch",
  japan: "jp",
  senegal: "sn",
  iran: "ir",
  "south-korea": "kr",
  ecuador: "ec",
  austria: "at",
  australia: "au",
  norway: "no",
  panama: "pa",
  egypt: "eg",
  algeria: "dz",
  scotland: "gb-sct",
  paraguay: "py",
  tunisia: "tn",
  "ivory-coast": "ci",
  uzbekistan: "uz",
  qatar: "qa",
  "saudi-arabia": "sa",
  "south-africa": "za",
  jordan: "jo",
  "cape-verde": "cv",
  ghana: "gh",
  curacao: "cw",
  haiti: "ht",
  "new-zealand": "nz",
};

// UEFA playoff paths: four distinct team flags each.
const UEFA_PATH_FLAGS: Record<string, string[]> = {
  "uefa-path-a": ["it", "gb-wls", "ba", "gb-nir"], // Italy, Wales, Bosnia, Northern Ireland
  "uefa-path-b": ["ua", "pl", "al", "se"], // Ukraine, Poland, Albania, Sweden
  "uefa-path-c": ["tr", "sk", "xk", "ro"], // Turkey, Slovakia, Kosovo, Romania
  "uefa-path-d": ["dk", "cz", "ie", "mk"], // Denmark, Czech Republic, Ireland, North Macedonia
};

// Intercontinental playoff pathways: three candidate flags each.
const IC_PATH_FLAGS: Record<string, string[]> = {
  "ic-path-1": ["cd", "jm", "nc"], // DR Congo, Jamaica, New Caledonia
  "ic-path-2": ["iq", "bo", "sr"], // Iraq, Bolivia, Suriname
};

const CONFED_ISO: Record<Confederation, string> = {
  UEFA: "eu",
  CONMEBOL: "conmebol",
  CONCACAF: "concacaf",
  CAF: "caf",
  AFC: "afc",
  OFC: "ofc",
};

/**
 * Returns one or more flag URLs for a team. UEFA playoff paths yield four separate flags.
 */
export const getFlagSources = (team: Team): string[] => {
  const id = team.id.toLowerCase();
  const pathFlags = UEFA_PATH_FLAGS[id];
  if (pathFlags) {
    return pathFlags.map((code) => `https://flagcdn.com/w40/${code}.png`);
  }

  const icFlags = IC_PATH_FLAGS[id];
  if (icFlags) {
    return icFlags.map((code) => `https://flagcdn.com/w40/${code}.png`);
  }

  const iso = TEAM_ISO_MAP[id];
  if (iso) {
    if (iso === "fifa") return ["/flags/fifa.svg"];
    if (iso === "uefa") return ["/flags/UEFA.svg"];
    return [`https://flagcdn.com/w40/${iso}.png`];
  }

  if (team.confed) {
    return [`/flags/${CONFED_ISO[team.confed]}.svg`];
  }

  return ["/flags/placeholder.svg"];
};
