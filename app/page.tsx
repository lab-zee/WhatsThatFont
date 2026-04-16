import { LandingHero } from "@/components/LandingHero";
import { UploadFlow } from "@/components/UploadFlow";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-16 sm:py-24">
      <div className="mb-12">
        <LandingHero />
      </div>
      <UploadFlow />
      <footer className="mt-20 flex flex-col items-center gap-2 text-center text-xs text-neutral-500">
        <div>Open source. Images are processed in-memory and never stored.</div>
        <a
          href="https://github.com/davidinwald/WhatsThatFont"
          target="_blank"
          rel="noreferrer noopener"
          className="underline hover:text-neutral-700"
        >
          View on GitHub →
        </a>
      </footer>
    </main>
  );
}
