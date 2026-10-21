import { describe, expect, it } from 'vitest';
import { MAX_STAGE, startBattle } from '@/lib/battle/engine';
import { canUse, canUseOn, ITEMS, shopStock } from '@/lib/story/items';
import { makeMember } from '@/lib/story/party';
import { reduce, startSession, type Session } from '@/lib/ui/session';
import { STARTERS } from '../fixtures/placeholders';

const VAPES = ITEMS.filter((i) => i.use.kind === 'vape');

function untilInput(s: Session): Session {
  for (let i = 0; i < 500 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
  return s;
}

describe('vapes', () => {
  it('are sold in the Vapes shop from Limerick on, one for each battle stat', () => {
    expect(VAPES.map((v) => v.name)).toContain('Watermelon Ice');
    expect(shopStock(0).some((i) => i.use.kind === 'vape')).toBe(false);
    expect(shopStock(1).filter((i) => i.use.kind === 'vape')).toHaveLength(VAPES.length);
    const stats = VAPES.map((v) => (v.use.kind === 'vape' ? v.use.effect.stat : null)).sort();
    expect(stats).toEqual(['attack', 'defense', 'speed', 'spirit']);
  });

  it('can’t be used outside battle, or on a Ranemon that isn’t out', () => {
    const m = makeMember('enda', 20, 1);
    const stages = { attack: 0, defense: 0, spirit: 0, speed: 0 };
    for (const v of VAPES) {
      expect(canUseOn(v, m), v.id).toBe(false);
      const t = { hp: 10, maxHp: 50, status: null, level: 20, stages };
      expect(canUse(v.use, { ...t, active: false })).toBe(false);
      expect(canUse(v.use, { ...t, active: true })).toBe(true);
      expect(canUse(v.use, { ...t, hp: 0, active: true })).toBe(false);
    }
    const ice = VAPES.find((v) => v.id === 'watermelon-ice')!;
    const maxed = { ...stages, defense: MAX_STAGE };
    expect(
      canUse(ice.use, { hp: 10, maxHp: 50, status: null, level: 20, active: true, stages: maxed }),
    ).toBe(false);
  });

  it('raises the stat in battle, a stage at a time, up to the cap', () => {
    const ice = VAPES.find((v) => v.id === 'watermelon-ice')!;
    if (ice.use.kind !== 'vape') throw new Error('not a vape');
    let s = untilInput(
      startSession(startBattle([STARTERS.slice(0, 3), STARTERS.slice(3, 6)] as never, 3), 'easy'),
    );
    const active = s.view[0].active;
    s = reduce(s, {
      type: 'item',
      name: ice.name,
      effect: ice.use.effect,
      target: active,
      random: 1,
    });
    expect(s.state.teams[0].battlers[active].stages.defense).toBe(1);
    expect(s.queue.some((q) => 'text' in q && /DEFENSE rose!/.test(String(q.text)))).toBe(true);
    for (let i = 0; i < 5; i++) {
      s = untilInput(s);
      if (s.mode !== 'menu') break;
      s = reduce(s, {
        type: 'item',
        name: ice.name,
        effect: ice.use.effect,
        target: active,
        random: i + 2,
      });
    }
    expect(s.state.teams[0].battlers[active].stages.defense).toBeLessThanOrEqual(MAX_STAGE);
  });
});
