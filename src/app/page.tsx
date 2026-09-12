import Link from "next/link";
import { PolaroidCard } from "@/components/PolaroidCard";
import { HomeHero } from "@/components/HomeHero";

export default function HomePage() {
  return (
    <main className="home-shell">
      <header className="home-nav">
        <Link className="wordmark" href="/">M3 Memory</Link>
        <a href="#about" className="quiet-link">About</a>
      </header>

      <HomeHero />

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
