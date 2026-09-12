export interface PhotoPlaceholderProps {
  label?: string;
  className?: string;
  showLabel?: boolean;
  aspectRatio?: string;
  size?: 'small' | 'medium' | 'large';
}

export function PhotoPlaceholder({
  label,
  className = "",
  showLabel = false,
  aspectRatio = '2/3',
  size = 'medium'
}: PhotoPlaceholderProps) {
  const minHeightMap = {
    small: '240px',
    medium: '400px',
    large: '540px'
  };

  return (
    <div
      className={`photo-placeholder ${className}`}
      style={{
        position: 'relative',
        aspectRatio: aspectRatio,
        minHeight: minHeightMap[size],
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)',
        border: '1px solid rgba(242, 234, 219, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {/* Grain texture SVG */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.25
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="grain-texture">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            seed="2"
          />
          <feColorMatrix type="saturate" values="0.15" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-texture)" opacity="0.5" />
      </svg>

      {/* Dark vignette - bottom/edges fade to black */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 80% at center, transparent 0%, rgba(0, 0, 0, 0.3) 70%),
            linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.2) 100%)
          `,
          pointerEvents: 'none'
        }}
      />

      {/* Optional label - only if showLabel is true */}
      {showLabel && label && (
        <p style={{
          position: 'relative',
          zIndex: 1,
          color: 'var(--muted)',
          fontSize: '13px',
          fontWeight: '500',
          margin: 0,
          maxWidth: '80%',
          opacity: 0.8
        }}>
          {label}
        </p>
      )}
    </div>
  );
}
