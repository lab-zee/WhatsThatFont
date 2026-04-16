"use client";

import type { IdentifyRegion } from "@/lib/api/identify-types";

export type BboxOverlayProps = {
  regions: IdentifyRegion[];
  /** Optional: id of the region to highlight (e.g. on card hover). */
  activeRegionId?: string | undefined;
};

/**
 * Absolute-positioned rectangles drawn over the preview image.
 * Each bbox is in normalized [0, 1] coords relative to the original image,
 * so we render them as percentages. The parent element must be `relative`.
 */
export function BboxOverlay({ regions, activeRegionId }: BboxOverlayProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {regions.map((region) => {
        const active = region.id === activeRegionId;
        return (
          <div
            key={region.id}
            data-region-id={region.id}
            className={`absolute rounded-sm border-2 transition-all ${
              active
                ? "border-emerald-500 bg-emerald-500/20 shadow-lg"
                : "border-neutral-900/60 bg-neutral-900/5"
            }`}
            style={{
              left: `${region.bbox.x * 100}%`,
              top: `${region.bbox.y * 100}%`,
              width: `${region.bbox.w * 100}%`,
              height: `${region.bbox.h * 100}%`,
            }}
          />
        );
      })}
    </div>
  );
}
