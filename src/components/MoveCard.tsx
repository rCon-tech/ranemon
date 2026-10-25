'use client';

import { moveById } from '@/lib/battle/moves';
import { TYPE_LABEL } from '@/lib/battle/types';
import { strongAgainst } from '@/lib/story/dex';
import { TypeBadge } from './TypeBadge';

const CATEGORY = { physical: 'PHYS', spirit: 'SPIR', status: 'STATUS' } as const;

/**
 * One move on a moves screen (story's PARTY, battle mode's team and a friend battle's lobby):
 * name, type, power, accuracy and PP at a glance. Without `onClick` it's only for reading.
 */
export function MoveCard({
  id,
  pp,
  stab,
  picked = false,
  disabled,
  onClick,
}: {
  id: string;
  /** PP left, for a move in one of the 4 slots. */
  pp?: number;
  /** The move shares a type with the Ranemon, so it hits harder. */
  stab: boolean;
  picked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const move = moveById(id);
  const strong = strongAgainst(move);
  const body = (
    <>
      <span className="flex items-center justify-between gap-1 text-[11px]">
        <span className="truncate">
          {move.signature ? '★ ' : ''}
          {move.name}
        </span>
        {move.type && <TypeBadge type={move.type} />}
      </span>
      <span className="flex justify-between gap-1 text-[9px]">
        <span>
          {CATEGORY[move.category]} · POW {move.power || '—'} · ACC{' '}
          {move.accuracy === null ? '—' : `${move.accuracy}%`}
        </span>
        <span className="shrink-0">PP {pp === undefined ? move.pp : `${pp}/${move.pp}`}</span>
      </span>
      {(stab || strong.length > 0) && (
        <span className="text-[9px] opacity-80">
          {stab && move.power > 0 ? 'Same type: hits harder. ' : ''}
          {strong.length > 0 && `Strong vs ${strong.map((t) => TYPE_LABEL[t]).join(', ')}`}
        </span>
      )}
      {picked && <span className="text-[9px] leading-relaxed">{move.flavour}</span>}
    </>
  );
  const look = 'pixel-btn flex flex-col gap-0.5 px-2 py-1.5 text-[10px]';
  if (!onClick)
    return (
      <div className={look} data-testid="move-card">
        {body}
      </div>
    );
  return (
    <button
      type="button"
      className={look}
      aria-pressed={picked}
      disabled={disabled}
      onClick={onClick}
      data-testid="move-card"
    >
      {body}
    </button>
  );
}
