import { describe, expect, it } from 'vitest';
import { ITEMS, itemById, pocketOf, POCKETS, sellPrice } from '@/lib/story/items';
import { give, newGame, sell } from '@/lib/story/state';

describe('the bag', () => {
  it('puts every item in one pocket', () => {
    const pockets = new Set(POCKETS.map((p) => p.id));
    for (const i of ITEMS) expect(pockets.has(pocketOf(i)), i.id).toBe(true);
    expect(pocketOf(itemById('pint'))).toBe('pints');
    expect(pocketOf(itemById('spice-bag'))).toBe('food');
    expect(pocketOf(itemById('hair-of-the-dog'))).toBe('food');
    expect(pocketOf(itemById('blue-razz'))).toBe('vapes');
    expect(pocketOf(itemById('blue-ghost'))).toBe('special');
    expect(pocketOf(itemById('vegan-stone'))).toBe('special');
  });
});

describe('selling', () => {
  it('pays half the shop price, and never for one-of-a-kind items', () => {
    expect(sellPrice('spice-bag')).toBe(350);
    expect(sellPrice('pint')).toBe(100);
    for (const i of ITEMS.filter((i) => i.price === null)) expect(sellPrice(i.id), i.id).toBeNull();
  });

  it('takes the items and adds the money', () => {
    const g = give({ ...newGame(), money: 0 }, 'spice-bag', 5);
    const after = sell(g, 'spice-bag', 3);
    expect(after.bag['spice-bag']).toBe(2);
    expect(after.money).toBe(1050);
    const all = sell(after, 'spice-bag', 2);
    expect(all.bag['spice-bag']).toBeUndefined();
    expect(all.money).toBe(1750);
  });

  it('only sells what you have, and nothing you can’t sell', () => {
    const g = give({ ...newGame(), money: 0 }, 'pint', 2);
    expect(sell(g, 'pint', 10)).toMatchObject({ money: 200, bag: {} });
    expect(sell(g, 'spice-bag', 1)).toBe(g);
    const stone = give(g, 'vegan-stone');
    expect(sell(stone, 'vegan-stone', 1)).toBe(stone);
  });
});
