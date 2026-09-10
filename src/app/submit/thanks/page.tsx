import Link from "next/link";

export default function ThanksPage() {
  return (
    <main className="shell">
      <section className="panel stack">
        <h1>Submitted</h1>
        <p className="muted">The original submission was saved for private review.</p>
        <Link className="btn" href="/submit">Submit another</Link>
      </section>
    </main>
  );
}
