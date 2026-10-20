import { describe, expect, it } from 'vitest';
import { isWord } from '@/components/Gate';

describe('password', () => {
  it('lets in Ranelads in any case, and nothing else', async () => {
    expect(await isWord('Ranelads')).toBe(true);
    expect(await isWord('  RANELADS ')).toBe(true);
    expect(await isWord('ranelad')).toBe(false);
    expect(await isWord('')).toBe(false);
  });
});
