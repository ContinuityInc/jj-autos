import { describe, expect, it } from 'vitest';
import {
  canPreloadModels,
  readProgress,
  viewerDeviceOptions,
} from '@/lib/sketchfab';

describe('readProgress', () => {
  it('reads a bare number from Sketchfab', () => {
    expect(readProgress(0)).toBe(0);
    expect(readProgress(0.42)).toBe(0.42);
    expect(readProgress(1)).toBe(1);
  });

  it('reads { progress } events', () => {
    expect(readProgress({ progress: 0.25 })).toBe(0.25);
  });

  it('clamps values outside 0–1', () => {
    expect(readProgress(-0.5)).toBe(0);
    expect(readProgress(1.7)).toBe(1);
    expect(readProgress({ progress: 8 })).toBe(1);
  });

  it('ignores non-numeric payloads so a stalled load is not treated as progress', () => {
    expect(readProgress(undefined)).toBeUndefined();
    expect(readProgress(null)).toBeUndefined();
    expect(readProgress({})).toBeUndefined();
    expect(readProgress({ progress: '0.5' })).toBeUndefined();
    expect(readProgress(Number.NaN)).toBeUndefined();
    expect(readProgress(Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});

describe('canPreloadModels', () => {
  it('preloads other cars on a desktop connection', () => {
    expect(
      canPreloadModels({
        connection: { effectiveType: '4g' },
        isDesktop: true,
      }),
    ).toBe(true);
  });

  it('skips preload on phones even on a fast network', () => {
    expect(
      canPreloadModels({
        connection: { effectiveType: '4g' },
        isDesktop: false,
      }),
    ).toBe(false);
  });

  it('skips preload when the user asked to save data', () => {
    expect(
      canPreloadModels({
        connection: { saveData: true, effectiveType: '4g' },
        isDesktop: true,
      }),
    ).toBe(false);
  });

  it('skips preload on 2G and 3G', () => {
    expect(
      canPreloadModels({
        connection: { effectiveType: '2g' },
        isDesktop: true,
      }),
    ).toBe(false);
    expect(
      canPreloadModels({
        connection: { effectiveType: 'slow-2g' },
        isDesktop: true,
      }),
    ).toBe(false);
    expect(
      canPreloadModels({
        connection: { effectiveType: '3g' },
        isDesktop: true,
      }),
    ).toBe(false);
  });

  it('treats a missing connection API as a normal desktop session', () => {
    expect(canPreloadModels({ isDesktop: true })).toBe(true);
  });
});

describe('viewerDeviceOptions', () => {
  it('keeps autospin and full textures on desktop', () => {
    expect(viewerDeviceOptions(false, false)).toEqual({
      autospin: 0.06,
      max_texture_size: 2048,
    });
  });

  it('drops autospin when the visitor prefers reduced motion', () => {
    expect(viewerDeviceOptions(false, true).autospin).toBe(0);
  });

  it('caps texture size on phones so the first model can finish', () => {
    expect(viewerDeviceOptions(true, false).max_texture_size).toBe(1024);
  });
});
