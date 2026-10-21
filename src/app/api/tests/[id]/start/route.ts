import { db } from "@/lib/db";
import { guard, json } from "@/lib/http";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;

  const test = await db.test.findFirst({ where: { id, published: true } });
  if (!test) return json({ error: "not_found" }, 404);

  // TODO(payments): check enrollment/entitlement here once paid series exist.
  const existing = await db.attempt.findUnique({ where: { userId_testId: { userId: g.user.id, testId: id } } });
  if (existing) return json({ attemptId: existing.id });

  const now = new Date();
  const attempt = await db.attempt.create({
    data: {
      userId: g.user.id,
      testId: id,
      startedAt: now,
      deadline: new Date(now.getTime() + test.durationMin * 60_000),
    },
  });
  return json({ attemptId: attempt.id });
}
