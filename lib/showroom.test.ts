import { describe, expect, it } from 'vitest';
import {
  MAX_LIVE_VIEWERS,
  bumpViewerAttempt,
  canStartBackgroundPreload,
  dropViewerState,
  mergeViewerStatus,
  nextVehicleToPreloadIfRoom,
  pickerOverflowEdges,
  pickerScrollDelta,
  preloadViewer,
  rememberShownVehicle,
  resetViewerProgress,
  retryViewer,
  viewerInstanceKey,
  viewerIsBusy,
} from '@/lib/showroom';
import { TESLA_FLEET_IDS, vehicles } from '@/lib/vehicles';

describe('rememberShownVehicle', () => {
  it('moves the visible car to the end without duplicating it', () => {
    expect(rememberShownVehicle(['corvette', 'bmw'], 'corvette')).toEqual([
      'bmw',
      'corvette',
    ]);
  });

  it('drops the car shown longest ago once the viewer cap is hit', () => {
    expect(
      rememberShownVehicle(['corvette', 'bmw', 'tesla'], 'model-y'),
    ).toEqual(['bmw', 'tesla', 'model-y']);
    expect(
      rememberShownVehicle(['corvette', 'bmw', 'tesla'], 'model-y'),
    ).toHaveLength(MAX_LIVE_VIEWERS);
  });

  it('leaves the list unchanged when the visible car is already last', () => {
    const mounted = ['bmw', 'tesla'];
    expect(rememberShownVehicle(mounted, 'tesla')).toBe(mounted);
  });

  it('moves a cached middle car to the end without growing the list', () => {
    expect(rememberShownVehicle(['corvette', 'bmw', 'tesla'], 'bmw')).toEqual([
      'corvette',
      'tesla',
      'bmw',
    ]);
  });

  it('treats a previously dropped car as a fresh load when it is shown again', () => {
    const afterFourth = rememberShownVehicle(
      ['corvette', 'bmw', 'tesla'],
      'model-y',
    );
    expect(afterFourth).toEqual(['bmw', 'tesla', 'model-y']);
    expect(rememberShownVehicle(afterFourth, 'corvette')).toEqual([
      'tesla',
      'model-y',
      'corvette',
    ]);
  });
});

describe('preloadViewer', () => {
  it('inserts a new car before the visible one while a slot is free', () => {
    expect(preloadViewer(['corvette'], 'bmw')).toEqual(['bmw', 'corvette']);
    expect(preloadViewer(['bmw', 'corvette'], 'tesla')).toEqual([
      'bmw',
      'tesla',
      'corvette',
    ]);
  });

  it('does not evict a car the visitor has already looked at', () => {
    expect(preloadViewer(['corvette', 'bmw', 'tesla'], 'model-y')).toEqual([
      'corvette',
      'bmw',
      'tesla',
    ]);
  });

  it('ignores a car that is already cached', () => {
    expect(preloadViewer(['corvette', 'bmw'], 'corvette')).toEqual([
      'corvette',
      'bmw',
    ]);
  });
});

describe('nextVehicleToPreloadIfRoom', () => {
  it('preloads the next car while a viewer slot is free', () => {
    expect(nextVehicleToPreloadIfRoom('corvette', ['corvette'])).toBe('bmw');
  });

  it('stops preloading once three viewers are live', () => {
    expect(
      nextVehicleToPreloadIfRoom('tesla', ['corvette', 'bmw', 'tesla']),
    ).toBeNull();
  });

  it('still walks the eight-car catalog when a viewer slot is free', () => {
    expect(
      nextVehicleToPreloadIfRoom('tesla', ['corvette', 'tesla'], 3, vehicles),
    ).toBe('model-y');
    expect(
      nextVehicleToPreloadIfRoom(
        TESLA_FLEET_IDS[TESLA_FLEET_IDS.length - 1],
        [TESLA_FLEET_IDS[TESLA_FLEET_IDS.length - 1]],
        3,
        vehicles,
      ),
    ).toBe('corvette');
  });
});

describe('pickerOverflowEdges', () => {
  it('fades neither edge when the row fits', () => {
    expect(
      pickerOverflowEdges({
        scrollLeft: 0,
        clientWidth: 400,
        scrollWidth: 400,
      }),
    ).toEqual({ start: false, end: false });
  });

  it('fades the end when more cars sit past the right edge', () => {
    expect(
      pickerOverflowEdges({
        scrollLeft: 0,
        clientWidth: 400,
        scrollWidth: 800,
      }),
    ).toEqual({ start: false, end: true });
  });

  it('fades both edges when the selected car is in the middle', () => {
    expect(
      pickerOverflowEdges({
        scrollLeft: 120,
        clientWidth: 400,
        scrollWidth: 800,
      }),
    ).toEqual({ start: true, end: true });
  });

  it('fades only the start when the row is scrolled to the last car', () => {
    expect(
      pickerOverflowEdges({
        scrollLeft: 400,
        clientWidth: 400,
        scrollWidth: 800,
      }),
    ).toEqual({ start: true, end: false });
  });
});

describe('pickerScrollDelta', () => {
  it('scrolls left when the selected car is clipped at the start', () => {
    expect(
      pickerScrollDelta({
        pickerLeft: 100,
        pickerRight: 500,
        itemLeft: 40,
        itemRight: 160,
      }),
    ).toBe(-60);
  });

  it('scrolls right when the selected car is clipped at the end', () => {
    expect(
      pickerScrollDelta({
        pickerLeft: 100,
        pickerRight: 500,
        itemLeft: 420,
        itemRight: 560,
      }),
    ).toBe(60);
  });

  it('does not scroll when the selected car is fully visible', () => {
    expect(
      pickerScrollDelta({
        pickerLeft: 100,
        pickerRight: 500,
        itemLeft: 180,
        itemRight: 300,
      }),
    ).toBe(0);
  });
});

describe('viewer cache status', () => {
  it('treats a newly mounted car as busy until Sketchfab reports ready', () => {
    expect(viewerIsBusy(['corvette', 'bmw'], { corvette: 'ready' })).toBe(true);
    expect(
      viewerIsBusy(['corvette', 'bmw'], { corvette: 'ready', bmw: 'ready' }),
    ).toBe(false);
  });

  it('keeps an erroring car from blocking background preload', () => {
    expect(
      viewerIsBusy(['corvette', 'bmw'], { corvette: 'ready', bmw: 'error' }),
    ).toBe(false);
  });

  it('skips a status update that would rerender with the same value', () => {
    const current = { tesla: 'ready' as const };
    expect(mergeViewerStatus(current, 'tesla', 'ready')).toBe(current);
    expect(mergeViewerStatus(current, 'tesla', 'error')).toEqual({
      tesla: 'error',
    });
  });

  it('resets a dropped viewer so it reloads from its still', () => {
    expect(
      dropViewerState(
        { corvette: 'ready', bmw: 'ready' },
        { corvette: 1, bmw: 0.4 },
        'bmw',
      ),
    ).toEqual({
      statuses: { corvette: 'ready', bmw: 'loading' },
      progress: { corvette: 1, bmw: 0 },
    });
  });

  it('remounts a failed viewer on retry so the old iframe cannot keep calling back', () => {
    const retried = retryViewer(
      { tesla: 'error' },
      { tesla: 0.2 },
      { tesla: 0 },
      'tesla',
    );
    expect(retried).toEqual({
      statuses: { tesla: 'loading' },
      progress: { tesla: 0 },
      attempts: { tesla: 1 },
    });
    expect(viewerInstanceKey('tesla', retried.attempts)).toBe('tesla-1');
    expect(viewerInstanceKey('tesla', {})).toBe('tesla-0');
    expect(bumpViewerAttempt(retried.attempts, 'tesla')).toEqual({ tesla: 2 });
    expect(resetViewerProgress(retried.progress, 'tesla')).toEqual({ tesla: 0 });
  });

  it('starts a background download only when the visible car is ready and a slot is free', () => {
    expect(
      canStartBackgroundPreload({
        busy: false,
        nextId: 'model-y',
        activeStatus: 'ready',
        allowed: true,
      }),
    ).toBe(true);
    expect(
      canStartBackgroundPreload({
        busy: true,
        nextId: 'model-y',
        activeStatus: 'ready',
        allowed: true,
      }),
    ).toBe(false);
    expect(
      canStartBackgroundPreload({
        busy: false,
        nextId: 'model-y',
        activeStatus: 'loading',
        allowed: true,
      }),
    ).toBe(false);
    expect(
      canStartBackgroundPreload({
        busy: false,
        nextId: null,
        activeStatus: 'ready',
        allowed: true,
      }),
    ).toBe(false);
    expect(
      canStartBackgroundPreload({
        busy: false,
        nextId: 'model-y',
        activeStatus: 'ready',
        allowed: false,
      }),
    ).toBe(false);
  });
});
