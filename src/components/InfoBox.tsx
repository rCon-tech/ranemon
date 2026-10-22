import type { Battler } from '@/lib/battle/engine';
import type { Status } from '@/lib/battle/moves';
import { STATUS_TAG } from '@/lib/ui/playback';
import { TypeBadge } from './TypeBadge';

interface Props {
  battler: Battler;
  hp: number;
  status: Status | null;
  mine: boolean;
  /** Story mode's EXP bar: how far through its level, 0 to 1. */
  exp?: number;
  /** Story mode's wild Ranemon: a pint by its name when you've befriended one before. */
  caught?: boolean;
}

/** A wee pint of stout, the way a Poké Ball marks a Pokémon you've caught before. */
function CaughtPint() {
  return (
    <svg
      className="caught-pint"
      viewBox="0 0 8 11"
      width={11}
      height={15}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Befriended before"
      data-testid="caught-pint"
    >
      <rect x={0} y={0} width={8} height={3} fill="#9fb0c2" />
      <rect x={1} y={3} width={6} height={8} fill="#9fb0c2" />
      <rect x={1} y={0} width={6} height={3} fill="#fff1cc" />
      <rect x={2} y={3} width={4} height={7} fill="#1a1210" />
    </svg>
  );
}

export function InfoBox({ battler, hp, status, mine, exp, caught }: Props) {
  const max = battler.stats.hp;
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const colour =
    pct > 50 ? 'var(--color-hp-high)' : pct > 20 ? 'var(--color-hp-mid)' : 'var(--color-hp-low)';
  const who = mine ? 'Your' : 'Foe';
  return (
    <div
      className={`info-box ${mine ? 'info-you' : 'info-foe'} ${battler.creature.shiny ? 'info-shiny' : ''}`}
      data-testid={mine ? 'info-you' : 'info-foe'}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate">
            {battler.creature.shiny && (
              <span className="shiny-name" aria-label="Shiny" data-testid="shiny-star">
                ★
              </span>
            )}
            {battler.creature.name}
          </span>
          {caught && <CaughtPint />}
        </span>
        <span className="shrink-0 text-[10px]">Lv{battler.level}</span>
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
        <div className="mt-1 text-right text-[11px]">
          {hp}/ {max}
        </div>
      )}
      {exp !== undefined && (
        <div className="exp-track" aria-label="EXP">
          <div className="exp-fill" style={{ width: `${Math.round(exp * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
