import { db } from "@/lib/db";
import { guard, json } from "@/lib/http";
import { finalizeAttempt } from "@/lib/attempts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;

  const attempt = await db.attempt.findFirst({ where: { id, userId: g.user.id } });
  if (!attempt) return json({ error: "not_found" }, 404);

  const score = await finalizeAttempt(id); // idempotent
  return json({ ok: true, score });
}
