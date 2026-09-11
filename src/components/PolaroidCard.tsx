export interface PolaroidCardProps {
  label: string;
  rotation?: number;
}

export function PolaroidCard({ label, rotation = Math.random() * 6 - 3 }: PolaroidCardProps) {
  return (
    <div className="polaroid-card" style={{ '--rotation': rotation } as React.CSSProperties}>
      <div className="polaroid-image">
        <span>{label}</span>
      </div>
      <div className="polaroid-caption">M3</div>
    </div>
  );
}
