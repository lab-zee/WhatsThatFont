import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WhatsThatFont — Identify the fonts in any image",
  description:
    "Upload a reference image. Get the fonts used, with confidence scores and direct download links. Open source.",
  metadataBase: new URL("https://whatsthatfont.com"),
  openGraph: {
    title: "WhatsThatFont — Identify the fonts in any image",
    description: "Drop an image. Get the fonts. Download them. Open source.",
    url: "https://whatsthatfont.com",
    siteName: "WhatsThatFont",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsThatFont",
    description: "Drop an image. Get the fonts. Download them.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-50 via-white to-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
