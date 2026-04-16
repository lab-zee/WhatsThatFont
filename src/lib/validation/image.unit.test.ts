import { describe, it, expect } from "vitest";
import { detectImageMime, MAX_IMAGE_BYTES, SUPPORTED_MIME_TYPES } from "./image";
import { tinyJpeg } from "@/test/fixtures/images";

const pngMagic = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const webpMagic = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

const pdfMagic = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x00, 0x00, 0x00, 0x00,
]);

const plainText = new TextEncoder().encode("this is just text, not an image of any sort");

describe("detectImageMime", () => {
  it("recognizes JPEG magic bytes", () => {
    expect(detectImageMime(tinyJpeg)).toBe("image/jpeg");
  });

  it("recognizes PNG magic bytes", () => {
    expect(detectImageMime(pngMagic)).toBe("image/png");
  });

  it("recognizes WebP magic bytes (RIFF...WEBP)", () => {
    expect(detectImageMime(webpMagic)).toBe("image/webp");
  });

  it("rejects PDF magic bytes (wrong MIME)", () => {
    expect(detectImageMime(pdfMagic)).toBeNull();
  });

  it("rejects plain text", () => {
    expect(detectImageMime(plainText)).toBeNull();
  });

  it("rejects a buffer that is too short to hold magic bytes", () => {
    expect(detectImageMime(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });

  it("rejects an empty buffer", () => {
    expect(detectImageMime(new Uint8Array())).toBeNull();
  });
});

describe("constants", () => {
  it("caps images at 10 MB", () => {
    expect(MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024);
  });

  it("allows exactly JPG, PNG, WebP", () => {
    expect([...SUPPORTED_MIME_TYPES]).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });
});
