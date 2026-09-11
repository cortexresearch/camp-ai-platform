// Fixed-window rate limiting, in memory.
//
// Deliberately not Redis-backed: the app runs as a single Railway service, so
// process memory is a consistent view of traffic. If this ever scales to more
// than one replica, each replica gets its own window and the effective limit
// multiplies by the replica count — move to a shared store at that point.
//
// This is a cheap-traffic guard (scripted signup floods, credential stuffing,
// someone pointing a loop at /vote), not DDoS protection. Volumetric attacks
// have to be absorbed upstream at the edge before they ever reach this process.

export interface RateLimitRule {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests allowed per window, per key. */
  max: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the current window expires. For the Retry-After header. */
  retryAfterSeconds: number;
}

interface Counter {
  count: number;
  resetAt: number;
}

const counters = new Map<string, Counter>();

// Bounds memory if someone sprays requests from many addresses. Each entry is a
// short string plus two numbers, so this cap costs well under a megabyte, and
// the oldest entries are the ones closest to expiring anyway.
const MAX_TRACKED_KEYS = 20_000;

function sweep(now: number) {
  for (const [key, counter] of counters) {
    if (counter.resetAt <= now) counters.delete(key);
  }
  // Still oversized after dropping expired windows: evict in insertion order,
  // which is roughly oldest-first.
  if (counters.size > MAX_TRACKED_KEYS) {
    const excess = counters.size - MAX_TRACKED_KEYS;
    let dropped = 0;
    for (const key of counters.keys()) {
      counters.delete(key);
      if (++dropped >= excess) break;
    }
  }
}

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Records a hit against `key` and reports whether it fits inside `rule`.
 * Call once per request — it has the side effect of incrementing the counter.
 */
export function hit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();

  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    lastSweep = now;
    sweep(now);
  }

  const existing = counters.get(key);
  if (!existing || existing.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > rule.max) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client address. Railway terminates TLS at its edge and forwards
 * the real address in x-forwarded-for, where the left-most entry is the client
 * and the rest are proxies. Direct connections (local dev) have no such header.
 *
 * A client can forge x-forwarded-for, but not the proxy-appended entries — and
 * on Railway nothing reaches this process without passing the edge. Worst case
 * a forger buckets themselves under an address they don't own, which costs them
 * their own quota rather than ours.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
