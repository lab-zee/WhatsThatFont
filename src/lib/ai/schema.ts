import { z } from "zod";

const Bbox = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});

export const Confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof Confidence>;

export const CandidateSchema = z.object({
  name: z.string().min(1).max(120),
  confidence: Confidence,
  rationale: z.string().min(1),
  alternateFor: z.string().nullable(),
});
export type CandidateModel = z.infer<typeof CandidateSchema>;

export const RegionSchema = z.object({
  id: z.string().regex(/^r\d+$/),
  description: z.string().min(1),
  sampleText: z.string(),
  bbox: Bbox,
  candidates: z.array(CandidateSchema).min(1).max(5),
});
export type RegionModel = z.infer<typeof RegionSchema>;

export const ReportFontsSchema = z.object({
  regions: z.array(RegionSchema).min(1),
  overallNotes: z.string().nullable(),
});
export type ReportFonts = z.infer<typeof ReportFontsSchema>;

export const ReportFontsJsonSchema = z.toJSONSchema(ReportFontsSchema, {
  target: "draft-7",
});
