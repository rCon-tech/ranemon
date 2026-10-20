import { TYPE_COLOR, TYPE_LABEL, type RaneType } from '@/lib/battle/types';

export function TypeBadge({ type }: { type: RaneType }) {
  return (
    <span className="type-badge" style={{ background: TYPE_COLOR[type] }}>
      {TYPE_LABEL[type]}
    </span>
  );
}
