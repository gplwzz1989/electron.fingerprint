import { convertCookie } from '@/utils';
import { Cookie } from 'electron';
import { describe, expect, it } from 'vitest';

describe('utils', () => {
  it('convertCookie', () => {
    const result = convertCookie([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ] as Cookie[]);

    expect(result).toBe('a=1; b=2');
  });
});
