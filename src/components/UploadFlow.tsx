"use client";

import { useCallback, useEffect, useState } from "react";
import { DropZone } from "./DropZone";
import { RegionCard } from "./RegionCard";
import { Button } from "./ui/Button";
import { postIdentify } from "@/lib/api/identify-client";
import type { IdentifyResponse } from "@/lib/api/identify-types";

type FlowState =
  | { kind: "idle" }
  | { kind: "preview"; file: File; previewUrl: string; hint: string }
  | { kind: "analyzing"; file: File; previewUrl: string; hint: string }
  | { kind: "results"; file: File; previewUrl: string; data: IdentifyResponse }
  | {
      kind: "error";
      message: string;
      retryAfter?: number;
      file?: File;
      previewUrl?: string;
      hint?: string;
    };

export function UploadFlow() {
  const [state, setState] = useState<FlowState>({ kind: "idle" });

  // Revoke object URLs when they go out of use to avoid leaking memory.
  useEffect(() => {
    const url =
      state.kind === "preview" || state.kind === "analyzing" || state.kind === "results"
        ? state.previewUrl
        : state.kind === "error"
          ? state.previewUrl
          : undefined;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [state]);

  const handleFileSelected = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setState({ kind: "preview", file, previewUrl, hint: "" });
  }, []);

  const handleDropError = useCallback((message: string) => {
    setState({ kind: "error", message });
  }, []);

  async function identify() {
    if (state.kind !== "preview") return;
    const { file, previewUrl, hint } = state;
    setState({ kind: "analyzing", file, previewUrl, hint });

    const result = await postIdentify(file, { hint: hint || undefined });
    if (result.ok) {
      setState({ kind: "results", file, previewUrl, data: result.data });
    } else {
      const message = renderErrorMessage(
        result.error.code,
        result.error.message,
        result.retryAfter,
      );
      setState({
        kind: "error",
        message,
        file,
        previewUrl,
        hint,
        ...(result.retryAfter !== undefined ? { retryAfter: result.retryAfter } : {}),
      });
    }
  }

  function reset() {
    setState({ kind: "idle" });
  }

  function tryAgainFromError() {
    if (state.kind !== "error" || !state.file || !state.previewUrl) {
      reset();
      return;
    }
    setState({
      kind: "preview",
      file: state.file,
      previewUrl: state.previewUrl,
      hint: state.hint ?? "",
    });
  }

  if (state.kind === "idle") {
    return (
      <div className="w-full">
        <DropZone onFileSelected={handleFileSelected} onError={handleDropError} />
      </div>
    );
  }

  if (state.kind === "preview" || state.kind === "analyzing") {
    const analyzing = state.kind === "analyzing";
    return (
      <div className="flex w-full flex-col gap-6">
        <PreviewImage src={state.previewUrl} analyzing={analyzing} />
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <label htmlFor="wtf-hint" className="text-sm font-medium text-neutral-700">
            Focus hint <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="wtf-hint"
            type="text"
            maxLength={200}
            disabled={analyzing}
            value={state.hint}
            onChange={(e) => setState({ ...state, kind: "preview", hint: e.target.value })}
            placeholder="e.g. focus on the headline, ignore the caption…"
            className="h-10 rounded-md border border-neutral-300 px-3 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:outline-none"
          />
          <div className="mt-1 flex flex-wrap gap-3">
            <Button size="lg" onClick={identify} disabled={analyzing} aria-live="polite">
              {analyzing ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  Analyzing…
                </>
              ) : (
                "Identify fonts"
              )}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={analyzing}>
              Choose a different image
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "results") {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <PreviewImage src={state.previewUrl} />
          <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={reset}>
              New image
            </Button>
            <p className="text-xs text-neutral-500" aria-live="polite">
              Took {Math.round(state.data.meta.latencyMs / 100) / 10}s · {state.data.meta.modelId}
            </p>
          </div>
        </div>
        {state.data.overallNotes && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            {state.data.overallNotes}
          </p>
        )}
        <section aria-label="Identified fonts" className="flex flex-col gap-4">
          {state.data.regions.map((r) => (
            <RegionCard key={r.id} region={r} />
          ))}
        </section>
      </div>
    );
  }

  // error
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        role="alert"
        className="w-full rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
      >
        {state.message}
      </div>
      <div className="flex gap-3">
        {state.file ? <Button onClick={tryAgainFromError}>Try again</Button> : null}
        <Button variant="secondary" onClick={reset}>
          Start over
        </Button>
      </div>
    </div>
  );
}

function PreviewImage({ src, analyzing = false }: { src: string; analyzing?: boolean }) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded blob URL; not eligible for next/image */}
      <img src={src} alt="Uploaded reference" className="max-h-[60vh] w-full object-contain" />
      {analyzing && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 shadow-lg">
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900"
            />
            Reading the image…
          </div>
        </div>
      )}
    </div>
  );
}

function renderErrorMessage(code: string, fallback: string, retryAfter?: number): string {
  switch (code) {
    case "invalid_image":
      return "That didn't look like an image we could read. Try a different file.";
    case "image_too_large":
      return "That image is too large. Try a version under 10 MB.";
    case "unsupported_media":
      return "Only JPG, PNG, and WebP are supported.";
    case "rate_limited":
      return retryAfter
        ? `You've hit the per-IP rate limit. Try again in ${retryAfter}s.`
        : "You've hit the rate limit. Try again soon.";
    case "model_error":
      return "Something went wrong talking to the model. Try again in a moment.";
    case "model_timeout":
      return "The model took too long to respond. Try a smaller or clearer image.";
    default:
      return fallback || "Something went wrong.";
  }
}
