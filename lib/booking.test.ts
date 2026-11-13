import { describe, expect, it } from 'vitest';
import {
  BOOKING_DATE_ERROR,
  EMBED_ALLOWED_ORIGINS,
  buildBookingPayload,
  getEmbedParentOrigin,
  validateBookingDates,
} from '@/lib/booking';
import { getVehicle } from '@/lib/vehicles';

describe('validateBookingDates', () => {
  it('rejects a return on or before pickup', () => {
    expect(validateBookingDates('2026-11-13', '2026-11-13')).toBe(
      BOOKING_DATE_ERROR,
    );
    expect(validateBookingDates('2026-11-14', '2026-11-13')).toBe(
      BOOKING_DATE_ERROR,
    );
  });

  it('accepts a return after pickup', () => {
    expect(validateBookingDates('2026-11-13', '2026-11-14')).toBeNull();
  });

  it('skips the check until both dates are present', () => {
    expect(validateBookingDates('', '2026-11-14')).toBeNull();
    expect(validateBookingDates('2026-11-13', '')).toBeNull();
  });
});

describe('buildBookingPayload', () => {
  it('sends the catalog vehicle id, not just the display name', () => {
    const payload = buildBookingPayload({
      vehicle: getVehicle('bmw'),
      fields: {
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        handoff: 'Cupertino pickup',
        name: 'Alex Rivera',
        email: 'alex@example.com',
        note: 'Airport drop-off',
      },
      source: 'jjautos.sanylax.com',
    });

    expect(payload.vehicleId).toBe('bmw');
    expect(payload.vehicle).toBe('BMW M4 Competition');
    expect(payload.handoff).toBe('Cupertino pickup');
    expect(payload.source).toBe('jjautos.sanylax.com');
  });
});

describe('getEmbedParentOrigin', () => {
  it('allows only the known Squarespace hosts', () => {
    for (const origin of EMBED_ALLOWED_ORIGINS) {
      expect(
        getEmbedParentOrigin({
          search: '?embed=squarespace',
          referrer: `${origin}/fleet`,
        }),
      ).toBe(origin);
    }
  });

  it('ignores the embed when the referrer is missing or not Squarespace', () => {
    expect(
      getEmbedParentOrigin({ search: '?embed=squarespace', referrer: '' }),
    ).toBeNull();
    expect(
      getEmbedParentOrigin({
        search: '?embed=squarespace',
        referrer: 'https://evil.example/embed',
      }),
    ).toBeNull();
    expect(
      getEmbedParentOrigin({
        search: '',
        referrer: 'https://jjautos.sanylax.com/',
      }),
    ).toBeNull();
    expect(
      getEmbedParentOrigin({
        search: '?embed=other',
        referrer: 'https://jjautos.sanylax.com/',
      }),
    ).toBeNull();
  });

  it('ignores a malformed referrer instead of throwing', () => {
    expect(
      getEmbedParentOrigin({
        search: '?embed=squarespace',
        referrer: 'not a url',
      }),
    ).toBeNull();
  });
});
