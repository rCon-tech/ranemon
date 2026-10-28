'use client';

import type { NodeKind, StageMap } from '@/lib/sesh/map';

/** What each kind of node is called on the map, and its colour. */
export const NODE_LOOK: Record<NodeKind | 'boss', { label: string; about: string; cmd: string }> = {
  fight: { label: 'FIGHT', about: 'Someone after a battle. EXP and cash.', cmd: 'fight' },
  bouncer: {
    label: 'BOUNCER',
    about: 'Door staff. Hard, with a bigger team, and they drop something good.',
    cmd: 'run',
  },
  offie: {
    label: 'OFFIE',
    about: 'The off-licence. Food, vapes and the odd Blue Ghost.',
    cmd: 'bag',
  },
  smoke: {
    label: 'SMOKE',
    about: 'A sit-down outside: heal up, learn a move, or a Blue Ghost.',
    cmd: 'party',
  },
  boss: { label: 'BOSS', about: 'The stage’s boss.', cmd: 'mega' },
};

/** Where a node sits across its row, as a percentage. */
const across = (i: number, n: number) => ((i + 0.5) / n) * 100;
/** Rows go up the screen: the first pick at the bottom, the boss at the top. */
const ROW_H = 72;

/**
 * A stage's map, drawn flat (2D only): the picks as rows from the bottom up, joined by lines to
 * the nodes each leads to, and the boss at the top. Nodes you can pick next are buttons; the
 * route you took so far is lit.
 */
export function SeshMap({
  map,
  path,
  open,
  bossOpen,
  bossName,
  onPick,
  onBoss,
}: {
  map: StageMap;
  path: number[];
  /** The nodes in the next row you can go to. */
  open: number[];
  bossOpen: boolean;
  bossName: string;
  onPick: (col: number) => void;
  onBoss: () => void;
}) {
  const rows = map.length;
  const height = (rows + 1) * ROW_H;
  // y of a row's centre, from the top: the boss is row `rows`.
  const y = (r: number) => height - (r + 0.5) * ROW_H;
  const taken = (r: number, i: number) => path[r] === i;
  return (
    <div className="relative w-full" style={{ height }} data-testid="sesh-map">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {map.map((row, r) =>
          row.map((node, i) => {
            const targets = r === rows - 1 ? [-1] : node.next;
            return targets.map((j) => {
              const x2 = j < 0 ? 50 : across(j, map[r + 1].length);
              const lit = taken(r, i) && (j < 0 || path[r + 1] === j);
              return (
                <line
                  key={`${r}-${i}-${j}`}
                  x1={across(i, row.length)}
                  y1={y(r)}
                  x2={x2}
                  y2={y(r + 1)}
                  stroke={lit ? '#f8d030' : '#8890a0'}
                  strokeWidth={lit ? 3 : 2}
                  strokeDasharray={lit ? undefined : '4 4'}
                  vectorEffect="non-scaling-stroke"
                />
              );
            });
          }),
        )}
      </svg>
      {map.map((row, r) =>
        row.map((node, i) => {
          const look = NODE_LOOK[node.kind];
          const can = r === path.length && open.includes(i);
          const done = taken(r, i);
          return (
            <button
              key={`${r}-${i}`}
              type="button"
              className={`pixel-btn absolute flex w-[28%] -translate-x-1/2 -translate-y-1/2 flex-col items-center px-1 py-1.5 text-[10px] leading-tight ${
                can ? 'ring-2 ring-gold' : ''
              } ${!can && !done ? 'opacity-50' : ''}`}
              style={{ left: `${across(i, row.length)}%`, top: y(r) }}
              data-cmd={look.cmd}
              disabled={!can}
              aria-pressed={done}
              aria-label={`${look.label}${done ? ', where you went' : ''}${can ? ', you can go here' : ''}`}
              title={look.about}
              onClick={() => onPick(i)}
              data-testid={`node-${r}-${i}`}
              data-kind={node.kind}
            >
              {done && <span aria-hidden>✓ </span>}
              {look.label}
            </button>
          );
        }),
      )}
      <button
        type="button"
        className={`pixel-btn absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center px-3 py-1.5 text-[11px] ${
          bossOpen ? 'ring-2 ring-gold' : 'opacity-70'
        }`}
        style={{ left: '50%', top: y(rows) }}
        data-cmd="mega"
        disabled={!bossOpen}
        onClick={onBoss}
        data-testid="node-boss"
      >
        <span className="font-bold">BOSS</span>
        <span className="text-[9px]">{bossName}</span>
      </button>
    </div>
  );
}
