import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "WhatsThatFont — Identify the fonts in any image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        width: "100%",
        height: "100%",
        padding: "64px",
        background: "#ffffff",
        fontFamily: "system-ui, -apple-system, Segoe UI, Helvetica",
      }}
    >
      <div style={{ fontSize: 84, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.02em" }}>
        What&apos;s that font?
      </div>
      <div style={{ marginTop: 24, fontSize: 32, color: "#525252", lineHeight: 1.3 }}>
        Drop an image. Get the fonts. Download them.
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 22,
          color: "#737373",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#0a0a0a",
            color: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, Times New Roman, serif",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          ?
        </div>
        whatsthatfont.com · open source
      </div>
    </div>,
    size,
  );
}
