import { type SubmissionStatus } from '@/lib/types';

const statusLabels: Record<SubmissionStatus, string> = {
  UNREVIEWED: 'Unreviewed',
  IN_REVIEW: 'In Review',
  REVIEWED: 'Reviewed',
  APPROVED_FOR_STORY: 'Approved for Story',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived'
};

export interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const label = statusLabels[status] || status;
  const statusClass = `status-${status.toLowerCase()}`;

  return (
    <span className={`status ${statusClass} ${className}`}>
      {label}
    </span>
  );
}
