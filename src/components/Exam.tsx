"use client";
import { useEffect, useRef, useState } from "react";

type Q = { id: string; subject: string; type: string; text: string; options: string[]; marks: number; negative: number };

export default function Exam(p: {
  attemptId: string; title: string; deadline: string; serverNow: string; questions: Q[];
  saved: Record<string, string | null>;
}) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>(p.saved);
  const [saveErr, setSaveErr] = useState(false);
  const [left, setLeft] = useState(0);
  const submitting = useRef(false);

  // Display-only countdown, anchored to the server clock so a wrong device clock can't extend the test.
  const skew = useRef(new Date(p.serverNow).getTime() - Date.now());
  useEffect(() => {
    const tick = () => {
      const ms = new Date(p.deadline).getTime() - (Date.now() + skew.current);
      setLeft(Math.max(0, Math.floor(ms / 1000)));
      if (ms <= 0) void submit();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    await fetch(`/api/attempts/${p.attemptId}/submit`, { method: "POST" });
    location.href = `/attempt/${p.attemptId}/result`;
  }

  async function save(questionId: string, answer: string | null) {
    setAnswers((a) => ({ ...a, [questionId]: answer }));
    try {
      const r = await fetch(`/api/attempts/${p.attemptId}/answer`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId, answer }),
      });
      setSaveErr(!r.ok);
    } catch { setSaveErr(true); }
  }

  const q = p.questions[i];
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>{p.title}</b>
        <span className="timer">{mm}:{ss}</span>
      </div>
      {saveErr && <p className="err">Connection problem – answers are not being saved. Check your internet.</p>}
      <div className="card">
        <div className="muted">Q{i + 1} · {q.subject} · +{q.marks}{q.negative ? ` / -${q.negative}` : ""}</div>
        <p style={{ whiteSpace: "pre-wrap" }}>{q.text}</p>
        {q.type === "MCQ" ? q.options.map((o, k) => (
          <label key={k} className={`opt ${answers[q.id] === String(k) ? "sel" : ""}`}>
            <input type="radio" name={q.id} checked={answers[q.id] === String(k)} onChange={() => save(q.id, String(k))} /> {o}
          </label>
        )) : (
          <input type="number" step="any" placeholder="Enter numerical answer" value={answers[q.id] ?? ""}
            onChange={(e) => save(q.id, e.target.value === "" ? null : e.target.value)} />
        )}
        <p>
          <button className="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>{" "}
          <button className="ghost" onClick={() => save(q.id, null)}>Clear</button>{" "}
          <button disabled={i === p.questions.length - 1} onClick={() => setI(i + 1)}>Next</button>
        </p>
      </div>
      <div className="pal">
        {p.questions.map((x, k) => (
          <button key={x.id} className={`${answers[x.id] != null && answers[x.id] !== "" ? "done" : ""} ${k === i ? "cur" : ""}`} onClick={() => setI(k)}>{k + 1}</button>
        ))}
      </div>
      <p><button onClick={() => confirm("Submit the test? You cannot change answers afterwards.") && submit()}>Submit test</button></p>
    </>
  );
}
