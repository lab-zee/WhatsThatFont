import { NextResponse } from "next/server";
import { resolveSources } from "@/lib/fonts/resolve";
import { getLimiter } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/http/client-ip";
import { rateLimitHeaders, retryAfterSeconds } from "@/lib/http/ratelimit-headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_Q_LEN = 120;

export async function GET(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const rl = await getLimiter("lookup").check(ip);
  const baseHeaders = rateLimitHeaders(rl);

  if (!rl.ok) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests. Slow down." } },
      {
        status: 429,
        headers: { ...baseHeaders, "Retry-After": String(retryAfterSeconds(rl)) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q");
  if (!raw || raw.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "invalid_query", message: "Missing 'q' query parameter." } },
      { status: 400, headers: baseHeaders },
    );
  }
  if (raw.length > MAX_Q_LEN) {
    return NextResponse.json(
      { error: { code: "invalid_query", message: `Query exceeds ${MAX_Q_LEN} chars.` } },
      { status: 400, headers: baseHeaders },
    );
  }

  const { sources, verified } = resolveSources(raw);

  return NextResponse.json({ query: raw, verified, sources }, { headers: baseHeaders });
}
