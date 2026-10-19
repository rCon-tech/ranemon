import { expect, it } from 'vitest';
import { Rng } from '@/lib/battle/rng';
import { STARTERS } from '@/lib/battle/roster';
import { simulateBattle } from '@/lib/battle/simulate';
import { TYPES, type RaneType } from '@/lib/battle/types';

const BATTLES = Number(process.env.SIM_BATTLES ?? 5000);

/**
 * The M1 gate: across thousands of CPU-vs-CPU battles with random teams, no type wins more
 * than 60% of the battles it appears in (counting only battles where one side has it).
 */
it(`no type wins over 60% of ${BATTLES} simulated battles`, () => {
  const rng = new Rng(2026);
  const typeTally = new Map<RaneType, { won: number; played: number }>(
    TYPES.map((t) => [t, { won: 0, played: 0 }]),
  );
  const creatureTally = new Map(STARTERS.map((c) => [c.name, { won: 0, played: 0 }]));

  for (let i = 0; i < BATTLES; i++) {
    const pool = [...STARTERS];
    const pick = () => pool.splice(rng.int(0, pool.length - 1), 1)[0];
    const teams = [
      [pick(), pick(), pick()],
      [pick(), pick(), pick()],
    ] as const;
    const { state } = simulateBattle([[...teams[0]], [...teams[1]]], i);
    if (state.phase.kind !== 'over' || state.phase.winner === 'draw') continue;
    const winner = state.phase.winner;
    const typesOf = (side: 0 | 1) => new Set(teams[side].flatMap((c) => c.types));
    const sides = [typesOf(0), typesOf(1)];
    for (const t of TYPES) {
      const on = [sides[0].has(t), sides[1].has(t)];
      if (on[0] === on[1]) continue;
      const tally = typeTally.get(t)!;
      tally.played++;
      if (on[winner]) tally.won++;
    }
    teams.forEach((team, side) =>
      team.forEach((c) => {
        const tally = creatureTally.get(c.name)!;
        tally.played++;
        if (side === winner) tally.won++;
      }),
    );
  }

  const pct = (t: { won: number; played: number }) => Math.round((100 * t.won) / t.played);
  console.table(Object.fromEntries([...typeTally].map(([t, v]) => [t, `${pct(v)}%`])));
  console.table(Object.fromEntries([...creatureTally].map(([c, v]) => [c, `${pct(v)}%`])));
  for (const [t, tally] of typeTally) {
    expect(tally.won / tally.played, `${t} win rate`).toBeLessThanOrEqual(0.6);
  }
});
