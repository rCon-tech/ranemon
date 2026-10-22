import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InfoBox } from '@/components/InfoBox';
import { startBattle } from '@/lib/battle/engine';
import { creatureById } from '@/lib/battle/roster';
import { caughtBefore, newGame, recruit } from '@/lib/story/state';

const box = (caught?: boolean) => {
  const { state } = startBattle([[creatureById('enda')], [creatureById('carlmon')]], 1);
  const foe = state.teams[1].battlers[0];
  return renderToStaticMarkup(
    createElement(InfoBox, { battler: foe, hp: foe.hp, status: null, mine: false, caught }),
  );
};

describe('the pint by a wild Ranemon you have befriended before', () => {
  it('counts only kinds you have befriended', () => {
    const fresh = newGame();
    expect(caughtBefore(fresh, 'carlmon')).toBe(false);
    const after = recruit(fresh, 'carlmon', 5).state;
    expect(caughtBefore(after, 'carlmon')).toBe(true);
    expect(caughtBefore(after, 'enda')).toBe(false);
  });

  it('shows on the info box only when caught before', () => {
    expect(box(true)).toContain('data-testid="caught-pint"');
    expect(box(true)).toContain('aria-label="Befriended before"');
    expect(box(false)).not.toContain('caught-pint');
    expect(box()).not.toContain('caught-pint');
  });
});
