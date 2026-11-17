import { nextVehicleToPreload, type Vehicle } from '@/lib/vehicles';

/** Each loaded car holds its own WebGL viewer, so only this many stay loaded. */
export const MAX_LIVE_VIEWERS = 3;

/**
 * Loaded cars, least recently shown first. The car on show is always last.
 * Showing another car moves it to the end and drops the oldest once the cap
 * is hit, so it reloads from its still if the visitor comes back.
 */
export function rememberShownVehicle(
  mountedIds: readonly string[],
  id: string,
  max = MAX_LIVE_VIEWERS,
) {
  if (mountedIds[mountedIds.length - 1] === id) return mountedIds as string[];
  return [...mountedIds.filter((item) => item !== id), id].slice(-max);
}

/**
 * Hover/focus preload fills a free slot before the visible car. It never
 * evicts a car the visitor has already looked at.
 */
export function preloadViewer(
  mountedIds: readonly string[],
  id: string,
  max = MAX_LIVE_VIEWERS,
) {
  if (mountedIds.includes(id) || mountedIds.length >= max) {
    return mountedIds as string[];
  }
  return [...mountedIds.slice(0, -1), id, ...mountedIds.slice(-1)];
}

/** Background preload only runs while a viewer slot is free. */
export function nextVehicleToPreloadIfRoom(
  currentId: string,
  mountedIds: readonly string[],
  max = MAX_LIVE_VIEWERS,
  catalog?: readonly Pick<Vehicle, 'id'>[],
) {
  if (mountedIds.length >= max) return null;
  return catalog
    ? nextVehicleToPreload(currentId, mountedIds, catalog)
    : nextVehicleToPreload(currentId, mountedIds);
}

export function pickerOverflowEdges({
  scrollLeft,
  clientWidth,
  scrollWidth,
  threshold = 1,
}: {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
  threshold?: number;
}) {
  return {
    start: scrollLeft > threshold,
    end: scrollLeft + clientWidth < scrollWidth - threshold,
  };
}

/** Keep the selected picker button in view when the row scrolls. */
export function pickerScrollDelta({
  pickerLeft,
  pickerRight,
  itemLeft,
  itemRight,
}: {
  pickerLeft: number;
  pickerRight: number;
  itemLeft: number;
  itemRight: number;
}) {
  if (itemLeft < pickerLeft) return itemLeft - pickerLeft;
  if (itemRight > pickerRight) return itemRight - pickerRight;
  return 0;
}
