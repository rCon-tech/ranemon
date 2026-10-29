import { Rng } from '../battle/rng';
import { PICKS } from './stages';

/**
 * What a node on a stage's map holds:
 * - `fight`: someone in the queue or a lad at the bar, with 1 Ranemon (or now and then 2).
 * - `bouncer`: door staff who won't let you in yet. Hard, with a bigger team and a held item.
 * - `offie`: the off-licence, a shop.
 * - `smoke`: the Smoking Area, a rest: heal the party, learn a move, or take a Blue Ghost.
 */
export type NodeKind = 'fight' | 'bouncer' | 'offie' | 'smoke';

export interface MapNode {
  kind: NodeKind;
  /** The nodes in the next row it leads to. Empty on the last row, which leads to the boss. */
  next: number[];
}

/** A stage's map: PICKS rows of 2 or 3 nodes, then the boss. */
export type StageMap = MapNode[][];

const WEIGHTS: [NodeKind, number][] = [
  ['fight', 50],
  ['bouncer', 14],
  ['offie', 16],
  ['smoke', 20],
];

function kindFrom(rng: Rng): NodeKind {
  let roll = rng.next() * WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  for (const [kind, w] of WEIGHTS) {
    roll -= w;
    if (roll < 0) return kind;
  }
  return 'fight';
}

/**
 * Joins each row to the next without any lines crossing: each node leads to the nodes in the
 * next row that overlap it across the screen, so nothing in the next row is out of reach. Rows of
 * the same width sometimes get one diagonal too, so there's still a choice to make.
 */
function links(rng: Rng, widths: number[]): number[][][] {
  return widths.map((n, r) => {
    const m = widths[r + 1];
    if (m === undefined) return Array.from({ length: n }, () => []);
    const next = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => j).filter(
        (j) => j * n < (i + 1) * m && i * m < (j + 1) * n,
      ),
    );
    if (n === m && rng.chance(0.6)) {
      const i = rng.int(0, n - 2);
      if (rng.chance(0.5)) next[i] = [...next[i], i + 1];
      else next[i + 1] = [i, ...next[i + 1]];
    }
    return next;
  });
}

/** Every route from the first row to the boss, as the kinds of node it passes. */
export function routes(map: StageMap): NodeKind[][] {
  const from = (r: number, i: number): NodeKind[][] => {
    const node = map[r][i];
    if (r === map.length - 1) return [[node.kind]];
    return node.next.flatMap((j) => from(r + 1, j).map((rest) => [node.kind, ...rest]));
  };
  return map[0].flatMap((_, i) => from(0, i));
}

/**
 * The map's rules: every route passes at least one Smoking Area before the boss, and every
 * Bouncer can be avoided (no pick is ever between Bouncers only).
 */
export function isFair(map: StageMap): boolean {
  if (!routes(map).every((route) => route.includes('smoke'))) return false;
  if (map[0].every((n) => n.kind === 'bouncer')) return false;
  return map.every((row, r) =>
    row.every(
      (node) => r === map.length - 1 || node.next.some((j) => map[r + 1][j].kind !== 'bouncer'),
    ),
  );
}

/** A stage's map, from the run's seed and the stage's place in the night. */
export function stageMap(seed: number, stage: number): StageMap {
  const rng = new Rng(seed ^ Math.imul(stage + 1, 0x9e3779b1));
  for (let attempt = 0; attempt < 100; attempt++) {
    const widths = Array.from({ length: PICKS }, () => rng.int(2, 3));
    const next = links(rng, widths);
    const map: StageMap = widths.map((n, r) =>
      Array.from({ length: n }, (_, i) => ({ kind: kindFrom(rng), next: next[r][i] })),
    );
    if (isFair(map)) return map;
  }
  // Practically never: a plain map, with a Smoking Area across the whole last row.
  return Array.from({ length: PICKS }, (_, r) =>
    [0, 1].map((i) => ({
      kind: r === PICKS - 1 ? 'smoke' : 'fight',
      next: r === PICKS - 1 ? [] : [i],
    })),
  );
}
