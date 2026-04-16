export type ParsedSpec = {
  count: number;
  windowMs: number;
  label: string;
};

const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseSpec(spec: string): ParsedSpec {
  const match = /^(\d+)\/(\d+)([smhd])$/.exec(spec.trim());
  if (!match) {
    throw new Error(
      `Invalid rate-limit spec: "${spec}". Expected <count>/<window><unit>, e.g. 10/1h.`,
    );
  }
  const count = Number(match[1]);
  const windowValue = Number(match[2]);
  const unit = match[3]!;
  const unitMs = UNIT_MS[unit];
  if (!unitMs) {
    throw new Error(`Unknown rate-limit unit '${unit}' in spec "${spec}".`);
  }
  if (count <= 0 || windowValue <= 0) {
    throw new Error(`Invalid rate-limit spec: "${spec}". Counts and windows must be positive.`);
  }
  return {
    count,
    windowMs: windowValue * unitMs,
    label: `${windowValue}${unit}`,
  };
}
