import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formById } from '@/lib/battle/evolutions';
import { creatureById } from '@/lib/battle/roster';
import { rollVariant, variantForm, VARIANTS, variantsOf } from '@/lib/battle/variants';
import { creatureOf, evolutionIn, expAt, gainExp, makeMember, nameOf } from '@/lib/story/party';
import { shinySprite } from '@/lib/story/shiny';
import { parseSave } from '@/lib/story/save';
import { newGame, recruit } from '@/lib/story/state';

describe('variants', () => {
  it('give eleven of the lads a second look, through their evolutions', () => {
    expect(variantsOf('olliemon').map((v) => v.id)).toEqual(['tricolour']);
    expect(variantsOf('hitmonollie').map((v) => v.id)).toEqual(['tricolour']);
    expect(variantsOf('oismon').map((v) => v.id)).toEqual(['cap']);
    expect(variantsOf('hitmonois').map((v) => v.id)).toEqual(['cap']);
    expect(variantsOf('enda').map((v) => v.id)).toEqual(['wine']);
    expect(variantsOf('clefenda').map((v) => v.id)).toEqual(['wine']);
    expect(variantsOf('carlmon').map((v) => v.id)).toEqual(['tache']);
    expect(variantsOf('carlizard').map((v) => v.id)).toEqual(['tache']);
    expect(variantsOf('conemon').map((v) => v.id)).toEqual(['curls']);
    expect(variantsOf('conix').map((v) => v.id)).toEqual(['curls']);
    expect(variantsOf('boydemon').map((v) => v.id)).toEqual(['rugby']);
    expect(variantsOf('primeboyd').map((v) => v.id)).toEqual(['rugby']);
    expect(variantsOf('steadmon').map((v) => v.id)).toEqual(['suit']);
    expect(variantsOf('steadakazam').map((v) => v.id)).toEqual(['suit']);
    expect(variantsOf('gibbsmon').map((v) => v.id)).toEqual(['races']);
    expect(variantsOf('gyaragibbs').map((v) => v.id)).toEqual(['races']);
    expect(variantsOf('jammon').map((v) => v.id)).toEqual(['shades']);
    expect(variantsOf('jamchamp').map((v) => v.id)).toEqual(['shades']);
    expect(variantsOf('killemon').map((v) => v.id)).toEqual(['thumbs']);
    expect(variantsOf('killigatr').map((v) => v.id)).toEqual(['thumbs']);
    expect(variantsOf('owemon').map((v) => v.id)).toEqual(['dance']);
    expect(variantsOf('fearowe').map((v) => v.id)).toEqual(['dance']);
    expect(variantsOf('hugomon')).toEqual([]);
  });

  it('have every sprite on disk, with a follower head and a shiny version', () => {
    for (const v of Object.values(VARIANTS).flat()) {
      const mini = v.sprite.replace(/\/([^/]+)$/, '/mini/$1');
      for (const path of [v.sprite, mini, shinySprite(v.sprite), shinySprite(mini)])
        expect(existsSync(`public${path}`), path).toBe(true);
    }
  });

  it('are the same Ranemon: only the picture changes', () => {
    const plain = creatureById('olliemon');
    const look = variantForm(plain, 'tricolour');
    expect(look).toEqual({
      ...plain,
      variant: 'tricolour',
      sprite: '/sprites/bw/olliemon-tricolour.png',
      solid: true,
    });
    // An unknown look, or none, is the usual one.
    expect(variantForm(plain, 'gone')).toBe(plain);
    expect(variantForm(plain, undefined)).toBe(plain);
    expect(variantForm(creatureById('hugomon'), 'tricolour')).toBe(creatureById('hugomon'));
  });

  it('are as likely as the usual look in the wild', () => {
    expect(rollVariant('olliemon', 0)).toBeUndefined();
    expect(rollVariant('olliemon', 0.49)).toBeUndefined();
    expect(rollVariant('olliemon', 0.5)).toBe('tricolour');
    expect(rollVariant('olliemon', 0.999)).toBe('tricolour');
    expect(rollVariant('hugomon', 0.999)).toBeUndefined();
  });

  it('are kept when befriended, when evolving, in the evolution scene and in saves', () => {
    const s = recruit(newGame(), 'olliemon', 29, { variant: 'tricolour' }).state;
    const m = s.party[0];
    expect(creatureOf(m).sprite).toBe('/sprites/bw/olliemon-tricolour.png');
    expect(nameOf(m)).toBe('Olliemon');
    const { member, lines } = gainExp(m, expAt(30) - m.exp);
    expect(member.species).toBe('hitmonollie');
    expect(member.variant).toBe('tricolour');
    expect(creatureOf(member).sprite).toBe('/sprites/evo/hitmonollie-tricolour.png');
    const evolving = lines.find((l) => l.startsWith('What?'))!;
    const scene = evolutionIn(evolving, [member]);
    expect(scene?.from.sprite).toBe('/sprites/bw/olliemon-tricolour.png');
    expect(scene?.to.sprite).toBe('/sprites/evo/hitmonollie-tricolour.png');
    // Without a member of that line, it's the usual look.
    expect(evolutionIn(evolving, [])?.from.sprite).toBe(formById('olliemon').sprite);
    const loaded = parseSave(JSON.stringify({ ...s, party: [member] }));
    expect(loaded?.party[0].variant).toBe('tricolour');
  });

  it('a shiny of a variant is gold in that look', () => {
    const m = { ...makeMember('oismon', 10, 1), variant: 'cap', shiny: true };
    expect(creatureOf(m).sprite).toBe('/sprites/shiny/bw/oismon-cap.png');
  });
});
