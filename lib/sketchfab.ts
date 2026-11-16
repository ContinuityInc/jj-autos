export const SKETCHFAB_VERSION = '1.12.1';
export const SKETCHFAB_SCRIPT = `https://static.sketchfab.com/api/sketchfab-viewer-${SKETCHFAB_VERSION}.js`;

export type Camera = { position: number[]; target: number[] };

export type ViewerApi = {
  addEventListener: (
    event: string,
    callback: (...args: unknown[]) => void,
  ) => void;
  getCameraLookAt: (
    callback: (error: unknown, camera?: Camera) => void,
  ) => void;
  recenterCamera: () => void;
  setCameraLookAt: (
    position: number[],
    target: number[],
    duration: number,
  ) => void;
  setFov: (value: number) => void;
  start: () => void;
  stop: () => void;
};

type SketchfabConstructor = new (
  version: string,
  iframe: HTMLIFrameElement,
) => {
  init: (
    uid: string,
    options: Record<string, unknown> & {
      success: (api: ViewerApi) => void;
      error: () => void;
    },
  ) => void;
};

declare global {
  interface Window {
    Sketchfab?: SketchfabConstructor;
  }
}

let sketchfabPromise: Promise<SketchfabConstructor> | undefined;

// The layout preloads this script, so by the time React hydrates the request
// is usually already finished and this resolves straight from cache.
export function loadSketchfab() {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);
  if (sketchfabPromise) return sketchfabPromise;

  sketchfabPromise = new Promise<SketchfabConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SKETCHFAB_SCRIPT;
    script.async = true;
    script.addEventListener(
      'load',
      () => {
        if (window.Sketchfab) resolve(window.Sketchfab);
        else reject(new Error('The 3D viewer did not initialize.'));
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        script.remove();
        reject(new Error('The 3D viewer could not load.'));
      },
      { once: true },
    );
    document.head.appendChild(script);
  }).catch((error) => {
    sketchfabPromise = undefined;
    throw error;
  });

  return sketchfabPromise;
}

// Sketchfab reports load progress either as a bare number or as
// `{ progress }`, depending on the event. Anything else is ignored.
export function readProgress(value: unknown) {
  const raw =
    typeof value === 'number'
      ? value
      : typeof value === 'object' &&
          value !== null &&
          'progress' in value &&
          typeof value.progress === 'number'
        ? value.progress
        : undefined;
  if (raw === undefined || !Number.isFinite(raw)) return undefined;
  return Math.min(1, Math.max(0, raw));
}

export type NetworkConnection = {
  saveData?: boolean;
  effectiveType?: string;
};

function currentConnection(): NetworkConnection | undefined {
  return (
    navigator as Navigator & {
      connection?: NetworkConnection;
    }
  ).connection;
}

// Background preloading is skipped on small screens and slow or metered
// connections, where downloading two extra car models costs too much.
export function canPreloadModels(
  runtime: {
    connection?: NetworkConnection;
    isDesktop: boolean;
  } = {
    connection: currentConnection(),
    isDesktop: window.matchMedia('(min-width: 768px)').matches,
  },
) {
  if (runtime.connection?.saveData) return false;
  if (
    runtime.connection?.effectiveType &&
    /2g|3g/.test(runtime.connection.effectiveType)
  ) {
    return false;
  }
  return runtime.isDesktop;
}

export type IdleRuntime = {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (callback: () => void, ms: number) => number;
  clearTimeout: (handle: number) => void;
};

export function whenIdle(callback: () => void, runtime: IdleRuntime = window) {
  if (typeof runtime.requestIdleCallback === 'function') {
    const handle = runtime.requestIdleCallback(callback, { timeout: 2500 });
    return () => runtime.cancelIdleCallback?.(handle);
  }
  const handle = runtime.setTimeout(callback, 1200);
  return () => runtime.clearTimeout(handle);
}

/** Phones get smaller textures; reduced-motion visitors get no autospin. */
export function viewerDeviceOptions(small: boolean, reduceMotion: boolean) {
  return {
    autospin: reduceMotion ? 0 : 0.06,
    max_texture_size: small ? 1024 : 2048,
  };
}
