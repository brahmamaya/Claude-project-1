"use client";
import { useState } from "react";

export default function StartButton({ testId, resume }: { testId: string; resume: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => {
      setBusy(true);
      const r = await fetch(`/api/tests/${testId}/start`, { method: "POST" });
      if (r.ok) location.href = `/attempt/${(await r.json()).attemptId}`;
      else { setBusy(false); alert("Could not start the test."); }
    }}>{resume ? "Resume" : "Start test"}</button>
  );
}
