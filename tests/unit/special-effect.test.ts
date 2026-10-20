import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hasSpecialEffect, SpecialEffect } from '@/components/SpecialEffect';
import { SPECIAL_MOVES } from '@/lib/battle/moves';

describe('special move scenes', () => {
  it.each(SPECIAL_MOVES.map((m) => [m.name, m.id]))('%s has its own scene', (_, id) => {
    expect(hasSpecialEffect(id)).toBe(true);
    for (const user of [0, 1] as const) {
      const svg = renderToStaticMarkup(createElement(SpecialEffect, { moveId: id, user }));
      expect(svg).toContain(`data-move="${id}"`);
      expect(svg).not.toMatch(/NaN|undefined/);
    }
  });

  it('leaves ordinary moves to the type effects', () => {
    expect(hasSpecialEffect('mosh-pit')).toBe(false);
  });
});
