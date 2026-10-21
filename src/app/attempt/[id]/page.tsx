import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { finalizeAttempt } from "@/lib/attempts";
import Exam from "@/components/Exam";

export const dynamic = "force-dynamic";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const attempt = await db.attempt.findFirst({
    where: { id, userId: user.id },
    include: { test: true, responses: true },
  });
  if (!attempt) notFound();

  if (attempt.submittedAt) redirect(`/attempt/${id}/result`);
  if (Date.now() > attempt.deadline.getTime()) {
    await finalizeAttempt(id);
    redirect(`/attempt/${id}/result`);
  }

  // Explicit select: correctAnswer / explanation must never reach the browser during the test.
  const questions = await db.question.findMany({
    where: { testId: attempt.testId },
    orderBy: { order: "asc" },
    select: { id: true, subject: true, type: true, text: true, options: true, marks: true, negative: true },
  });

  return (
    <Exam
      attemptId={id}
      title={attempt.test.title}
      deadline={attempt.deadline.toISOString()}
      serverNow={new Date().toISOString()}
      questions={questions.map((q) => ({ ...q, options: JSON.parse(q.options) as string[] }))}
      saved={Object.fromEntries(attempt.responses.map((r) => [r.questionId, r.answer]))}
    />
  );
}
