"use client";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: object) {
    setBusy(true); setErr("");
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    return r;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const r = await post("/api/auth/request", { email });
    if (r.ok) setStep("code");
    else setErr(r.status === 429 ? "Too many attempts. Try again later." : "Enter a valid email.");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const r = await post("/api/auth/verify", { email, code });
    if (r.ok) location.href = "/tests";
    else setErr("Wrong or expired code.");
  }

  return (
    <div className="card" style={{ maxWidth: 380, margin: "40px auto" }}>
      <h2>Login</h2>
      {step === "email" ? (
        <form onSubmit={sendCode}>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <p><button disabled={busy}>Send code</button></p>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="muted">We sent a 6-digit code to {email}.</p>
          <input type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
          <p><button disabled={busy}>Verify</button></p>
        </form>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
