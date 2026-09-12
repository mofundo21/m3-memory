import Link from "next/link";

export default function ThanksPage() {
  return (
    <main className="memory-shell center-shell">
      <section className="memory-card thanks-card">
        <h1 style={{ marginBottom: '12px' }}>Thank you.</h1>
        <p className="handwritten" style={{ textAlign: 'center', marginBottom: '24px' }}>You're part of the story.</p>
        <p>
          I might not have remembered it. Now I can.
        </p>
        <p className="micro-note">
          Your memory is preserved in the archive, exactly as you wrote it. When the time comes to write, these words will be there.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Link className="btn primary" href="/remember">Share Another →</Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </section>
    </main>
  );
}
