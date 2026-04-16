#!/usr/bin/env tsx
/**
 * Accuracy eval runner. Invoked via `pnpm eval`.
 *
 * Reads eval/manifest.json + eval/images/*, calls identifyFonts for each case,
 * scores top-1 and top-3 per region, writes eval/reports/<ts>.json.
 *
 * This is NOT part of `pnpm run ci`. See eval/README.md.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";

// Load .env manually — tsx/node don't auto-load it like Next.js does.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = /^([^#=\s]+)\s*=\s*(.*)$/.exec(line.trim());
    if (m) process.env[m[1]!] ??= m[2]!;
  }
}
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { identifyFonts, type SupportedMimeType } from "@/lib/ai/client";
import { matchKey } from "@/lib/fonts/normalize";
import { detectImageMime } from "@/lib/validation/image";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const ManifestSchema = z.object({
  version: z.literal(1),
  cases: z.array(
    z.object({
      id: z.string().min(1),
      image: z.string().min(1),
      category: z.string().min(1),
      labels: z
        .array(
          z.object({
            region: z.string().min(1),
            expected: z.array(z.string().min(1)).min(1),
          }),
        )
        .min(1),
      source: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

type Manifest = z.infer<typeof ManifestSchema>;
type Case = Manifest["cases"][number];

type CaseReport = {
  id: string;
  category: string;
  regionCount: number;
  top1Hits: number;
  top3Hits: number;
  perRegion: Array<{
    region: string;
    top1: boolean;
    top3: boolean;
    predicted: string[];
    expected: string[];
  }>;
  errorMessage?: string;
};

type RunReport = {
  generatedAt: string;
  model: string;
  totals: {
    regions: number;
    top1Rate: number;
    top3Rate: number;
  };
  byCategory: Record<string, { regions: number; top1Rate: number; top3Rate: number }>;
  cases: CaseReport[];
};

type CliArgs = {
  caseId?: string;
  baseline?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--case") out.caseId = argv[++i];
    else if (arg === "--baseline") out.baseline = argv[++i];
  }
  return out;
}

async function loadManifest(): Promise<Manifest> {
  const raw = await readFile(resolve(repoRoot, "eval/manifest.json"), "utf8");
  return ManifestSchema.parse(JSON.parse(raw));
}

function isMatch(predicted: string, expected: string[]): boolean {
  const key = matchKey(predicted);
  return expected.some((e) => matchKey(e) === key);
}

function pickMime(path: string, bytes: Uint8Array): SupportedMimeType {
  const sniffed = detectImageMime(bytes);
  if (sniffed) return sniffed;
  const ext = extname(path).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  throw new Error(`Cannot determine MIME for ${path}`);
}

async function scoreCase(c: Case): Promise<CaseReport> {
  const imagePath = resolve(repoRoot, "eval/images", c.image);
  if (!existsSync(imagePath)) {
    return {
      id: c.id,
      category: c.category,
      regionCount: c.labels.length,
      top1Hits: 0,
      top3Hits: 0,
      perRegion: [],
      errorMessage: `Missing image file: eval/images/${c.image}`,
    };
  }

  const buf = await readFile(imagePath);
  const bytes = new Uint8Array(buf);
  const mime = pickMime(imagePath, bytes);

  let modelOut;
  try {
    modelOut = await identifyFonts({
      imageBytes: Buffer.from(bytes),
      mimeType: mime,
    });
  } catch (err) {
    return {
      id: c.id,
      category: c.category,
      regionCount: c.labels.length,
      top1Hits: 0,
      top3Hits: 0,
      perRegion: [],
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }

  const perRegion: CaseReport["perRegion"] = [];
  let top1Hits = 0;
  let top3Hits = 0;

  for (const label of c.labels) {
    const region =
      modelOut.result.regions.find((r) =>
        matchKey(r.description).includes(matchKey(label.region)),
      ) ?? modelOut.result.regions[0];
    const predicted = region ? region.candidates.slice(0, 3).map((c2) => c2.name) : [];
    const top1 = predicted[0] !== undefined ? isMatch(predicted[0], label.expected) : false;
    const top3 = predicted.some((p) => isMatch(p, label.expected));
    if (top1) top1Hits++;
    if (top3) top3Hits++;
    perRegion.push({ region: label.region, top1, top3, predicted, expected: label.expected });
  }

  return {
    id: c.id,
    category: c.category,
    regionCount: c.labels.length,
    top1Hits,
    top3Hits,
    perRegion,
  };
}

function aggregate(cases: CaseReport[], model: string): RunReport {
  let regions = 0;
  let top1 = 0;
  let top3 = 0;
  const buckets = new Map<string, { regions: number; top1: number; top3: number }>();
  for (const c of cases) {
    regions += c.regionCount;
    top1 += c.top1Hits;
    top3 += c.top3Hits;
    const bucket = buckets.get(c.category) ?? { regions: 0, top1: 0, top3: 0 };
    bucket.regions += c.regionCount;
    bucket.top1 += c.top1Hits;
    bucket.top3 += c.top3Hits;
    buckets.set(c.category, bucket);
  }
  const byCategory: RunReport["byCategory"] = {};
  for (const [k, v] of buckets) {
    byCategory[k] = {
      regions: v.regions,
      top1Rate: v.regions > 0 ? v.top1 / v.regions : 0,
      top3Rate: v.regions > 0 ? v.top3 / v.regions : 0,
    };
  }
  return {
    generatedAt: new Date().toISOString(),
    model,
    totals: {
      regions,
      top1Rate: regions > 0 ? top1 / regions : 0,
      top3Rate: regions > 0 ? top3 / regions : 0,
    },
    byCategory,
    cases,
  };
}

async function writeReport(report: RunReport): Promise<string> {
  const dir = resolve(repoRoot, "eval/reports");
  await mkdir(dir, { recursive: true });
  const filename = `${report.generatedAt.replace(/[:.]/g, "-")}.json`;
  const path = resolve(dir, filename);
  await writeFile(path, JSON.stringify(report, null, 2));
  return path;
}

async function compareToBaseline(report: RunReport, name: string): Promise<number> {
  const baselineDir = resolve(repoRoot, "eval/baselines");
  let baselineFile: string;
  if (name === "latest") {
    // Use the most recent baseline by filename lexicographic order.
    const { readdir } = await import("node:fs/promises");
    const entries = (await readdir(baselineDir).catch(() => [])).filter((f) => f.endsWith(".json"));
    if (entries.length === 0) {
      console.warn("No baselines found — skipping comparison.");
      return 0;
    }
    baselineFile = resolve(baselineDir, entries.sort().at(-1)!);
  } else {
    baselineFile = resolve(baselineDir, name.endsWith(".json") ? name : `${name}.json`);
  }
  if (!existsSync(baselineFile)) {
    console.warn(`Baseline ${baselineFile} not found — skipping comparison.`);
    return 0;
  }
  const baseline = JSON.parse(await readFile(baselineFile, "utf8")) as RunReport;
  const drop = baseline.totals.top1Rate - report.totals.top1Rate;
  console.log(
    `\nBaseline: ${baselineFile}\n  top1: ${(baseline.totals.top1Rate * 100).toFixed(1)}% → ${(
      report.totals.top1Rate * 100
    ).toFixed(1)}% (Δ ${(drop * -100).toFixed(1)}pp)`,
  );
  return drop;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();
  const cases = args.caseId ? manifest.cases.filter((c) => c.id === args.caseId) : manifest.cases;

  if (cases.length === 0) {
    console.log("No cases to run. Populate eval/manifest.json and drop images in eval/images/.");
    return;
  }

  console.log(`Running eval against ${cases.length} case(s)…\n`);

  const results: CaseReport[] = [];
  for (const c of cases) {
    process.stdout.write(`  ${c.id} [${c.category}] …`);
    const report = await scoreCase(c);
    results.push(report);
    if (report.errorMessage) {
      console.log(` error: ${report.errorMessage}`);
    } else {
      console.log(
        ` top1 ${report.top1Hits}/${report.regionCount} · top3 ${report.top3Hits}/${report.regionCount}`,
      );
    }
  }

  const model = "claude-opus-4-6";
  const report = aggregate(results, model);

  console.log(
    `\nOverall: top1 ${(report.totals.top1Rate * 100).toFixed(1)}% · top3 ${(
      report.totals.top3Rate * 100
    ).toFixed(1)}% (regions=${report.totals.regions})`,
  );
  for (const [cat, v] of Object.entries(report.byCategory)) {
    console.log(
      `  ${cat.padEnd(24)} top1 ${(v.top1Rate * 100).toFixed(1)}%  top3 ${(
        v.top3Rate * 100
      ).toFixed(1)}%  (n=${v.regions})`,
    );
  }

  const path = await writeReport(report);
  console.log(`\nReport written: ${path}`);

  if (args.baseline) {
    const drop = await compareToBaseline(report, args.baseline);
    if (drop > 0.02) {
      console.error(`\nRegression: top-1 dropped by more than 2pp vs baseline.`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
