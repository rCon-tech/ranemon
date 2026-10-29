import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  KANE,
  KANE_GATE,
  KANE_HOME,
  KANE_LEVEL,
  KANE_TEXT,
  WEMBLEY_WAY,
  WEMBLEY_WAY_ID,
} from '@/content/story/kane';
import { CHAMPION, RAILCARD } from '@/content/story/kneecap';
import { mapById, mapFor } from '@/content/story/maps';
import { PL_TRAINERS } from '@/content/story/premier';
import { METROPOLITAN, WEMBLEY_ID } from '@/content/story/sidemen';
import { trainerById } from '@/content/story/trainers';
import { KANE_ID, KANEMON } from '@/lib/battle/kane';
import { megaForm } from '@/lib/battle/mega';
import { MEGA_RING } from '@/lib/story/keys';
import { makeMember, speciesById } from '@/lib/story/party';
import { canMega, newGame } from '@/lib/story/state';
import { UK_DEX } from '@/lib/story/ukdex';
import type { Step } from '@/lib/story/world';

/** Plays a script against `flags`, saying yes to every question, and returns what was said and done. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map}`);
    else if (s.do === 'recruit') out.push(`RECRUIT ${s.species} ${s.level}`);
    else if (s.do === 'give') out.push(`GIVE ${s.item}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

describe('the way to Harry Kane', () => {
  it('opens once you’re Champion, with a gift from every one of the twelve legends', () => {
    expect(KANE_GATE).toBe(CHAMPION);
    for (const t of PL_TRAINERS) {
      const gifts = play(t.reward!, new Set()).filter((l) => l.startsWith('GIVE'));
      const keys = t.reward!.filter(
        (s) => s.do === 'flag' && (s.flag.startsWith('item:') || s.flag === RAILCARD),
      );
      expect(gifts.length + keys.length, t.id).toBeGreaterThan(0);
    }
    // Roy Keane's win makes you Champion, and Jamie texts you about Kane.
    const flags = new Set<string>();
    const said = play(PL_TRAINERS.at(-1)!.reward!, flags);
    expect(flags.has(CHAMPION)).toBe(true);
    expect(said).toContain((KANE_TEXT[0] as { text: string }).text);
  });

  it('runs the Metropolitan line for the Champion, Sidemen or not', () => {
    expect(play(METROPOLITAN.talk!, new Set())).not.toContain(`TRAVEL ${WEMBLEY_ID}`);
    expect(play(METROPOLITAN.talk!, new Set([CHAMPION]))).toContain(`TRAVEL ${WEMBLEY_ID}`);
  });

  it('opens Wembley Park out east onto Wembley Way, 2D only, once you’re Champion', () => {
    expect(mapById(WEMBLEY_ID).east).toBeUndefined();
    expect(mapFor(WEMBLEY_ID, [CHAMPION]).east).toBe(WEMBLEY_WAY_ID);
    expect(WEMBLEY_WAY.west).toBe(WEMBLEY_ID);
    expect(WEMBLEY_WAY.flat).toBe(true);
    expect(WEMBLEY_WAY.uk).toBe(true);
    const kane = WEMBLEY_WAY.npcs.find((n) => n.trainer === KANE.id)!;
    expect(kane.hideIf).toBe(KANE_HOME);
  });
});

describe('Harry Kane', () => {
  it('fights with his Kanemon, which Mega evolves', () => {
    expect(trainerById(KANE.id)).toBe(KANE);
    expect(KANE.team).toEqual([[KANE_ID, KANE_LEVEL]]);
    expect(KANE.mega).toBe(KANE_ID);
    expect(KANE.ai).toBe('hard');
  });

  it('comes back to England and joins you when you beat him', () => {
    const flags = new Set<string>();
    const done = play(KANE.reward!, flags);
    expect(flags.has(KANE_HOME)).toBe(true);
    expect(done).toContain(`RECRUIT ${KANE_ID} ${KANE_LEVEL}`);
  });

  it('Mega evolves into Ballan d’Or: gold, and stronger than any Ranemon you can have', () => {
    const c = speciesById(KANE_ID);
    const m = megaForm(c)!;
    expect(m.name).toBe('Ballan d’Or');
    expect(m.types).toContain('posh');
    const total = (b: object) => Object.values(b).reduce((a: number, n: number) => a + n, 0);
    expect(total(c.base)).toBe(500);
    expect(total(m.base)).toBe(600);
    expect(m.sprite).toBe('/sprites/premier/mega/kanemon.png');
    for (const s of [c.sprite!, m.sprite!])
      for (const p of [s, s.replace('/sprites/', '/sprites/shiny/')])
        expect(existsSync(resolve('public', `.${p}`)), p).toBe(true);
  });

  it('brings his own Ballon d’Or, so he can Mega evolve for you without a Mega Ring', () => {
    const g = newGame();
    expect(canMega(g, makeMember(KANE_ID, 56, 1))).toBe(true);
    expect(canMega(g, makeMember('carlmon', 56, 2))).toBe(false);
    expect(canMega({ ...g, flags: [MEGA_RING] }, makeMember('carlmon', 56, 2))).toBe(true);
  });

  it('is last in the UK Ranedex', () => {
    expect(UK_DEX.at(-1)).toBe(KANEMON);
  });
});
