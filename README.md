# TestSeries (JEE / NEET) – MVP

Next.js 15 + Prisma (SQLite for dev, Postgres for prod) + TypeScript. No payments yet.

## Run locally
```bash
cp .env.example .env
npm install
npm run db:push     # create tables
npm run db:seed     # sample test
npm run dev         # http://localhost:3000
```
Login is email OTP. In dev the OTP is printed in the server console (`[DEV OTP] ...`).

## What's built
- Email-OTP login, server-side sessions (hashed token, httpOnly cookie), max 2 devices per account
- Test list → start → exam UI (MCQ + numerical, palette, autosave, resume) → result with solutions
- Scoring: +4/-1 MCQ, +4/0 numerical (configurable per question)

## Security decisions
- Correct answers/explanations are never sent to the browser until the attempt is submitted
- Timer is server-authoritative (`deadline` stored in DB); late answers are rejected, expired attempts auto-submit
- Every attempt query is scoped to the logged-in user (no IDOR); submit is idempotent
- OTPs stored as keyed HMAC, 10 min expiry, 5 tries, per-email and per-IP rate limits
- CSRF: SameSite=Lax cookie + Origin check on every mutating route; security headers in `next.config.mjs`
- Zod validation on all inputs; Prisma (parameterised queries)

## Before going to production
1. Set `APP_SECRET` (`openssl rand -base64 32`) – the app refuses to run in production without it
2. Implement `src/lib/mail.ts` with a real email/SMS provider (SES, MSG91, Resend)
3. Switch `provider` to `postgresql` in `prisma/schema.prisma`; set `DATABASE_URL`
4. Replace the in-memory rate limiter in `src/lib/security.ts` with Redis if running >1 instance
5. Add an admin area for uploading questions (currently seed script only; `role` field is ready)
6. Add privacy policy / terms and parental-consent step (DPDP Act, minors)
7. Payments: add an `Enrollment` table and check it in `POST /api/tests/[id]/start` (see TODO there)
