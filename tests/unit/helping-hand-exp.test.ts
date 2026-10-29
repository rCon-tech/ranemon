import { describe, expect, it } from 'vitest';
import { playTurn, startBattle, type Action } from '@/lib/battle/engine';
import { creatureById } from '@/lib/battle/roster';
import { toEntrant } from '@/lib/story/party';
import { newGame, recruit, settleBattle, type StoryState } from '@/lib/story/state';

/** A party of the given Ranemon at Lv6, Exp Share off so only the ones that fought earn. */
function partyOf(...ids: string[]): StoryState {
  let s = newGame();
  for (const id of ids) s = recruit(s, id, 6).state;
  return { ...s, expShare: false };
}

/** Oismon leads and uses Helping Hand on the first turn, then the foe is knocked out. */
function helpingHand(s: StoryState) {
  const foe = creatureById('enda');
  const { state: start } = startBattle([s.party.map(toEntrant), [{ creature: foe, level: 10 }]], 1);
  const hand: Action = {
    kind: 'move',
    index: start.teams[0].battlers[0].creature.moves.indexOf('helping-hand-ois'),
  };
  const { state, events } = playTurn(start, [hand, { kind: 'move', index: 0 }]);
  const won = structuredClone(state);
  won.teams[1].battlers[0].hp = 0;
  // What the battle screen records: the lead, then everyone sent out after it.
  const fought = [0];
  for (const e of events) {
    if (e.kind === 'send-out' && e.side === 0 && !fought.includes(e.index)) fought.push(e.index);
  }
  return { won, fought };
}

describe('Helping Hand and EXP', () => {
  it('gives the caller EXP for the foe its wild partner beat, and it goes home standing', () => {
    const s = partyOf('oismon', 'carlmon');
    const { won, fought } = helpingHand(s);
    expect(won.teams[0].battlers[0]).toMatchObject({ hp: 0, left: true });
    const { state } = settleBattle(s, won, 'win', fought, false);
    const ois = state.party[0];
    expect(ois.exp).toBeGreaterThan(s.party[0].exp);
    expect(ois.level).toBeGreaterThan(s.party[0].level);
    expect(ois.hp).toBeGreaterThanOrEqual(s.party[0].hp);
    // Carlmon never came out, so with Exp Share off it gets nothing.
    expect(state.party[1].exp).toBe(s.party[1].exp);
  });

  it('splits the EXP between both partners when the real one is tagged in', () => {
    const s = partyOf('oismon', 'carlmon', 'olliemon');
    const { won, fought } = helpingHand(s);
    expect(fought).toEqual([0, 2]);
    const { state } = settleBattle(s, won, 'win', fought, false);
    expect(state.party[0].exp).toBeGreaterThan(s.party[0].exp);
    expect(state.party[2].exp).toBeGreaterThan(s.party[2].exp);
    expect(state.party[1].exp).toBe(s.party[1].exp);
  });
});
