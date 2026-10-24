import { describe, expect, it } from 'vitest';
import { legalActions, startBattle } from '@/lib/battle/engine';
import { creatureById } from '@/lib/battle/roster';
import { STARTERS } from '../fixtures/placeholders';
import { applyEvent, describeEvent, viewOf } from '@/lib/ui/playback';
import { battleCues } from '@/lib/sound/cues';
import {
  EFFECT_MS,
  messagePause,
  reduce,
  SPECIAL_MS,
  startSession,
  TURN_SECONDS,
  type Session,
} from '@/lib/ui/session';

const teams = () => [STARTERS.slice(0, 3), STARTERS.slice(3, 6)] as [never, never];

function fresh(seed = 5): Session {
  return startSession(startBattle(teams(), seed), 'normal');
}

/** Steps through playback until the screen wants input from the player. */
function untilInput(s: Session): Session {
  for (let i = 0; i < 500 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
  return s;
}

describe('battle session', () => {
  it('plays the send-outs, then asks for a move', () => {
    const s = untilInput(fresh());
    expect(s.mode).toBe('menu');
    expect(s.view[0].shown && s.view[1].shown).toBe(true);
    expect(s.entries).toEqual([1, 1]);
    expect(s.message).toMatch(/^What will .+ do\?$/);
  });

  it('runs a whole battle to a result through the menu', () => {
    let s = untilInput(fresh(11));
    for (let turn = 0; turn < 200 && s.mode !== 'over'; turn++) {
      if (s.mode === 'forced-switch') {
        const to = s.state.teams[0].battlers.findIndex(
          (b, i) => b.hp > 0 && i !== s.state.teams[0].active,
        );
        s = reduce(s, { type: 'replace', to });
      } else {
        const move = legalActions(s.state, 0).find((a) => a.kind === 'move')!;
        s = reduce(s, { type: 'act', action: move, random: turn });
      }
      s = untilInput(s);
    }
    expect(s.mode).toBe('over');
    expect(s.result).not.toBeNull();
    expect(s.message).toMatch(/You (won|lost) the battle|draw/);
  });

  it('plays an attack’s animation on the target, and holds each line long enough to read', () => {
    let s = untilInput(fresh());
    // Prof Pip leads; Galaxy Brain is a damaging Brains move.
    s = reduce(s, { type: 'act', action: { kind: 'move', index: 0 }, random: 3 });
    for (let i = 0; i < 50 && !(s.effect && s.message.includes('Galaxy Brain')); i++) {
      s = reduce(s, { type: 'step', random: i });
    }
    expect(s.effect).toMatchObject({ side: 1, moveId: 'galaxy-brain' });
    expect(s.lunges[0]).toBe(1);
    expect(s.pause).toBe(messagePause(s.message));
    expect(s.pause).toBeGreaterThanOrEqual(2000);
  });

  it('plays the miss in place of a move’s animation when the move misses', () => {
    const ready = untilInput(fresh());
    let s: Session = {
      ...ready,
      mode: 'playing',
      queue: [
        { kind: 'move', side: 0, moveId: 'galaxy-brain' },
        { kind: 'miss', side: 0 },
      ],
    };
    s = reduce(s, { type: 'step', random: 0 });
    expect(s.message).toMatch(/used Galaxy Brain!$/);
    expect(s.effect).toBeNull();
    expect(s.lunges[0]).toBe(ready.lunges[0] + 1);
    expect(battleCues(s.last!, s.state, s.view, s.queue)).toEqual([]);
    s = reduce(s, { type: 'step', random: 0 });
    expect(s.message).toMatch(/attack missed!$/);
    expect(s.pause).toBeGreaterThanOrEqual(EFFECT_MS);
    expect(battleCues(s.last!, s.state, s.view, s.queue)).toEqual([{ sfx: 'miss' }]);
  });

  it('plays a special move’s own scene for as long as it runs', () => {
    const team = [creatureById('steadmon'), creatureById('enda')];
    const rivals = [creatureById('boydemon'), creatureById('gibbsmon')];
    let s = untilInput(startSession(startBattle([team, rivals], 3), 'normal'));
    // Steadmon leads with Ranelads.com.
    s = reduce(s, { type: 'act', action: { kind: 'move', index: 0 }, random: 3 });
    for (let i = 0; i < 50 && !(s.effect && s.message.includes('Ranelads')); i++) {
      s = reduce(s, { type: 'step', random: i });
    }
    expect(s.effect).toMatchObject({ user: 0, moveId: 'ranelads-com' });
    expect(s.pause).toBeGreaterThanOrEqual(SPECIAL_MS);
  });

  it('ignores moves while text is still playing', () => {
    const s = fresh();
    expect(reduce(s, { type: 'act', action: { kind: 'move', index: 0 }, random: 1 })).toBe(s);
  });

  it('uses a random move when the turn timer runs out', () => {
    let s = untilInput(fresh());
    for (let i = 0; i < TURN_SECONDS - 1; i++) s = reduce(s, { type: 'tick', random: i });
    expect(s.mode).toBe('menu');
    expect(s.timeLeft).toBe(1);
    s = reduce(s, { type: 'tick', random: 99 });
    expect(s.mode).toBe('playing');
    expect(s.queue.some((e) => e.kind === 'move' && e.side === 0)).toBe(true);
  });

  it('counts a forfeit as a loss', () => {
    const s = reduce(untilInput(fresh()), { type: 'forfeit' });
    expect(s).toMatchObject({ mode: 'over', result: 'loss' });
  });
});

describe('playback text', () => {
  it('names the foe’s creature with “Foe”', () => {
    const { state } = startBattle(teams(), 1);
    const view = viewOf(state);
    const foe = state.teams[1].battlers[0].creature.name;
    expect(describeEvent({ kind: 'move', side: 1, moveId: 'flex' }, state, view)).toBe(
      `Foe ${foe} used Flex!`,
    );
    expect(describeEvent({ kind: 'stat', side: 1, stat: 'attack', change: 2 }, state, view)).toBe(
      `Foe ${foe}’s Attack rose sharply!`,
    );
    expect(
      describeEvent(
        { kind: 'damage', side: 1, amount: 9, hp: 1, effectiveness: 1, crit: false },
        state,
        view,
      ),
    ).toBeNull();
  });

  it('moves HP and statuses in the view', () => {
    const { state } = startBattle(teams(), 1);
    let view = viewOf(state);
    view = applyEvent(view, {
      kind: 'damage',
      side: 0,
      amount: 10,
      hp: 50,
      effectiveness: 2,
      crit: false,
    });
    view = applyEvent(view, { kind: 'status', side: 0, status: 'hangry' });
    expect(view[0].hp[0]).toBe(50);
    expect(view[0].status[0]).toBe('hangry');
    view = applyEvent(view, { kind: 'faint', side: 0 });
    expect(view[0]).toMatchObject({ shown: false });
    view = applyEvent(view, { kind: 'send-out', side: 0, index: 2 });
    expect(view[0]).toMatchObject({ shown: true, active: 2 });
  });
});
