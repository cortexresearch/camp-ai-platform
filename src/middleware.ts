import { NextResponse, type NextRequest } from "next/server";
import { hit, clientIp, type RateLimitRule } from "@/lib/rate-limit";

// Three tiers, loosest to tightest. A request is checked against every tier it
// qualifies for, so a login POST consumes browse, write, and auth budget.
//
// The numbers are set so a person using the site hard — refreshing the vote
// page, rating a dozen builds, uploading a screenshot — never sees a 429, while
// a script hammering the box does. Show nights are the load test: everyone
// submits and votes inside the same 30 minutes.

/** Any request that reaches the app. Generous: pages pull several subrequests. */
const BROWSE: RateLimitRule = { windowMs: 60_000, max: 120 };

/** Mutations. Server actions post to the page URL, so this covers them too. */
const WRITE: RateLimitRule = { windowMs: 60_000, max: 30 };

/**
 * Credential endpoints. Tight enough to make online password guessing
 * pointless, loose enough to survive a few genuine fumbled logins.
 */
const AUTH: RateLimitRule = { windowMs: 10 * 60_000, max: 12 };

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

function tooMany(retryAfterSeconds: number) {
  return new NextResponse("Too many requests. Slow down and try again shortly.", {
    status: 429,
    headers: {
      "retry-after": String(Math.max(1, retryAfterSeconds)),
      "content-type": "text/plain; charset=utf-8",
      // Nothing about a throttled response is worth storing.
      "cache-control": "no-store",
    },
  });
}

export function middleware(request: NextRequest) {
  const ip = clientIp(request.headers);
  const { pathname } = request.nextUrl;
  const isWrite = request.method === "POST";
  const isAuth = isWrite && AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Tightest tier first, so the response reports the longest wait that applies.
  if (isAuth) {
    const result = hit(`auth:${ip}`, AUTH);
    if (!result.ok) return tooMany(result.retryAfterSeconds);
  }

  if (isWrite) {
    const result = hit(`write:${ip}`, WRITE);
    if (!result.ok) return tooMany(result.retryAfterSeconds);
  }

  const browse = hit(`browse:${ip}`, BROWSE);
  if (!browse.ok) return tooMany(browse.retryAfterSeconds);

  return NextResponse.next();
}

export const config = {
  // Static assets and image optimizer output are served straight from disk and
  // cost nothing to hand out — counting them would let one page load eat a
  // visitor's whole budget. Everything else, including /api, is metered.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
