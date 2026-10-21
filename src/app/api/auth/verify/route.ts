import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookie, verifyOtp } from "@/lib/auth";
import { json } from "@/lib/http";
import { clientIp, rateLimit, sameOrigin } from "@/lib/security";

const Body = z.object({
  email: z.string().email().max(254).transform((e) => e.toLowerCase()),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);
  if (!rateLimit(`verify-ip:${clientIp(req)}`, 20, 15 * 60_000)) return json({ error: "too_many_requests" }, 429);

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "invalid_input" }, 400);

  const token = await verifyOtp(body.data.email, body.data.code);
  if (!token) return json({ error: "invalid_code" }, 401);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(token));
  return res;
}
