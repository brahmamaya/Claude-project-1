import { z } from "zod";
import { issueOtp } from "@/lib/auth";
import { json } from "@/lib/http";
import { clientIp, rateLimit, sameOrigin } from "@/lib/security";

const Body = z.object({ email: z.string().email().max(254).transform((e) => e.toLowerCase()) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);
  if (!rateLimit(`otp-ip:${clientIp(req)}`, 10, 15 * 60_000)) return json({ error: "too_many_requests" }, 429);

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "invalid_email" }, 400);

  const r = await issueOtp(body.data.email);
  if (r === "throttled") return json({ error: "too_many_requests" }, 429);
  // Same response whether or not the account exists (no user enumeration).
  return json({ ok: true });
}
