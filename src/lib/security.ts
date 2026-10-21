import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function secret() {
  const s = process.env.APP_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET must be set in production");
  return "dev-only-secret-change-me";
}

export function sha256(v: string) {
  return createHash("sha256").update(v).digest("hex");
}

/** Keyed hash for low-entropy secrets (OTP) so a DB leak alone can't be brute-forced. */
export function hmac(v: string) {
  return createHmac("sha256", secret()).update(v).digest("hex");
}

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Fixed-window in-memory limiter. Fine for a single instance; swap for Redis when you scale out.
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  h.count += 1;
  return h.count <= limit;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** CSRF defence for cookie-authenticated POSTs: Origin must match Host. */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
