import Link from "next/link";

export default function ThanksPage() {
  return (
    <main className="memory-shell center-shell">
      <section className="memory-card thanks-card">
        <h1 style={{ marginBottom: '12px' }}>Thank you.</h1>
        <p className="handwritten" style={{ textAlign: 'center', marginBottom: '24px' }}>You're now part of the story.</p>
        <p>
          Your memory has been added to the private M3 Memory archive. Every memory helps reconnect people, places, and moments that might otherwise disappear.
        </p>
        <p className="micro-note">
          Your original words are preserved exactly as you submitted them. This version is private until Yeriel reviews it and decides if it belongs in a story.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Link className="btn primary" href="/remember">Share Another Memory</Link>
          <Link className="btn" href="/">Return Home</Link>
        </div>
      </section>
    </main>
  );
}
