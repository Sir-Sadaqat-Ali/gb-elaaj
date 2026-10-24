// In-memory sliding-window rate limiter for AI endpoints.
//
// Scope: per Vercel function instance — NOT distributed. An attacker hitting
// many cold instances could exceed the per-user cap. Replace with Upstash
// Redis when Stage 9 lands. Sufficient as first-line defense today.
//
// Limits (defaults, can be overridden per-call):
//   • 60 messages per 60 seconds per user
//   • Map keys are pruned on each access; no separate timer
//
// Returns { allowed, remaining, resetAt } so the route can return 429
// with X-RateLimit-* headers.

type Bucket = number[]; // sorted timestamps (ms)

declare global {
  // eslint-disable-next-line no-var
  var __aiRateLimit: Map<string, Bucket> | undefined;
}

const store: Map<string, Bucket> =
  globalThis.__aiRateLimit ?? (globalThis.__aiRateLimit = new Map());

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // ms epoch when oldest in-window request will fall out
  limit: number;
};

export function checkRateLimit(opts: {
  key: string;
  windowMs?: number;
  max?: number;
}): RateLimitResult {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 60;
  const now = Date.now();
  const cutoff = now - windowMs;

  const existing = store.get(opts.key) ?? [];
  // Drop expired
  const fresh = existing.filter((t) => t > cutoff);

  if (fresh.length >= max) {
    store.set(opts.key, fresh);
    return {
      allowed: false,
      remaining: 0,
      resetAt: fresh[0] + windowMs,
      limit: max,
    };
  }

  fresh.push(now);
  store.set(opts.key, fresh);
  return {
    allowed: true,
    remaining: Math.max(0, max - fresh.length),
    resetAt: fresh[0] + windowMs,
    limit: max,
  };
}
