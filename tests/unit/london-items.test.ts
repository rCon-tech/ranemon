import { describe, expect, it } from 'vitest';
import { lineOf } from '@/lib/battle/evolutions';
import { LONDON_ITEM_EVOLUTIONS, LONDON_LINES } from '@/lib/battle/london';
import { validateTeam } from '@/lib/online/rules';
import { holdItemsFor } from '@/lib/ui/battle-mode';
import { canUseOn, heldBoost, holdOf, holdsItem, itemById, type ItemId } from '@/lib/story/items';
import { makeMember } from '@/lib/story/party';
import { parseSave } from '@/lib/story/save';
import { give, holdItem, newGame, takeHeld } from '@/lib/story/state';

/** The things given out in Shoreditch & Hackney: one for each of Wickmon's branches. */
const LONDON_ITEMS = LONDON_ITEM_EVOLUTIONS.map((e) => e.item as ItemId);

/** Who can be given each one, by London line. */
const takers = (item: ItemId) =>
  LONDON_LINES.filter((line) => canUseOn(itemById(item), makeMember(line, 12, 1)));

describe('London’s items, spread across London’s Ranemon', () => {
  it('each still evolves Wickmon into its own branch', () => {
    for (const e of LONDON_ITEM_EVOLUTIONS) {
      const wick = makeMember('wickmon', 12, 1);
      const item = itemById(e.item as ItemId);
      expect(canUseOn(item, wick)).toBe(true);
      expect(holdsItem(item, 'wickmon')).toBe(false);
    }
  });

  it('each can also be held by one other London line, a different one each', () => {
    const lines = LONDON_ITEMS.map((id) => takers(id).filter((l) => l !== 'wickmon'));
    for (const l of lines) expect(l).toHaveLength(1);
    expect(new Set(lines.flat()).size).toBe(LONDON_ITEMS.length);
    expect(lines.flat()).not.toContain('wickmon');
  });

  it('spreads them out: Wickmon is no longer the only one that gets anything from them', () => {
    const counts = new Map<string, number>();
    for (const id of LONDON_ITEMS)
      for (const line of takers(id)) counts.set(line, (counts.get(line) ?? 0) + 1);
    const others = [...counts].filter(([line]) => line !== 'wickmon');
    expect(others.length).toBeGreaterThanOrEqual(LONDON_ITEMS.length);
    expect(others.every(([, n]) => n === 1)).toBe(true);
  });

  it('boosts the line holding it, its evolved forms too, and nobody else', () => {
    for (const id of LONDON_ITEMS) {
      const hold = holdOf(itemById(id).use)!;
      const line = hold.line!;
      const evolved = makeMember(line, 60, 1);
      expect(lineOf(evolved.species)).toBe(line);
      expect(heldBoost({ species: evolved.species, held: id })).toEqual({
        [hold.stat]: hold.factor,
      });
      expect(holdsItem(itemById(id), evolved.species)).toBe(true);
      expect(heldBoost({ species: 'wickmon', held: id })).toBeUndefined();
      expect(heldBoost({ species: 'killemon', held: id })).toBeUndefined();
      expect(canUseOn(itemById(id), makeMember('killemon', 30, 1))).toBe(false);
      expect(holdItemsFor(evolved.species).map((i) => i.id)).toContain(id);
    }
  });

  it('is held, given back, and kept in a save like any other held item', () => {
    const line = holdOf(itemById('hardware-wallet').use)!.line!;
    let s = give({ ...newGame(), party: [makeMember(line, 12, 1)] }, 'hardware-wallet');
    s = holdItem(s, 0, 'hardware-wallet');
    expect(s.party[0].held).toBe('hardware-wallet');
    expect(s.bag['hardware-wallet'] ?? 0).toBe(0);
    const loaded = parseSave(JSON.stringify(s))!;
    expect(loaded.party[0].held).toBe('hardware-wallet');
    expect(takeHeld(loaded, 0).bag['hardware-wallet']).toBe(1);
  });

  it('can be held in a friend battle team', () => {
    const line = holdOf(itemById('afterparty-wristband').use)!.line!;
    const member = makeMember(line, 50, 1);
    const team = validateTeam([{ ...member, held: 'afterparty-wristband' }]);
    expect(team).toEqual({ team: [expect.objectContaining({ held: 'afterparty-wristband' })] });
  });
});
