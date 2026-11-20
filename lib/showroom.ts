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

export type ViewerStatus = 'loading' | 'ready' | 'error';

/** Hidden cars still count as busy until their first load finishes. */
export function viewerIsBusy(
  mountedIds: readonly string[],
  statuses: Readonly<Record<string, ViewerStatus | undefined>>,
) {
  return mountedIds.some((id) => (statuses[id] ?? 'loading') === 'loading');
}

export function mergeViewerStatus(
  current: Readonly<Record<string, ViewerStatus>>,
  id: string,
  status: ViewerStatus,
): Record<string, ViewerStatus> {
  if (current[id] === status) return current as Record<string, ViewerStatus>;
  return { ...current, [id]: status };
}

/**
 * A dropped viewer must look unloaded the next time it shows, so the still
 * covers the reload instead of a stale "ready" or half-finished bar.
 */
export function dropViewerState(
  statuses: Readonly<Record<string, ViewerStatus>>,
  progress: Readonly<Record<string, number>>,
  id: string,
) {
  return {
    statuses: mergeViewerStatus(statuses, id, 'loading'),
    progress: resetViewerProgress(progress, id),
  };
}

export function resetViewerProgress(
  progress: Readonly<Record<string, number>>,
  id: string,
) {
  return { ...progress, [id]: 0 };
}

export function bumpViewerAttempt(
  attempts: Readonly<Record<string, number>>,
  id: string,
) {
  return { ...attempts, [id]: (attempts[id] ?? 0) + 1 };
}

/**
 * "Try again" remounts the iframe. Bumping attempts changes the React key so
 * the previous Sketchfab instance cannot keep calling into a dead viewer.
 */
export function retryViewer(
  statuses: Readonly<Record<string, ViewerStatus>>,
  progress: Readonly<Record<string, number>>,
  attempts: Readonly<Record<string, number>>,
  id: string,
) {
  return {
    statuses: mergeViewerStatus(statuses, id, 'loading'),
    progress: resetViewerProgress(progress, id),
    attempts: bumpViewerAttempt(attempts, id),
  };
}

export function viewerInstanceKey(
  id: string,
  attempts: Readonly<Record<string, number>>,
) {
  return `${id}-${attempts[id] ?? 0}`;
}

/** Never start a background download while the visible car is still loading. */
export function canStartBackgroundPreload({
  busy,
  nextId,
  activeStatus,
  allowed,
}: {
  busy: boolean;
  nextId: string | null;
  activeStatus: ViewerStatus;
  allowed: boolean;
}) {
  return !busy && nextId !== null && activeStatus === 'ready' && allowed;
}
