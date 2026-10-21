import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoreAnswer } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function Result({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const attempt = await db.attempt.findFirst({
    where: { id, userId: user.id },
    include: { test: { include: { questions: { orderBy: { order: "asc" } } } }, responses: true },
  });
  if (!attempt) notFound();
  // Answers and solutions are only revealed after submission.
  if (!attempt.submittedAt) redirect(`/attempt/${id}`);

  const ans = new Map(attempt.responses.map((r) => [r.questionId, r.answer]));
  const total = attempt.test.questions.reduce((s, q) => s + q.marks, 0);

  const bySubject: Record<string, number> = {};
  for (const q of attempt.test.questions) bySubject[q.subject] = (bySubject[q.subject] ?? 0) + scoreAnswer(q, ans.get(q.id));

  return (
    <>
      <h1>{attempt.test.title}</h1>
      <div className="card">
        <h2>Score: {attempt.score} / {total}</h2>
        <div className="muted">{Object.entries(bySubject).map(([s, v]) => `${s}: ${v}`).join(" · ")}</div>
      </div>
      {attempt.test.questions.map((q, n) => {
        const mine = ans.get(q.id);
        const options = JSON.parse(q.options) as string[];
        return (
          <div className="card" key={q.id}>
            <div className="muted">Q{n + 1} · {q.subject}</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{q.text}</p>
            {q.type === "MCQ" ? options.map((o, k) => (
              <div key={k} className={`opt ${String(k) === q.correctAnswer ? "right" : String(k) === mine ? "wrong" : ""}`}>{o}</div>
            )) : <p>Your answer: {mine ?? "—"} · Correct: {q.correctAnswer}</p>}
            {q.explanation && <p className="muted"><b>Solution:</b> {q.explanation}</p>}
          </div>
        );
      })}
      <Link className="btn" href="/tests">Back to tests</Link>
    </>
  );
}
