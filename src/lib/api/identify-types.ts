export type ConfidenceLevel = "high" | "medium" | "low";

export type GoogleFontSource = {
  family: string;
  embedUrl: string;
  cssFamily: string;
};

export type DesktopDownload = {
  label: string;
  url: string;
  license:
    | "ofl"
    | "proprietary"
    | "bundled-macos"
    | "bundled-windows"
    | "bundled-adobe-fonts"
    | "search";
};

export type IdentifyCandidate = {
  name: string;
  confidence: ConfidenceLevel;
  rationale: string;
  alternateFor: string | null;
  verified: boolean;
  sources: {
    googleFont: GoogleFontSource | null;
    desktopDownloads: DesktopDownload[];
  };
};

export type IdentifyRegion = {
  id: string;
  description: string;
  sampleText: string;
  bbox: { x: number; y: number; w: number; h: number };
  candidates: IdentifyCandidate[];
};

export type IdentifyResponse = {
  regions: IdentifyRegion[];
  overallNotes: string | null;
  meta: { modelId: string; latencyMs: number; requestId: string };
};

export type IdentifyApiError = {
  error: {
    code:
      | "invalid_image"
      | "image_too_large"
      | "unsupported_media"
      | "rate_limited"
      | "model_error"
      | "model_timeout";
    message: string;
  };
};
