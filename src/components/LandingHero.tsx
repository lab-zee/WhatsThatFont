export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="flex flex-col items-center gap-5 text-center"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/60 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Open source · powered by Claude Opus 4.6 vision
      </span>
      <h1
        id="hero-heading"
        className="text-5xl leading-[1.05] font-semibold tracking-tight text-neutral-900 sm:text-6xl"
      >
        What&apos;s <span className="font-serif-display text-neutral-700 italic">that</span> font?
      </h1>
      <p className="max-w-xl text-lg text-balance text-neutral-600">
        Drop a reference image. We&apos;ll identify every typeface, region by region, with
        confidence scores, visual rationale, and links to install or embed them.
      </p>
    </section>
  );
}
