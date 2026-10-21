import { db } from "./db";
import { scoreAttempt } from "./scoring";

/**
 * Scores and closes an attempt. Safe to call repeatedly: the conditional update
 * (submittedAt: null) means only one caller wins; everyone else gets the stored score.
 */
export async function finalizeAttempt(attemptId: string): Promise<number> {
  const attempt = await db.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { responses: true, test: { include: { questions: true } } },
  });
  if (attempt.submittedAt) return attempt.score ?? 0;

  const answers = new Map(attempt.responses.map((r) => [r.questionId, r.answer]));
  const score = scoreAttempt(attempt.test.questions, answers);

  const { count } = await db.attempt.updateMany({
    where: { id: attemptId, submittedAt: null },
    data: { submittedAt: new Date(), score },
  });
  if (count === 0) return (await db.attempt.findUniqueOrThrow({ where: { id: attemptId } })).score ?? 0;
  return score;
}
