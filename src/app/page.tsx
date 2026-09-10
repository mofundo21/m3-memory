import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <strong>M3 Memory</strong>
          <span>Private archive foundation</span>
        </div>
        <Link className="btn" href="/admin">Admin</Link>
      </header>

      <section className="panel stack">
        <h1>Submit a memory</h1>
        <p className="muted">
          This archive starts empty. Submissions are saved for private review before anything becomes story or book material.
        </p>
        <Link className="btn primary" href="/submit">Open submission form</Link>
      </section>
    </main>
  );
}
