export interface PhotoPlaceholderProps {
  label: string;
  className?: string;
}

export function PhotoPlaceholder({ label, className = "" }: PhotoPlaceholderProps) {
  return (
    <div className={`photo-placeholder ${className}`} style={{
      background: 'linear-gradient(135deg, rgba(184, 155, 255, 0.1) 0%, rgba(159, 124, 255, 0.05) 100%)',
      border: '1px solid rgba(184, 155, 255, 0.2)',
      borderRadius: '12px',
      padding: '48px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      minHeight: '360px',
      color: 'var(--muted)',
      fontSize: '16px',
      fontWeight: '500'
    }}>
      {label}
    </div>
  );
}
