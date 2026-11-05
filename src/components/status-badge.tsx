import { STATUS_LABEL, type PitchStatus } from '@/lib/schema';

const CLASS: Record<PitchStatus, string> = {
  created: 'badge-created',
  sent: 'badge-sent',
  viewed: 'badge-viewed',
  in_discussion: 'badge-discussion',
  won: 'badge-won',
  lost: 'badge-lost',
};

export function StatusBadge({ status }: { status: PitchStatus }) {
  return (
    <span className={`badge ${CLASS[status]}`}>
      <span className="dot" />
      <span className="label">{STATUS_LABEL[status]}</span>
    </span>
  );
}
