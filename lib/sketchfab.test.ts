import { describe, expect, it } from 'vitest';
import {
  SKETCHFAB_SCRIPT,
  SKETCHFAB_VERSION,
  canPreloadModels,
  readProgress,
  viewerDeviceOptions,
  whenIdle,
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

describe('SKETCHFAB_SCRIPT', () => {
  it('loads the pinned viewer from Sketchfab, not an unversioned URL', () => {
    expect(SKETCHFAB_SCRIPT).toBe(
      `https://static.sketchfab.com/api/sketchfab-viewer-${SKETCHFAB_VERSION}.js`,
    );
  });
});

describe('whenIdle', () => {
  it('uses requestIdleCallback when the browser provides it', () => {
    const calls: Array<{ timeout?: number }> = [];
    const cancelled: number[] = [];
    const runtime = {
      requestIdleCallback: (
        callback: () => void,
        options?: { timeout: number },
      ) => {
        calls.push(options ?? {});
        callback();
        return 7;
      },
      cancelIdleCallback: (handle: number) => {
        cancelled.push(handle);
      },
      setTimeout: () => {
        throw new Error('setTimeout should not run when idle callback exists');
      },
      clearTimeout: () => undefined,
    };

    const cancel = whenIdle(() => undefined, runtime);
    cancel();

    expect(calls).toEqual([{ timeout: 2500 }]);
    expect(cancelled).toEqual([7]);
  });

  it('falls back to a timeout when requestIdleCallback is missing', () => {
    const timeouts: number[] = [];
    const cleared: number[] = [];
    const runtime = {
      setTimeout: (callback: () => void, ms: number) => {
        timeouts.push(ms);
        callback();
        return 11;
      },
      clearTimeout: (handle: number) => {
        cleared.push(handle);
      },
    };

    const cancel = whenIdle(() => undefined, runtime);
    cancel();

    expect(timeouts).toEqual([1200]);
    expect(cleared).toEqual([11]);
  });
});
