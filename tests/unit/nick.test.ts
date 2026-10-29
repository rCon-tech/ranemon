import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BEAT_NICK, NICK_REWARD, NICK_TRAINER } from '@/content/story/nick';
import { MAPS, isFlat, mapById } from '@/content/story/maps';
import { skinById, unlockSkins } from '@/content/story/skins';
import { trainerById } from '@/content/story/trainers';
import { STYLES } from '@/components/story/people';
import { hasSpecialEffect } from '@/components/SpecialEffect';
import { DEX, evolutionOf, formById } from '@/lib/battle/evolutions';
import { moveById } from '@/lib/battle/moves';
import { creatureById } from '@/lib/battle/roster';
import { secondSpecialOf } from '@/lib/battle/second-specials';
import { hasUkForm, ukSprite } from '@/lib/battle/uk';
import { UK_DEX } from '@/lib/story/ukdex';
import { makeMember } from '@/lib/story/party';
import { newGame } from '@/lib/story/state';
import { npcsOf, type Step } from '@/lib/story/world';

/** Every line said and battle started in a script, taking `if`s by `flags` and answering yes. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'battle') out.push(`BATTLE ${s.trainer}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

const clare = () => mapById('clare');
const nick = () => npcsOf(clare()).find((n) => n.item.look === 'nick')!;

describe('Nick, in Clare', () => {
  it('stands in Co. Clare, which is 2D only', () => {
    expect(nick()).toBeDefined();
    expect(isFlat(clare())).toBe(true);
  });

  it('is the second most French man in Ireland, and battles you if you say yes', () => {
    const said = play(nick().item.talk!, new Set()).join(' ');
    expect(said).toContain('second most French man in Ireland');
    expect(said).toContain('Wait until you meet my brother');
    expect(said).toMatch(new RegExp(`BATTLE ${NICK_TRAINER}$`));
  });

  it('has Nickamon on his team', () => {
    expect(trainerById(NICK_TRAINER).team.map(([s]) => s)).toContain('nickamon');
  });

  it('only talks once he is beaten', () => {
    const said = play(nick().item.talk!, new Set([BEAT_NICK]));
    expect(said.join(' ')).not.toContain('BATTLE');
    expect(play(NICK_REWARD, new Set()).join(' ')).toContain('brother');
  });

  it('gives you his skin when you beat him', () => {
    expect(skinById('nick')!.unlock).toEqual([BEAT_NICK]);
    const { state, lines } = unlockSkins({ ...newGame(), flags: [BEAT_NICK] });
    expect(state.skins).toContain('nick');
    expect(lines.join(' ')).toContain('Nick');
    expect(STYLES.nick.beard).toBeDefined();
    expect(STYLES.nick.bag).toBeDefined();
  });
});

describe('Nickamon', () => {
  it('joins the lads with his own move, a second at 36, and evolves into Nickoking', () => {
    const c = creatureById('nickamon');
    expect(moveById(c.moves[0]).signature).toBe('nickamon');
    expect(hasSpecialEffect(c.moves[0])).toBe(true);
    expect(secondSpecialOf('nickamon')?.id).toBe('wait-till-you-meet-my-brother');
    expect(evolutionOf('nickamon')?.id).toBe('nickoking');
    expect(makeMember('nickamon', 31, 1).species).toBe('nickoking');
    expect(formById('nickoking').types).toEqual(c.types);
    expect(DEX.map((d) => d.id)).toEqual(expect.arrayContaining(['nickamon', 'nickoking']));
  });

  it('is cut from his photo at home, and drawn over in Britain', () => {
    for (const id of ['nickamon', 'nickoking']) {
      expect(existsSync(`public${formById(id).sprite}`)).toBe(true);
      expect(hasUkForm(id)).toBe(true);
      expect(existsSync(`public${ukSprite(id)}`)).toBe(true);
      expect(UK_DEX.some((d) => d.id === id)).toBe(true);
    }
  });

  it('can be met in the wild in Clare', () => {
    expect(MAPS.find((m) => m.id === 'clare')!.wild!.table.some(([s]) => s === 'nickamon')).toBe(
      true,
    );
  });
});
