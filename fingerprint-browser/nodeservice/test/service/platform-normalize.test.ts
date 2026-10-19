import { describe, expect, it } from 'vitest';
import { normalizePlatformCode, Platforms } from '@/service/datasync-service-manager';

describe('platform code normalization', () => {
  it.each(['RedNote', 'rednote', 'REDNOTE', '小红书海外版', 'RedNote（小红书海外版）'])(
    'normalizes %s to the RedNote worker code',
    (platform) => {
      expect(normalizePlatformCode(platform)).toBe(Platforms.RedNote);
    },
  );

  it('extracts RedNote from third-party platform objects and arrays', () => {
    expect(normalizePlatformCode({ platformCode: 'RedNote' })).toBe(Platforms.RedNote);
    expect(normalizePlatformCode([{ platformCode: 'RedNote' }])).toBe(Platforms.RedNote);
  });
});
