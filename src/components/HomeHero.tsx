import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

export function HomeHero() {
  return (
    <div
      className="home-hero-wrapper"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '64px',
        alignItems: 'start',
        marginBottom: '80px',
      }}
    >
      {/* LEFT: Text content */}
      <div
        className="home-hero-text"
        style={{
          minWidth: 0,
          flex: '0 1 45%',
        }}
      >
        <p className="kicker">Personal Archive × Creative Studio × Memory Box</p>
        <h1 style={{ margin: '16px 0 24px' }}>
          An autobiography<br />written by everyone<br />who was there.
        </h1>
        <p style={{
          color: 'var(--muted)',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Festivals. Friends. Late nights. Conversations. Chaos. Connection. I don't remember everything, but maybe you do.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--muted)',
              fontWeight: '500'
            }}>
              Real memories. A bigger picture.
            </p>
          </div>
          <Link className="primary-action" href="/remember">
            Share a Memory
          </Link>
        </div>

        <p className="micro-note">
          No account needed. Your original words stay private and preserved.
        </p>
      </div>

      {/* RIGHT: Portrait image */}
      <div
        className="home-hero-portrait"
        style={{
          flex: '0 1 50%',
          minWidth: 0,
        }}
      >
        <PhotoPlaceholder
          aspectRatio="2/3"
          size="large"
          showLabel={false}
        />
      </div>
    </div>
  );
}
