import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PintDrink, pintStage } from '@/components/PintDrink';
import { startBattle } from '@/lib/battle/engine';
import { creatureById } from '@/lib/battle/roster';
import { lineCues } from '@/lib/sound/cues';
import { reduce, startSession, type Session } from '@/lib/ui/session';

/** Every line shown from throwing a Perfect Pour at a wild Endamon until the battle ends. */
function catchLines() {
  const c = creatureById('enda');
  let s: Session = startSession(startBattle([[c], [{ creature: c, level: 3 }]], 2), 'easy', {
    foe: { kind: 'wild' },
    timer: false,
  });
  for (let i = 0; i < 50 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
  s = reduce(s, {
    type: 'pint',
    pint: { name: 'Perfect Pour', multiplier: Infinity },
    rate: 120,
    random: 1,
  });
  const lines: string[] = [];
  for (let i = 0; i < 50 && s.mode === 'playing'; i++) {
    s = reduce(s, { type: 'step', random: i });
    if (lines.at(-1) !== s.message) lines.push(s.message);
  }
  return { lines, result: s.result };
}

describe('drinking the pint when a Ranemon joins you', () => {
  it('knocks back the last of it before the Gotcha', () => {
    const { lines, result } = catchLines();
    expect(result).toBe('caught');
    expect(lines).toEqual([
      'You threw a Perfect Pour!',
      'Sip…',
      'Sip… sip…',
      'Sip… sip… sip…',
      'Endamon tipped it back… glug, glug, glug!',
      expect.stringMatching(/^Gotcha! Endamon finished the pint/),
    ]);
  });

  it('follows the pint from each line', () => {
    expect(pintStage('You threw a Pint of Guinness!')).toEqual({ kind: 'thrown' });
    expect(pintStage('Sip…')).toEqual({ kind: 'sip', sips: 1 });
    expect(pintStage('Sip… sip… sip…')).toEqual({ kind: 'sip', sips: 3 });
    expect(pintStage('Enda tipped it back… glug, glug, glug!')).toEqual({ kind: 'downed' });
    expect(pintStage('Gotcha! Enda finished the pint and joined you!')).toEqual({
      kind: 'empty',
    });
    expect(pintStage('Aww! It only took one sip!')).toEqual({ kind: 'pushed', sips: 1 });
    expect(pintStage('Enda used Tackle!')).toBeNull();
  });

  it('draws the glass, with GLUGs while it goes down', () => {
    const html = renderToStaticMarkup(createElement(PintDrink, { stage: { kind: 'downed' } }));
    expect(html).toContain('data-testid="pint-drink"');
    expect(html).toContain('pint-downed');
    expect(html.match(/pint-glug /g)).toHaveLength(3);
  });

  it('glugs three times', () => {
    expect(lineCues('Enda tipped it back… glug, glug, glug!')).toHaveLength(3);
  });
});
