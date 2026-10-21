import { z } from "zod";
import { db } from "@/lib/db";
import { guard, json } from "@/lib/http";

const Body = z.object({ questionId: z.string(), answer: z.string().max(32).nullable() });
const GRACE_MS = 5_000; // network latency allowance on the server deadline

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "invalid_input" }, 400);

  // Ownership is part of the query: other users' attempts look like 404.
  const attempt = await db.attempt.findFirst({ where: { id, userId: g.user.id } });
  if (!attempt) return json({ error: "not_found" }, 404);
  if (attempt.submittedAt || Date.now() > attempt.deadline.getTime() + GRACE_MS) {
    return json({ error: "attempt_closed" }, 409);
  }

  const q = await db.question.findFirst({ where: { id: body.data.questionId, testId: attempt.testId } });
  if (!q) return json({ error: "not_found" }, 404);

  await db.response.upsert({
    where: { attemptId_questionId: { attemptId: id, questionId: q.id } },
    update: { answer: body.data.answer },
    create: { attemptId: id, questionId: q.id, answer: body.data.answer },
  });
  return json({ ok: true });
}
