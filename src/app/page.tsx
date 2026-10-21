import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1>JEE Main · Advanced · NEET mock tests</h1>
      <p className="muted">Timed tests, instant scoring and detailed solutions.</p>
      <Link className="btn" href="/tests">Browse tests</Link>
    </>
  );
}
