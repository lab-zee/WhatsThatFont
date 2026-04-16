import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsThatFont — Identify the fonts in any image",
  description:
    "Upload a reference image. Get the fonts used, with confidence scores and direct download links. Open source.",
  metadataBase: new URL("https://whatsthatfont.com"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
