export function LandingHero() {
  return (
    <section aria-labelledby="hero-heading" className="flex flex-col items-center gap-6">
      <h1 id="hero-heading" className="text-5xl font-semibold tracking-tight">
        What&apos;s that font?
      </h1>
      <p className="max-w-xl text-lg text-balance text-neutral-600">
        Drop a reference image. We&apos;ll identify the fonts used — with confidence scores, visual
        rationale, and direct links to install or embed them.
      </p>
      <p className="text-sm text-neutral-500">Upload coming online in M1. The scaffold is alive.</p>
    </section>
  );
}
