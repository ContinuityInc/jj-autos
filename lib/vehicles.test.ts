import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DESKTOP_FOV,
  LEGACY_BOOKING_IDS,
  MOBILE_CAMERA_DISTANCE,
  MOBILE_FOV,
  TESLA_FLEET_IDS,
  cameraFor,
  capitalize,
  carCount,
  fieldOfView,
  fleetCounts,
  getVehicle,
  nextVehicleToPreload,
  showroomIntro,
  uniqueModelCredits,
  vehicles,
  wordForCount,
} from '@/lib/vehicles';

const publicDir = path.resolve(__dirname, '../public');

describe('vehicles catalog', () => {
  it('keeps the booking vehicle keys the Squarespace embed already uses', () => {
    expect(vehicles.map((vehicle) => vehicle.id).slice(0, 3)).toEqual([
      ...LEGACY_BOOKING_IDS,
    ]);
  });

  it('adds the Tesla fleet ids the parent booking form must learn', () => {
    expect(vehicles.map((vehicle) => vehicle.id)).toEqual([
      ...LEGACY_BOOKING_IDS,
      ...TESLA_FLEET_IDS,
    ]);
  });

  it('keeps catalog ids unique', () => {
    const ids = vehicles.map((vehicle) => vehicle.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('shares one Sketchfab model between the two Model Ys and keeps other uids unique', () => {
    const modelY = getVehicle('model-y');
    const modelYPerformance = getVehicle('model-y-performance');
    expect(modelY.model3d.uid).toBe(modelYPerformance.model3d.uid);
    expect(modelY.model3d.poster.src).not.toBe(
      modelYPerformance.model3d.poster.src,
    );

    const uids = vehicles.map((vehicle) => vehicle.model3d.uid);
    expect(new Set(uids).size).toBe(uids.length - 1);
    expect(uniqueModelCredits()).toHaveLength(vehicles.length - 1);
  });

  it('keeps the BMW id after the M4 replaced the 840i', () => {
    const bmw = vehicles.find((vehicle) => vehicle.id === 'bmw');
    expect(bmw?.model).toBe('M4 Competition');
  });

  it('tags undelivered Teslas as arriving soon and still looks them up by id', () => {
    expect(getVehicle('model-y').arriving).toBeUndefined();
    expect(
      ['model-y-performance', 'model-3', 'model-x', 'cybertruck'].map(
        (id) => getVehicle(id).arriving,
      ),
    ).toEqual([true, true, true, true]);
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
    expect(getVehicle('cybertruck').id).toBe('cybertruck');
  });

  it('ships every 3D poster and fleet photo the page references', () => {
    for (const vehicle of vehicles) {
      for (const width of [900, 1800]) {
        expect(
          existsSync(
            path.join(
              publicDir,
              `${vehicle.model3d.poster.src.slice(1)}-${width}.webp`,
            ),
          ),
        ).toBe(true);
      }
      for (const photo of vehicle.photos ?? []) {
        expect(photo.alt.length).toBeGreaterThan(0);
        for (const width of [800, 1200]) {
          expect(
            existsSync(
              path.join(publicDir, `${photo.src.slice(1)}-${width}.webp`),
            ),
          ).toBe(true);
        }
      }
    }
  });
});

describe('fleet copy', () => {
  it('counts ready and arriving cars from the catalog', () => {
    expect(fleetCounts()).toEqual({ readyCount: 4, arrivingCount: 4 });
  });

  it('writes car counts in words and falls back to digits past ten', () => {
    expect(carCount(1)).toBe('one car');
    expect(carCount(4)).toBe('four cars');
    expect(wordForCount(12)).toBe('12');
    expect(capitalize('four cars')).toBe('Four cars');
  });

  it('builds the showroom intro from ready vs arriving counts', () => {
    expect(showroomIntro()).toBe(
      'Four cars run by their owner, and four more arriving soon.',
    );
    expect(showroomIntro([{ arriving: false }, { arriving: false }])).toBe(
      'Two cars run by their owner.',
    );
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
    expect(nextVehicleToPreload('tesla', ['tesla'])).toBe('model-y');
  });

  it('wraps from the last car back to the first unmounted one', () => {
    expect(nextVehicleToPreload('cybertruck', ['cybertruck'])).toBe('corvette');
  });

  it('returns null when every car is already cached', () => {
    expect(
      nextVehicleToPreload(
        'bmw',
        vehicles.map((vehicle) => vehicle.id),
      ),
    ).toBeNull();
  });

  it('returns null for an unknown visible id instead of walking from -1', () => {
    expect(nextVehicleToPreload('missing', [])).toBeNull();
  });
});
