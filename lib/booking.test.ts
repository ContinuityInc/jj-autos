import { describe, expect, it } from 'vitest';
import {
  BOOKING_DATE_ERROR,
  BOOKING_ENDPOINT,
  EMBED_ALLOWED_ORIGINS,
  OPEN_BOOKING_ACK_TYPE,
  OPEN_BOOKING_TYPE,
  buildBookingPayload,
  createOpenBookingMessage,
  getEmbedParentOrigin,
  greetingFirstName,
  isOpenBookingAck,
  readFormField,
  shouldDelegateBookingToParent,
  todayInLocalTime,
  validateBookingDates,
} from '@/lib/booking';
import { getVehicle } from '@/lib/vehicles';

describe('BOOKING_ENDPOINT', () => {
  it('keeps requests on the live Formspree form', () => {
    expect(BOOKING_ENDPOINT).toBe('https://formspree.io/f/myeywjdl');
  });
});

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

  it('keeps delivery handoff and an empty note in the Formspree body', () => {
    const payload = buildBookingPayload({
      vehicle: getVehicle('tesla'),
      fields: {
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        handoff: 'Bay Area delivery request',
        name: 'Sam Lee',
        email: 'sam@example.com',
        note: '',
      },
      source: 'dory-rust-8ts3.squarespace.com',
    });

    expect(payload.vehicleId).toBe('tesla');
    expect(payload.handoff).toBe('Bay Area delivery request');
    expect(payload.note).toBe('');
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

describe('readFormField', () => {
  it('trims strings so booking payloads do not keep accidental spaces', () => {
    const formData = new FormData();
    formData.set('name', '  Alex Rivera  ');
    formData.set('email', 'alex@example.com');
    expect(readFormField(formData, 'name')).toBe('Alex Rivera');
    expect(readFormField(formData, 'email')).toBe('alex@example.com');
  });

  it('treats missing or non-string values as empty', () => {
    const formData = new FormData();
    formData.set('note', new File(['x'], 'note.txt'));
    expect(readFormField(formData, 'note')).toBe('');
    expect(readFormField(formData, 'missing')).toBe('');
  });
});

describe('todayInLocalTime', () => {
  it('uses the visitor calendar, not UTC, around midnight', () => {
    expect(
      todayInLocalTime({
        getTime: () => Date.UTC(2026, 10, 15, 7, 0, 0),
        getTimezoneOffset: () => 480,
      }),
    ).toBe('2026-11-14');
    expect(
      todayInLocalTime({
        getTime: () => Date.UTC(2026, 10, 15, 8, 0, 0),
        getTimezoneOffset: () => 480,
      }),
    ).toBe('2026-11-15');
  });

  it('rolls forward for timezones ahead of UTC', () => {
    expect(
      todayInLocalTime({
        getTime: () => Date.UTC(2026, 10, 14, 14, 0, 0),
        getTimezoneOffset: () => -600,
      }),
    ).toBe('2026-11-15');
  });
});

describe('greetingFirstName', () => {
  it('uses the first word of the submitted name', () => {
    expect(greetingFirstName('Alex Rivera')).toBe('Alex');
    expect(greetingFirstName('  Sam  Lee ')).toBe('Sam');
  });

  it('returns empty when the name is blank so the thanks line stays grammatical', () => {
    expect(greetingFirstName('')).toBe('');
    expect(greetingFirstName('   ')).toBe('');
  });
});

describe('open-booking handshake', () => {
  const parent = {
    origin: 'https://jjautos.sanylax.com',
    source: { id: 'parent' },
  };
  const requestId = 'req-123';

  it('delegates booking only when the page is framed by an allowlisted parent', () => {
    expect(
      shouldDelegateBookingToParent({
        parentOrigin: parent.origin,
        isEmbedded: true,
      }),
    ).toBe(true);
    expect(
      shouldDelegateBookingToParent({
        parentOrigin: parent.origin,
        isEmbedded: false,
      }),
    ).toBe(false);
    expect(
      shouldDelegateBookingToParent({
        parentOrigin: null,
        isEmbedded: true,
      }),
    ).toBe(false);
  });

  it('posts the catalog vehicle id the parent already keys bookings on', () => {
    expect(createOpenBookingMessage('bmw', requestId)).toEqual({
      type: OPEN_BOOKING_TYPE,
      vehicleId: 'bmw',
      requestId,
    });
  });

  it('accepts only a matching ack from the parent window', () => {
    expect(
      isOpenBookingAck(
        {
          origin: parent.origin,
          source: parent.source,
          data: { type: OPEN_BOOKING_ACK_TYPE, requestId },
        },
        parent,
        requestId,
      ),
    ).toBe(true);
  });

  it('rejects acks from another origin, window, type, or request', () => {
    const valid = {
      origin: parent.origin,
      source: parent.source,
      data: { type: OPEN_BOOKING_ACK_TYPE, requestId },
    };
    expect(
      isOpenBookingAck(
        { ...valid, origin: 'https://evil.example' },
        parent,
        requestId,
      ),
    ).toBe(false);
    expect(
      isOpenBookingAck(
        { ...valid, source: { id: 'other' } },
        parent,
        requestId,
      ),
    ).toBe(false);
    expect(
      isOpenBookingAck(
        { ...valid, data: { type: OPEN_BOOKING_TYPE, requestId } },
        parent,
        requestId,
      ),
    ).toBe(false);
    expect(
      isOpenBookingAck(
        { ...valid, data: { type: OPEN_BOOKING_ACK_TYPE, requestId: 'other' } },
        parent,
        requestId,
      ),
    ).toBe(false);
    expect(isOpenBookingAck({ ...valid, data: null }, parent, requestId)).toBe(
      false,
    );
    expect(
      isOpenBookingAck(
        { ...valid, data: 'jjautos:open-booking:ack' },
        parent,
        requestId,
      ),
    ).toBe(false);
  });
});
