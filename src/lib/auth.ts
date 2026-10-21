import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { db } from "./db";
import { hmac, randomToken, safeEqual, sha256 } from "./security";
import { sendOtp } from "./mail";

export const COOKIE = "ts_session";
const SESSION_DAYS = 14;
const MAX_DEVICES = 2; // limits account sharing; oldest session is dropped
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export async function issueOtp(email: string): Promise<"sent" | "throttled"> {
  const recent = await db.otpCode.count({
    where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
  });
  if (recent >= 3) return "throttled";

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otpCode.create({
    data: { email, codeHash: hmac(`${email}:${code}`), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await sendOtp(email, code);
  return "sent";
}

export async function verifyOtp(email: string, code: string): Promise<string | null> {
  const otp = await db.otpCode.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return null;

  const ok = safeEqual(otp.codeHash, hmac(`${email}:${code}`));
  if (!ok) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return null;
  }
  await db.otpCode.deleteMany({ where: { email } });

  const user = await db.user.upsert({ where: { email }, update: {}, create: { email } });

  const token = randomToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000),
    },
  });
  const active = await db.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const stale = active.slice(MAX_DEVICES).map((s) => s.id);
  if (stale.length) await db.session.deleteMany({ where: { id: { in: stale } } });

  return token;
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(COOKIE);
}
