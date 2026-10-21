export type ScoredQuestion = {
  type: string;
  correctAnswer: string;
  marks: number;
  negative: number;
};

/** Returns marks for one answer. Unanswered = 0. Numerical questions have no negative marking. */
export function scoreAnswer(q: ScoredQuestion, answer: string | null | undefined): number {
  if (answer == null || answer.trim() === "") return 0;
  if (q.type === "NUMERICAL") {
    const a = Number(answer);
    const c = Number(q.correctAnswer);
    return Number.isFinite(a) && Math.abs(a - c) < 1e-6 ? q.marks : 0;
  }
  return answer === q.correctAnswer ? q.marks : -q.negative;
}

export function scoreAttempt(qs: (ScoredQuestion & { id: string })[], answers: Map<string, string | null>) {
  return qs.reduce((sum, q) => sum + scoreAnswer(q, answers.get(q.id)), 0);
}
