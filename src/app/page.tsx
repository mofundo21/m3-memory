import Link from "next/link";
import { PolaroidCard } from "@/components/PolaroidCard";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

export default function HomePage() {
  return (
    <main className="home-shell">
      <header className="home-nav">
        <Link className="wordmark" href="/">M3 Memory</Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="#about" className="quiet-link">About</a>
          <Link className="quiet-link" href="/admin">Admin</Link>
        </div>
      </header>

      <div className="split" style={{ alignItems: 'start', marginBottom: '64px' }}>
        <section className="home-hero" style={{ padding: '0' }}>
          <p className="kicker">Personal Archive × Creative Studio × Memory Box</p>
          <h1>An autobiography written by everyone who was there.</h1>
          <p>
            Festivals. Friends. Late nights. Conversations. Chaos. Connection. I don't remember everything, but maybe you do.
          </p>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr auto' }}>
            <div>
              <p style={{ marginBottom: '4px', fontSize: '13px', color: 'var(--muted)', fontWeight: '500' }}>Real memories. A bigger picture.</p>
            </div>
            <Link className="primary-action" href="/remember" style={{ whiteSpace: 'nowrap' }}>Share a Memory</Link>
          </div>
          <p className="micro-note">No account needed. Your original words stay private and preserved.</p>
        </section>

        <PhotoPlaceholder label="Hero Portrait" />
      </div>

      <section id="about" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', marginBottom: '24px' }}>What is M3 Memory?</h2>
        <p style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '16px', lineHeight: '1.7' }}>
          I've lived a lot of life. Festivals, music, friendships, random adventures, late nights, conversations, and moments I didn't realize were important when they happened. But I know I don't remember all of it.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: '1.7' }}>
          M3 Memory is a private archive of the moments other people remember about me—partly to understand my own life better, and partly to help me write my book. Every memory is a piece of the story I lived, and the stories I carried.
        </p>
      </section>

      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', marginBottom: '32px', textAlign: 'center' }}>Memories Through Time</h2>
        <div className="gallery">
          <PolaroidCard label="Festival Memory" rotation={-2} />
          <PolaroidCard label="Friends" rotation={3} />
          <PolaroidCard label="Chess & Life" rotation={-1} />
          <PolaroidCard label="Night Scene" rotation={2} />
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '40px 0', borderTop: '1px solid var(--border)', marginTop: '80px' }}>
        <p className="micro-note">M3 Memory. A private archive.</p>
      </footer>
    </main>
  );
}
