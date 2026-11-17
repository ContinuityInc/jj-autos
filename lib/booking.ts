import type { Vehicle } from '@/lib/vehicles';

export const BOOKING_ENDPOINT = 'https://formspree.io/f/myeywjdl';

export const EMBED_ALLOWED_ORIGINS = new Set([
  'https://dory-rust-8ts3.squarespace.com',
  'https://jjautos.sanylax.com',
]);

export const BOOKING_DATE_ERROR =
  'The return date needs to be after the pickup date.';

export const OPEN_BOOKING_TYPE = 'jjautos:open-booking';
export const OPEN_BOOKING_ACK_TYPE = 'jjautos:open-booking:ack';
export const OPEN_BOOKING_ACK_TIMEOUT_MS = 1200;

export type BookingFields = {
  startDate: string;
  endDate: string;
  handoff: string;
  name: string;
  email: string;
  note: string;
};

export type BookingPayload = BookingFields & {
  vehicle: string;
  vehicleId: string;
  source: string;
};

export function validateBookingDates(startDate: string, endDate: string) {
  if (startDate && endDate && endDate <= startDate) {
    return BOOKING_DATE_ERROR;
  }
  return null;
}

export function buildBookingPayload({
  vehicle,
  fields,
  source,
}: {
  vehicle: Pick<Vehicle, 'id' | 'maker' | 'model'>;
  fields: BookingFields;
  source: string;
}): BookingPayload {
  return {
    vehicle: `${vehicle.maker} ${vehicle.model}`,
    vehicleId: vehicle.id,
    startDate: fields.startDate,
    endDate: fields.endDate,
    handoff: fields.handoff,
    name: fields.name,
    email: fields.email,
    note: fields.note,
    source,
  };
}

/** Squarespace embed parents that may receive the open-booking postMessage. */
export function getEmbedParentOrigin({
  search,
  referrer,
}: {
  search: string;
  referrer: string;
}) {
  if (new URLSearchParams(search).get('embed') !== 'squarespace' || !referrer) {
    return null;
  }
  try {
    const origin = new URL(referrer).origin;
    return EMBED_ALLOWED_ORIGINS.has(origin) ? origin : null;
  } catch {
    return null;
  }
}

/** Formspree only gets trimmed strings; File/null values become empty. */
export function readFormField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

type Clock = {
  getTime: () => number;
  getTimezoneOffset: () => number;
};

/** YYYY-MM-DD in the visitor's local calendar, used as the pickup min date. */
export function todayInLocalTime(now: Clock = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function greetingFirstName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? '';
}

/** Only an iframe parent with an allowlisted origin may handle booking. */
export function shouldDelegateBookingToParent({
  parentOrigin,
  isEmbedded,
}: {
  parentOrigin: string | null;
  isEmbedded: boolean;
}) {
  return Boolean(parentOrigin) && isEmbedded;
}

export function createOpenBookingMessage(vehicleId: string, requestId: string) {
  return {
    type: OPEN_BOOKING_TYPE,
    vehicleId,
    requestId,
  };
}

/** Dropdown label; arriving cars still take date requests. */
export function bookingOptionLabel(
  vehicle: Pick<Vehicle, 'maker' | 'model' | 'arriving'>,
) {
  return `${vehicle.maker} ${vehicle.model}${vehicle.arriving ? ' (soon)' : ''}`;
}

type OpenBookingAckEvent = {
  origin: string;
  source: unknown;
  data: unknown;
};

/** Ack must match origin, parent window, type, and the request we just sent. */
export function isOpenBookingAck(
  event: OpenBookingAckEvent,
  parent: { origin: string; source: unknown },
  requestId: string,
) {
  if (event.origin !== parent.origin) return false;
  if (event.source !== parent.source) return false;
  if (!event.data || typeof event.data !== 'object') return false;
  const payload = event.data as { type?: unknown; requestId?: unknown };
  return (
    payload.type === OPEN_BOOKING_ACK_TYPE && payload.requestId === requestId
  );
}
