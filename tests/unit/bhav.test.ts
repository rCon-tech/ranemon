import { describe, expect, it } from 'vitest';
import { BEAT_BHAV, BHAV_REWARD, BHAV_TRAINER, GREYSTONES } from '@/content/story/greystones';
import { INTERIORS, isFlat } from '@/content/story/maps';
import { skinById, unlockSkins } from '@/content/story/skins';
import { trainerById } from '@/content/story/trainers';
import { STYLES } from '@/components/story/people';
import { playTurn, startBattle, type Entrant } from '@/lib/battle/engine';
import { moveById } from '@/lib/battle/moves';
import { canUseOn, heldBoost, heldCalm, itemById } from '@/lib/story/items';
import { makeMember, toEntrant } from '@/lib/story/party';
import { newGame } from '@/lib/story/state';
import { npcsOf, type Step } from '@/lib/story/world';

/** Every line said and item given in a script, taking `if`s by `flags` and answering yes. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'give') out.push(`GIVE ${s.item}`);
    else if (s.do === 'battle') out.push(`BATTLE ${s.trainer}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

const cafe = () => INTERIORS.find((m) => m.name === 'The Happy Pear, Greystones')!;
const bhav = () => npcsOf(cafe()).find((n) => n.item.look === 'bhav')!;

describe('Dr Bhav, in the Happy Pear', () => {
  it('sits at a table in the café, a room of Greystones, in 2D', () => {
    expect(cafe()).toBeDefined();
    expect(bhav()).toBeDefined();
    expect(npcsOf(cafe())).toHaveLength(2);
    expect(GREYSTONES.flat).toBe(true);
    expect(isFlat(cafe())).toBe(true);
  });

  it('hates Ranemon, then battles you if you say yes', () => {
    const said = play(bhav().item.talk!, new Set());
    expect(said.join(' ')).toMatch(/doctor/i);
    expect(said.join(' ')).toMatch(/stupid/i);
    expect(said.at(-1)).toBe(`BATTLE ${BHAV_TRAINER}`);
  });

  it('admits she is a big idiot and gives you Xanax when she loses', () => {
    const t = trainerById(BHAV_TRAINER);
    expect(t.ai).toBe('hard');
    const said = play(BHAV_REWARD, new Set());
    expect(said.join(' ')).toContain('I’m a big idiot. Ranemon is AMAZING.');
    expect(said).toContain('GIVE xanax');
  });

  it('only says nice things once she is beaten', () => {
    const said = play(bhav().item.talk!, new Set([BEAT_BHAV]));
    expect(said).toHaveLength(1);
    expect(said.join(' ')).not.toContain('BATTLE');
  });

  it('gives you her skin, drawn in her dress and round shades', () => {
    const skin = skinById('bhav')!;
    expect(skin.unlock).toEqual([BEAT_BHAV]);
    const { state, lines } = unlockSkins({ ...newGame(), flags: [BEAT_BHAV] });
    expect(state.skins).toContain('bhav');
    expect(lines.join(' ')).toContain('Dr Bhav');
    expect(STYLES.bhav.maxi).toBeDefined();
    expect(STYLES.bhav.glasses).toBe('round');
    expect(STYLES.bhav.hairStyle).toBe('long');
  });
});

describe('Xanax', () => {
  const xanax = itemById('xanax');
  const holding = { ...makeMember('killemon', 50, 1), held: 'xanax' as const };

  it('is held, never sold, and any Ranemon can hold it', () => {
    expect(xanax.price).toBeNull();
    expect(xanax.use.kind).toBe('hold');
    expect(canUseOn(xanax, makeMember('killemon', 30, 1))).toBe(true);
    expect(canUseOn(xanax, makeMember('conemon', 30, 1))).toBe(true);
  });

  it('keeps the holder chill: Spirit up 20%, and calm in battle', () => {
    expect(heldBoost(holding)).toEqual({ spirit: 1.2 });
    expect(heldCalm(holding)).toBe(true);
    expect(heldCalm(makeMember('killemon', 50, 1))).toBe(false);
    expect(heldCalm({ ...makeMember('conemon', 50, 1), held: 'vegan-stone' })).toBe(false);
    expect(toEntrant(holding).calm).toBe(true);
  });

  it('means it can’t be Flustered', () => {
    const stir = moveById('stir-the-pot');
    const foe = makeMember('steadmon', 50, 2);
    const stirrer: Entrant = {
      ...toEntrant(foe),
      creature: { ...toEntrant(foe).creature, moves: [stir.id] },
      pp: [stir.pp],
    };
    const flustered = (me: Entrant) => {
      // Stir the Pot misses a quarter of the time, so try a few seeds.
      for (let seed = 1; seed < 40; seed++) {
        const { state } = startBattle([[me], [stirrer]], seed);
        const after = playTurn(state, [{ kind: 'pass' }, { kind: 'move', index: 0 }]);
        if (after.state.teams[0].battlers[0].status === 'flustered') return true;
      }
      return false;
    };
    expect(flustered(toEntrant(makeMember('killemon', 50, 1)))).toBe(true);
    expect(flustered(toEntrant(holding))).toBe(false);
  });
});
