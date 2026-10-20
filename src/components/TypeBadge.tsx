import { TYPE_LABEL, type RaneType } from '@/lib/battle/types';

export function TypeBadge({ type }: { type: RaneType }) {
  return <span className="type-badge">{TYPE_LABEL[type]}</span>;
}
