"use client";

import { useState } from "react";
import type { IdentifyCandidate, IdentifyRegion } from "@/lib/api/identify-types";
import { Button } from "./ui/Button";
import { ConfidenceBadge, Badge } from "./ui/Badge";

export function RegionCard({ region }: { region: IdentifyRegion }) {
  const [expanded, setExpanded] = useState(false);
  const [top, ...rest] = region.candidates;
  if (!top) return null;

  return (
    <article
      aria-labelledby={`${region.id}-title`}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <header className="flex items-start justify-between gap-3 border-b border-neutral-100 bg-neutral-50/60 px-5 py-3">
        <div className="min-w-0">
          <h3
            id={`${region.id}-title`}
            className="text-[11px] font-semibold tracking-widest text-neutral-500 uppercase"
          >
            {region.description}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-neutral-700">
            <span className="text-neutral-400">&ldquo;</span>
            {region.sampleText}
            <span className="text-neutral-400">&rdquo;</span>
          </p>
        </div>
      </header>

      <div className="px-5 py-4">
        <CandidateRow candidate={top} isTop />

        {rest.length > 0 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 w-full justify-center text-neutral-500"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls={`${region.id}-alternates`}
            >
              {expanded
                ? "Hide alternates"
                : `Show ${rest.length} more candidate${rest.length > 1 ? "s" : ""}`}
            </Button>
            {expanded && (
              <div
                id={`${region.id}-alternates`}
                className="mt-3 space-y-3 border-t border-neutral-100 pt-3"
              >
                {rest.map((c) => (
                  <CandidateRow key={c.name} candidate={c} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function CandidateRow({
  candidate,
  isTop = false,
}: {
  candidate: IdentifyCandidate;
  isTop?: boolean;
}) {
  const google = candidate.sources.googleFont;

  return (
    <div className={isTop ? "" : "rounded-lg bg-neutral-50 px-3 py-3"}>
      {/* Load the Google Font stylesheet inline so we can render the candidate name
          in its own typeface. React 19 hoists <link> tags into <head> automatically. */}
      {google && <link rel="stylesheet" href={google.embedUrl} />}

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h4
          className={
            isTop
              ? "text-3xl font-semibold tracking-tight text-neutral-900"
              : "text-xl font-medium text-neutral-900"
          }
          style={google ? { fontFamily: google.cssFamily } : undefined}
        >
          {candidate.name}
        </h4>
        <ConfidenceBadge level={candidate.confidence} />
        {candidate.verified ? (
          <Badge tone="info">Verified</Badge>
        ) : (
          <Badge tone="warn">Unverified match</Badge>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{candidate.rationale}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <UseOnWeb google={google} />
        <DesktopDownloads candidate={candidate} />
      </div>
    </div>
  );
}

function UseOnWeb({ google }: { google: IdentifyCandidate["sources"]["googleFont"] }) {
  if (!google) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        aria-label="Use on web — not available (no Google Fonts match)"
        title="No Google Fonts match"
      >
        Use on web
      </Button>
    );
  }

  return (
    <a
      href={google.embedUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      Use on web
    </a>
  );
}

function DesktopDownloads({ candidate }: { candidate: IdentifyCandidate }) {
  const link = candidate.sources.desktopDownloads[0];
  if (!link) return null;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {link.label}
    </a>
  );
}
