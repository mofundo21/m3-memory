import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-shell">
      <header className="home-nav">
        <Link className="wordmark" href="/">M3 Memory</Link>
        <Link className="quiet-link" href="/admin">Admin</Link>
      </header>

      <section className="home-hero">
        <p className="kicker">Personal Archive x Creative Studio</p>
        <h1>Some memories only exist because you carried them.</h1>
        <p>
          M3 Memory is a private place to send Yeriel / MOFUNDO the moments you remember with him. Your original words are preserved as their own source record before any review, notes, or future story work.
        </p>
        <Link className="primary-action" href="/remember">Share a Memory</Link>
        <p className="micro-note">No account needed. Production starts empty. Public visitors cannot browse submissions.</p>
      </section>
    </main>
  );
}
