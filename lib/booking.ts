import type { Vehicle } from '@/lib/vehicles';

export const BOOKING_ENDPOINT = 'https://formspree.io/f/myeywjdl';

export const EMBED_ALLOWED_ORIGINS = new Set([
  'https://dory-rust-8ts3.squarespace.com',
  'https://jjautos.sanylax.com',
]);

export const BOOKING_DATE_ERROR =
  'The return date needs to be after the pickup date.';

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
