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
  aspectRatio = '4/3',
  size = 'medium'
}: PhotoPlaceholderProps) {
  const minHeightMap = {
    small: '240px',
    medium: '360px',
    large: '500px'
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
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        border: '1px solid rgba(242, 234, 219, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.3
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" />
          <feColorMatrix type="saturate" values="0.3" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" opacity="0.4" />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
          pointerEvents: 'none'
        }}
      />

      {showLabel && label && (
        <p style={{
          position: 'relative',
          zIndex: 1,
          color: 'var(--muted)',
          fontSize: '14px',
          fontWeight: '500',
          margin: 0,
          maxWidth: '80%'
        }}>
          {label}
        </p>
      )}
    </div>
  );
}
