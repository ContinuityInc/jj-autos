import { describe, expect, it } from 'vitest';
import {
  MAX_LIVE_VIEWERS,
  nextVehicleToPreloadIfRoom,
  pickerOverflowEdges,
  pickerScrollDelta,
  preloadViewer,
  rememberShownVehicle,
} from '@/lib/showroom';

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
