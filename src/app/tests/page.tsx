import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import StartButton from "@/components/StartButton";

export const dynamic = "force-dynamic";

export default async function Tests() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const tests = await db.test.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } }, attempts: { where: { userId: user.id } } },
  });

  return (
    <>
      <h1>Tests</h1>
      {tests.length === 0 && <p className="muted">No tests yet.</p>}
      {tests.map((t) => {
        const a = t.attempts[0];
        return (
          <div className="card" key={t.id}>
            <b>{t.title}</b>
            <div className="muted">{t.exam.replace("_", " ")} · {t._count.questions} questions · {t.durationMin} min</div>
            <p>
              {a?.submittedAt ? <Link className="btn" href={`/attempt/${a.id}/result`}>View result ({a.score})</Link>
                : <StartButton testId={t.id} resume={!!a} />}
            </p>
          </div>
        );
      })}
    </>
  );
}
