import type { Battler } from '@/lib/battle/engine';
import type { Status } from '@/lib/battle/moves';
import { STATUS_TAG } from '@/lib/ui/playback';
import { TypeBadge } from './TypeBadge';

interface Props {
  battler: Battler;
  hp: number;
  status: Status | null;
  mine: boolean;
}

export function InfoBox({ battler, hp, status, mine }: Props) {
  const max = battler.stats.hp;
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const colour =
    pct > 50 ? 'var(--color-hp-high)' : pct > 20 ? 'var(--color-hp-mid)' : 'var(--color-hp-low)';
  const who = mine ? 'Your' : 'Foe';
  return (
    <div
      className={`info-box ${mine ? 'info-you' : 'info-foe'}`}
      data-testid={mine ? 'info-you' : 'info-foe'}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate">{battler.creature.name}</span>
        <span className="shrink-0 text-[7px]">Lv{battler.level}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {battler.creature.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
        {status && <span className="status-tag">{STATUS_TAG[status]}</span>}
      </div>
      <div
        className="hp-track"
        role="meter"
        aria-label={`${who} ${battler.creature.name} HP`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={hp}
      >
        <span className="hp-label">HP</span>
        <div className="hp-bar">
          <div
            className={`hp-fill ${pct <= 20 ? 'low' : ''}`}
            style={{ width: `${pct}%`, background: colour }}
          />
        </div>
      </div>
      {mine && (
        <div className="mt-1 text-right text-[8px]">
          {hp}/ {max}
        </div>
      )}
    </div>
  );
}
