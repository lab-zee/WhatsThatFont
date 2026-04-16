"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { MAX_IMAGE_BYTES, SUPPORTED_MIME_TYPES } from "@/lib/validation/image";

const ACCEPT = SUPPORTED_MIME_TYPES.join(",");

export type DropZoneProps = {
  onFileSelected: (file: File) => void;
  onError: (message: string) => void;
};

export function DropZone({ onFileSelected, onError }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      onError(
        `That image is ${Math.round(file.size / 1024 / 1024)} MB — max is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`,
      );
      return;
    }
    if (!SUPPORTED_MIME_TYPES.includes(file.type as (typeof SUPPORTED_MIME_TYPES)[number])) {
      onError(`Only ${SUPPORTED_MIME_TYPES.join(", ")} images are supported.`);
      return;
    }
    onFileSelected(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  return (
    <label
      htmlFor="wtf-image-input"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-testid="dropzone"
      className={`group relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed px-8 py-20 text-center transition-all duration-200 ${
        isDragging
          ? "scale-[1.01] border-neutral-900 bg-neutral-100 shadow-lg"
          : "border-neutral-300 bg-white/70 backdrop-blur hover:border-neutral-500 hover:shadow-md"
      }`}
    >
      <div className="wtf-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <input
        ref={inputRef}
        id="wtf-image-input"
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleChange}
        aria-label="Upload a reference image"
      />
      <div
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl"
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="relative z-10 flex flex-col gap-1">
        <div className="text-lg font-semibold text-neutral-900">
          Drop an image, or click to choose one
        </div>
        <div className="text-sm text-neutral-500">
          JPG, PNG, WebP · up to {MAX_IMAGE_BYTES / 1024 / 1024} MB · processed in-memory, never
          stored
        </div>
      </div>
    </label>
  );
}
