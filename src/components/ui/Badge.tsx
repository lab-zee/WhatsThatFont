import type { ReactNode } from "react";
import type { ConfidenceLevel } from "@/lib/api/identify-types";

const CONFIDENCE_CLASSES: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  medium: "bg-amber-100 text-amber-900 ring-amber-300",
  low: "bg-neutral-100 text-neutral-700 ring-neutral-300",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${CONFIDENCE_CLASSES[level]}`}
      aria-label={CONFIDENCE_LABEL[level]}
    >
      <span aria-hidden="true" className="text-[10px] tracking-wide uppercase">
        {level}
      </span>
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "warn";
}) {
  const toneClasses =
    tone === "info"
      ? "bg-sky-100 text-sky-900 ring-sky-300"
      : tone === "warn"
        ? "bg-amber-100 text-amber-900 ring-amber-300"
        : "bg-neutral-100 text-neutral-700 ring-neutral-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${toneClasses}`}
    >
      {children}
    </span>
  );
}
