import { findGoogleFont } from "./google";
import { findCuratedFont } from "./catalog";

export type FontLicense =
  | "ofl"
  | "proprietary"
  | "bundled-macos"
  | "bundled-windows"
  | "bundled-adobe-fonts"
  | "search";

export type DesktopDownload = {
  label: string;
  url: string;
  license: FontLicense;
};

export type GoogleFontSource = {
  family: string;
  embedUrl: string;
  cssFamily: string;
};

export type FontSources = {
  googleFont: GoogleFontSource | null;
  desktopDownloads: DesktopDownload[];
};

export type ResolveResult = {
  sources: FontSources;
  verified: boolean;
};

const LICENSE_LABELS: Record<Exclude<FontLicense, "search">, string> = {
  ofl: "Google Fonts (free, OFL)",
  proprietary: "Licensed from the foundry",
  "bundled-macos": "Bundled with macOS",
  "bundled-windows": "Bundled with Windows",
  "bundled-adobe-fonts": "Adobe Fonts",
};

export function resolveSources(name: string): ResolveResult {
  const google = findGoogleFont(name);
  const curated = findCuratedFont(name);

  const desktopDownloads: DesktopDownload[] = [];

  if (google) {
    desktopDownloads.push({
      label: "Google Fonts",
      url: `https://fonts.google.com/specimen/${encodeURIComponent(google.family.replace(/ /g, "+"))}`,
      license: "ofl",
    });
  }

  if (curated) {
    desktopDownloads.push({
      label: LICENSE_LABELS[curated.license],
      url: curated.sourceUrl,
      license: curated.license,
    });
  }

  if (desktopDownloads.length === 0) {
    const query = encodeURIComponent(name.trim());
    desktopDownloads.push({
      label: `Search MyFonts for "${name}"`,
      url: `https://www.myfonts.com/pages/search-results?query=${query}`,
      license: "search",
    });
  }

  return {
    sources: {
      googleFont: google,
      desktopDownloads,
    },
    verified: Boolean(google || curated),
  };
}
