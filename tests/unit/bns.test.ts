import { describe, expect, it } from 'vitest';
import { mapById } from '@/content/story/maps';
import { isPresent, npcsOf } from '@/lib/story/world';

const bns = npcsOf(mapById('trinity')).find((n) => n.item.trainer === 'bns')!;

describe('B&S under the Campanile', () => {
  it('are there from the moment you walk into Trinity', () => {
    expect(isPresent(bns.item, new Set(['jersey:all']))).toBe(true);
  });

  it('only fight once the last scholar is beaten, and tell you so', () => {
    expect(bns.item.readyIf).toBe('beat:scholar-3');
    expect(bns.item.talk?.[0]).toMatchObject({ text: expect.stringContaining('scholars') });
  });

  it('are gone once you are Champion', () => {
    expect(isPresent(bns.item, new Set(['champion']))).toBe(false);
  });
});
