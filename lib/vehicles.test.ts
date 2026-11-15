import { describe, expect, it } from 'vitest';
import {
  DESKTOP_FOV,
  MOBILE_CAMERA_DISTANCE,
  MOBILE_FOV,
  cameraFor,
  fieldOfView,
  getVehicle,
  nextVehicleToPreload,
  vehicles,
} from '@/lib/vehicles';

describe('vehicles catalog', () => {
  it('keeps the booking vehicle keys the Squarespace embed already uses', () => {
    expect(vehicles.map((vehicle) => vehicle.id)).toEqual([
      'corvette',
      'bmw',
      'tesla',
    ]);
  });

  it('keeps catalog ids and Sketchfab uids unique', () => {
    const ids = vehicles.map((vehicle) => vehicle.id);
    const uids = vehicles.map((vehicle) => vehicle.model3d.uid);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('keeps the BMW id after the M4 replaced the 840i', () => {
    const bmw = vehicles.find((vehicle) => vehicle.id === 'bmw');
    expect(bmw?.model).toBe('M4 Competition');
  });

  it('requires a Sketchfab model, camera, and poster for every car', () => {
    for (const vehicle of vehicles) {
      expect(vehicle.model3d.uid).toMatch(/^[a-f0-9]{32}$/);
      expect(vehicle.model3d.camera.position).toHaveLength(3);
      expect(vehicle.model3d.camera.target).toHaveLength(3);
      expect(vehicle.model3d.poster.src).toMatch(/^\/cars\/[a-z0-9-]+-3d$/);
      expect(vehicle.model3d.poster.widthRatio).toBeGreaterThan(0);
      expect(vehicle.model3d.poster.widthRatio).toBeLessThanOrEqual(1);
      expect(vehicle.model3d.poster.heightRatio).toBeGreaterThan(0);
      expect(vehicle.model3d.poster.heightRatio).toBeLessThanOrEqual(1);
    }
  });

  it('falls back to the first car for unknown booking ids', () => {
    expect(getVehicle('missing').id).toBe('corvette');
    expect(getVehicle('tesla').id).toBe('tesla');
  });
});

describe('fieldOfView', () => {
  it('widens the lens on phones and keeps the desktop framing on larger screens', () => {
    expect(fieldOfView(true)).toBe(MOBILE_FOV);
    expect(fieldOfView(false)).toBe(DESKTOP_FOV);
  });
});

describe('cameraFor', () => {
  it('uses the stored camera on desktop', () => {
    const vehicle = getVehicle('corvette');
    expect(cameraFor(vehicle, false)).toEqual(vehicle.model3d.camera);
  });

  it('pulls the camera back on phones without changing the look-at target', () => {
    const vehicle = getVehicle('bmw');
    const { position, target } = cameraFor(vehicle, true);
    expect(target).toEqual(vehicle.model3d.camera.target);
    const [x, y, z] = vehicle.model3d.camera.position;
    const [tx, ty, tz] = vehicle.model3d.camera.target;
    expect(position[0]).toBeCloseTo(tx + (x - tx) * MOBILE_CAMERA_DISTANCE);
    expect(position[1]).toBeCloseTo(ty + (y - ty) * MOBILE_CAMERA_DISTANCE);
    expect(position[2]).toBeCloseTo(tz + (z - tz) * MOBILE_CAMERA_DISTANCE);
  });
});

describe('nextVehicleToPreload', () => {
  it('walks the catalog from the visible car and skips already-mounted ones', () => {
    expect(nextVehicleToPreload('corvette', ['corvette'])).toBe('bmw');
    expect(nextVehicleToPreload('corvette', ['corvette', 'bmw'])).toBe('tesla');
  });

  it('wraps from the last car back to the first unmounted one', () => {
    expect(nextVehicleToPreload('tesla', ['tesla'])).toBe('corvette');
  });

  it('returns null when every car is already cached', () => {
    expect(
      nextVehicleToPreload('bmw', ['corvette', 'bmw', 'tesla']),
    ).toBeNull();
  });

  it('returns null for an unknown visible id instead of walking from -1', () => {
    expect(nextVehicleToPreload('missing', [])).toBeNull();
  });
});
