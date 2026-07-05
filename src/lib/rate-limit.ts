// Best-effort in-memory sliding-window throttle.
//
// On Vercel Fluid Compute, function instances are reused across requests, so
// this meaningfully blocks naive floods from a single client. It is NOT durable
// or shared across all instances — for hard guarantees, back this with
// Upstash/Redis. Kept dependency-free on purpose.

const hits = new Map<string, number[]>()

// Coarse cap so the map can't grow without bound under a distributed flood.
const MAX_KEYS = 10_000

/**
 * Returns true if the action is allowed, false if the caller has exceeded
 * `limit` actions within `windowMs` for the given key.
 */
export function throttle(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }

  recent.push(now)
  hits.set(key, recent)

  if (hits.size > MAX_KEYS) {
    // Drop the oldest-inserted keys (Map preserves insertion order).
    const excess = hits.size - MAX_KEYS
    const keys = Array.from(hits.keys())
    for (let i = 0; i < excess; i++) hits.delete(keys[i])
  }

  return true
}

/** Extract a best-effort client IP from the request headers. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}
