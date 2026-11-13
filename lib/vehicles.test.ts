import { describe, expect, it } from 'vitest';
import {
  MOBILE_CAMERA_DISTANCE,
  cameraFor,
  getVehicle,
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
