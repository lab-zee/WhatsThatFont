/**
 * Extracts the client IP from a Next.js Request, trusting platform forwarded
 * headers. On Vercel, x-forwarded-for is set by the edge and is the first hop.
 * For unknown origins we fall back to a stable placeholder so the limiter
 * still works (at the cost of per-instance sharing).
 */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
