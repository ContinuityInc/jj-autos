'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from 'motion/react';

type Vehicle = {
  id: string;
  number: string;
  eyebrow: string;
  maker: string;
  model: string;
  description: string;
  tagline: string;
  features: string[];
  specs: Array<{ value: string; label: string }>;
  model3d: {
    uid: string;
    title: string;
    author: string;
    source: string;
    license: string;
    licenseUrl: string;
    heroScale: number;
    heroScaleMobile: number;
    miniatureScale: number;
    miniatureScaleMobile: number;
  };
};

type Camera = { position: number[]; target: number[] };

type ViewerApi = {
  addEventListener: (event: string, callback: () => void) => void;
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

const vehicles: Vehicle[] = [
  {
    id: 'corvette',
    number: '01',
    eyebrow: '6.2L V8 / RWD',
    maker: 'Chevrolet',
    model: 'Corvette C8 2LT',
    description:
      'The C8 2LT has a mid-mounted 6.2-liter V8, 490 horsepower, rear-wheel drive, an eight-speed dual-clutch transmission, and a two-seat cockpit.',
    model3d: {
      uid: 'a3240484fa9d481abb2c5b6690c2595b',
      title: 'Chevrolet Corvette C8 Stingray',
      author: 'Thcyrax',
      source:
        'https://sketchfab.com/3d-models/vehicle-chrevolet-corvette-c8-stingray-a3240484fa9d481abb2c5b6690c2595b',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      heroScale: 0.92,
      heroScaleMobile: 1.02,
      miniatureScale: 0.75,
      miniatureScaleMobile: 0.8,
    },
    specs: [
      { value: '490', label: 'HORSEPOWER' },
      { value: '2.9s†', label: '0-60 / Z51' },
      { value: 'V8', label: 'MID-ENGINE' },
      { value: '2LT', label: 'PREMIUM TRIM' },
    ],
    tagline: '490 HP / MID-ENGINE V8',
    features: [
      'Mid-engine layout',
      'Eight-speed DCT',
      'Driver-focused cockpit',
      'Mobile delivery',
    ],
  },
  {
    id: 'bmw',
    number: '02',
    eyebrow: '3.0L TURBO I6 / RWD',
    maker: 'BMW',
    model: '840i',
    description:
      'The 840i pairs a 335-horsepower BMW TwinPower Turbo inline-six with rear-wheel drive, four seats, and grand-touring comfort.',
    model3d: {
      uid: 'bca2cec53d0341b3b2593030ed78b8c1',
      title: 'Bmw 8 car',
      author: 'itsrit3sh',
      source:
        'https://sketchfab.com/3d-models/bmw-8-car-bca2cec53d0341b3b2593030ed78b8c1',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      heroScale: 1.08,
      heroScaleMobile: 1.18,
      miniatureScale: 0.78,
      miniatureScaleMobile: 0.82,
    },
    specs: [
      { value: '335', label: 'HORSEPOWER' },
      { value: '4.7s*', label: '0-60 MPH' },
      { value: 'RWD', label: 'REAR-WHEEL' },
      { value: '4', label: 'SEATS' },
    ],
    tagline: '335 HP / TURBO INLINE-6',
    features: [
      'TwinPower Turbo inline-six',
      'Rear-wheel drive',
      'Four-seat grand tourer',
      'Mobile delivery',
    ],
  },
  {
    id: 'tesla',
    number: '03',
    eyebrow: 'TRI-MOTOR / AWD',
    maker: 'Tesla',
    model: 'Model S Plaid',
    description:
      'The Model S Plaid has 1,020 horsepower, tri-motor all-wheel drive, five seats, and quiet electric operation.',
    model3d: {
      uid: 'aec912ed367b4aebacc8676922f42beb',
      title: 'Tesla Model S Plaid 2023',
      author: 'slowpoly',
      source:
        'https://sketchfab.com/3d-models/tesla-model-s-plaid-2023-aec912ed367b4aebacc8676922f42beb',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      heroScale: 1.14,
      heroScaleMobile: 1.6,
      miniatureScale: 0.85,
      miniatureScaleMobile: 0.78,
    },
    specs: [
      { value: '1,020', label: 'HORSEPOWER' },
      { value: '1.99s*', label: '0-60 MPH' },
      { value: 'AWD', label: 'TRI-MOTOR' },
      { value: '5', label: 'SEATS' },
    ],
    tagline: '1,020 HP / TRI-MOTOR AWD',
    features: [
      'Tri-motor performance',
      'All-wheel drive',
      'Five-seat cabin',
      'Mobile delivery',
    ],
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const SKETCHFAB_SCRIPT =
  'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
const GARAGE_FILM = '/garage-loading-higgsfield.mp4';
const BOOKING_ENDPOINT = 'https://formspree.io/f/myeywjdl';
const EMBED_ALLOWED_ORIGINS = new Set([
  'https://dory-rust-8ts3.squarespace.com',
  'https://jjautos.sanylax.com',
]);

let sketchfabPromise: Promise<SketchfabConstructor> | undefined;

function loadSketchfab() {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);
  if (sketchfabPromise) return sketchfabPromise;

  sketchfabPromise = new Promise<SketchfabConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SKETCHFAB_SCRIPT}"]`,
    );
    const handleLoad = () => {
      if (window.Sketchfab) resolve(window.Sketchfab);
      else reject(new Error('The 3D viewer did not initialize.'));
    };
    const handleError = () =>
      reject(new Error('The 3D viewer could not load.'));

    if (existing) {
      existing.addEventListener('load', handleLoad, { once: true });
      existing.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = SKETCHFAB_SCRIPT;
    script.async = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    sketchfabPromise = undefined;
    throw error;
  });

  return sketchfabPromise;
}

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="JJ Autos home">
      <span className="logo-crest" aria-hidden="true">
        <i />
        <strong>JJ</strong>
        <i />
      </span>
      <span className="logo-name">JJ AUTOS</span>
    </a>
  );
}

function GarageLoader({ ready }: { ready: boolean }) {
  const reduceMotion = Boolean(useReducedMotion());
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [visible, setVisible] = useState(true);
  const cleanupRef = useRef<null | (() => void)>(null);

  const restorePage = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('garage-loading');
    document.body.classList.add('garage-loading');
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('.site-header, main, footer'),
    );
    const previous = elements.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
    }));

    elements.forEach((element) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
    cleanupRef.current = () => {
      document.documentElement.classList.remove('garage-loading');
      document.body.classList.remove('garage-loading');
      previous.forEach(({ element, ariaHidden, inert }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
    };
    return restorePage;
  }, [restorePage]);

  useEffect(() => {
    const minimumTimer = window.setTimeout(
      () => setMinimumElapsed(true),
      reduceMotion ? 250 : 2400,
    );
    const failsafeTimer = window.setTimeout(() => setVisible(false), 9000);
    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(failsafeTimer);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (!ready || !minimumElapsed) return;
    const timer = window.setTimeout(
      () => setVisible(false),
      reduceMotion ? 0 : 300,
    );
    return () => window.clearTimeout(timer);
  }, [minimumElapsed, ready, reduceMotion]);

  return (
    <AnimatePresence onExitComplete={restorePage}>
      {visible && (
        <motion.output
          className={`garage-loader ${ready ? 'garage-loader--ready' : ''}`}
          aria-label="JJ Autos garage loading"
          initial={false}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '-100%' }}
          transition={{ duration: reduceMotion ? 0.1 : 0.85, ease: EASE }}
        >
          {!reduceMotion && (
            <video
              className="garage-loader-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src={GARAGE_FILM} type="video/mp4" />
            </video>
          )}
          <div className="garage-loader-header">
            <span>JJ AUTOS / CUPERTINO</span>
            <span>{ready ? 'VEHICLE READY' : 'INITIALIZING 3D GARAGE'}</span>
          </div>
          <div className="garage-loader-center">
            <div className="garage-loader-mark" aria-hidden="true">
              <i />
              <strong>JJ</strong>
              <i />
            </div>
            <strong className="garage-loader-title">
              GARAGE
              <br />
              LOADING
            </strong>
            <div className="garage-loader-progress" aria-hidden="true">
              <span />
            </div>
            <div className="garage-loader-readout">
              <span>VEHICLE</span>
              <span>LIGHT</span>
              <span>CONTROLS</span>
            </div>
          </div>
          <div className="garage-loader-floor" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
        </motion.output>
      )}
    </AnimatePresence>
  );
}

function Header({ onBook }: { onBook: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerFocus = useRef(true);

  useEffect(() => {
    if (!menuOpen) return;
    const trigger = triggerRef.current;
    const scrollY = window.scrollY;
    const bodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };
    document.documentElement.classList.add('menu-open');
    document.body.classList.add('menu-open');
    Object.assign(document.body.style, {
      position: 'fixed',
      top: `-${scrollY}px`,
      left: '0',
      right: '0',
      width: '100%',
    });
    const hiddenElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'main, footer, .header-actions, .site-header > .logo',
      ),
    );
    const previous = hiddenElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
    }));
    hiddenElements.forEach((element) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
    const focusTimer = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    }, 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        restoreTriggerFocus.current = true;
        setMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const menuItems = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const focusable = [triggerRef.current, ...menuItems].filter(
        (item): item is HTMLElement => Boolean(item),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.documentElement.classList.remove('menu-open');
      document.body.classList.remove('menu-open');
      Object.assign(document.body.style, bodyStyle);
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKeyDown);
      previous.forEach(({ element, ariaHidden, inert }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
      if (restoreTriggerFocus.current) {
        window.requestAnimationFrame(() => trigger?.focus());
      }
      restoreTriggerFocus.current = true;
    };
  }, [menuOpen]);

  const closeMenu = () => {
    restoreTriggerFocus.current = true;
    setMenuOpen(false);
  };

  const openBooking = () => {
    restoreTriggerFocus.current = false;
    setMenuOpen(false);
    onBook();
  };

  return (
    <header className={`site-header ${menuOpen ? 'menu-open' : ''}`}>
      <button
        className="nav-trigger"
        type="button"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="site-menu"
        onClick={() => {
          restoreTriggerFocus.current = true;
          setMenuOpen((open) => !open);
        }}
        ref={triggerRef}
      >
        <span />
        <span />
      </button>
      <Logo />
      <div className="header-actions">
        <button type="button" onClick={openBooking}>
          Check availability
        </button>
        <a href="#fleet" onClick={closeMenu}>
          View fleet
        </a>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="site-menu"
            id="site-menu"
            ref={menuRef}
            aria-label="Primary navigation"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <span className="site-menu-label">JJ AUTOS / CUPERTINO</span>
            <div className="site-menu-links">
              <a href="#fleet" onClick={closeMenu}>
                <span>01</span>The fleet
              </a>
              <a href="#experience" onClick={closeMenu}>
                <span>02</span>Rental process
              </a>
              <a href="#story" onClick={closeMenu}>
                <span>03</span>About JJ Autos
              </a>
            </div>
            <div className="site-menu-footer">
              <span>Owner-operated performance rentals</span>
              <button type="button" onClick={openBooking}>
                Check availability <span aria-hidden="true">→</span>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function ModelViewer({
  vehicle,
  onReady,
}: {
  vehicle: Vehicle;
  onReady: () => void;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<ViewerApi | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    let active = true;
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const timeout = window.setTimeout(() => {
      if (active) {
        setStatus('error');
        onReady();
      }
    }, 15_000);

    loadSketchfab()
      .then((Sketchfab) => {
        if (!active || !iframeRef.current) return;
        new Sketchfab('1.12.1', iframeRef.current).init(vehicle.model3d.uid, {
          autostart: 1,
          autospin: reduceMotion ? 0 : 0.06,
          camera: 0,
          dnt: 1,
          max_texture_size: mobile ? 1024 : 2048,
          scrollwheel: 0,
          transparent: 1,
          ui_annotations: 0,
          ui_controls: 1,
          ui_fullscreen: 1,
          ui_help: 1,
          ui_hint: 0,
          ui_infos: 1,
          ui_inspector: 0,
          ui_settings: 1,
          ui_stop: 0,
          ui_vr: 0,
          success: (api) => {
            if (!active) {
              api.stop();
              return;
            }
            apiRef.current = api;
            api.addEventListener('viewerready', () => {
              if (!active) return;
              api.setFov(mobile ? 42 : 32);
              api.getCameraLookAt((error, camera) => {
                window.clearTimeout(timeout);
                if (!active) return;
                if (!error && camera) {
                  const scale = mobile
                    ? vehicle.model3d.heroScaleMobile
                    : vehicle.model3d.heroScale;
                  const position = camera.position.map(
                    (value, index) =>
                      camera.target[index] +
                      (value - camera.target[index]) * scale,
                  );
                  cameraRef.current = { position, target: camera.target };
                  api.setCameraLookAt(position, camera.target, 0);
                }
                setStatus('ready');
                onReady();
              });
            });
            api.start();
          },
          error: () => {
            window.clearTimeout(timeout);
            if (active) {
              setStatus('error');
              onReady();
            }
          },
        });
      })
      .catch(() => {
        window.clearTimeout(timeout);
        if (active) {
          setStatus('error');
          onReady();
        }
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      apiRef.current?.stop();
      apiRef.current = null;
      cameraRef.current = null;
    };
  }, [onReady, reduceMotion, vehicle]);

  return (
    <div className={`model-viewer model-viewer--${status}`}>
      {!reduceMotion && (
        <video
          className="model-garage-film"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={GARAGE_FILM} type="video/mp4" />
        </video>
      )}
      <div className="model-viewer-frame-wrap">
        <iframe
          ref={iframeRef}
          className="model-viewer-frame"
          title={`Interactive 3D model of ${vehicle.maker} ${vehicle.model}`}
          allow="autoplay; fullscreen"
        />
      </div>
      <output className="model-viewer-status" aria-live="polite">
        {status === 'loading' && (
          <>
            <span>LOADING 3D MODEL</span>
            <i aria-hidden="true" />
          </>
        )}
        {status === 'ready' && <span>DRAG TO ROTATE / PINCH TO ZOOM</span>}
        {status === 'error' && (
          <span>3D MODEL UNAVAILABLE / RELOAD TO TRY AGAIN</span>
        )}
      </output>
      {status === 'ready' && (
        <button
          className="model-viewer-reset"
          type="button"
          onClick={() => {
            const camera = cameraRef.current;
            if (camera)
              apiRef.current?.setCameraLookAt(
                camera.position,
                camera.target,
                0.7,
              );
            else apiRef.current?.recenterCamera();
          }}
        >
          Reset view
        </button>
      )}
      <p className="model-viewer-credit">
        <span>REPRESENTATIVE 3D / </span>
        <a href={vehicle.model3d.source} target="_blank" rel="noreferrer">
          {vehicle.model3d.title} BY {vehicle.model3d.author}
        </a>
        <span> / </span>
        <a href={vehicle.model3d.licenseUrl} target="_blank" rel="noreferrer">
          {vehicle.model3d.license}
        </a>
      </p>
    </div>
  );
}

function GarageHero({
  activeVehicle,
  onSelect,
  onBook,
  onModelReady,
}: {
  activeVehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
  onBook: () => void;
  onModelReady: () => void;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const [direction, setDirection] = useState(1);
  const vehicle = activeVehicle;
  const currentIndex = vehicles.findIndex((item) => item.id === vehicle.id);

  const selectVehicle = (id: string, nextDirection = 1) => {
    if (id !== vehicle.id) {
      setDirection(nextDirection);
      onSelect(id);
    }
  };
  const step = (amount: number) => {
    const index = (currentIndex + amount + vehicles.length) % vehicles.length;
    selectVehicle(vehicles[index].id, amount);
  };

  return (
    <section
      className={`model-stage model-stage--${vehicle.id}`}
      id="top"
      aria-label={`Interactive vehicle showroom. ${vehicle.maker} ${vehicle.model} selected. Drag the vehicle to rotate it. Use left and right arrow keys to switch.`}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          className="model-render"
          key={vehicle.id}
          custom={direction}
          initial={
            reduceMotion
              ? undefined
              : { opacity: 0, x: direction * 80, scale: 1.025 }
          }
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={
            reduceMotion
              ? undefined
              : { opacity: 0, x: direction * -70, scale: 1.015 }
          }
          transition={{ duration: 0.78, ease: EASE }}
        >
          <ModelViewer vehicle={vehicle} onReady={onModelReady} />
        </motion.div>
      </AnimatePresence>
      <button
        className="model-arrow model-arrow--previous"
        type="button"
        onClick={() => step(-1)}
        aria-label="Previous vehicle"
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        className="model-arrow model-arrow--next"
        type="button"
        onClick={() => step(1)}
        aria-label="Next vehicle"
      >
        <span aria-hidden="true">→</span>
      </button>
      <div className="model-stage-copy">
        <AnimatePresence mode="wait">
          <motion.div
            className="model-title"
            key={vehicle.id}
            initial={reduceMotion ? undefined : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
            transition={{ duration: 0.48, ease: EASE }}
          >
            <span>{vehicle.tagline}</span>
            <h1>{vehicle.model}</h1>
          </motion.div>
        </AnimatePresence>
        <div className="model-stage-actions">
          <button
            type="button"
            className="stage-action stage-action--primary"
            onClick={onBook}
          >
            Check availability
          </button>
          <a className="stage-action stage-action--secondary" href="#fleet">
            View fleet
          </a>
        </div>
        <div className="model-pagination" aria-label="Choose a vehicle">
          {vehicles.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={item.id === vehicle.id ? 'active' : ''}
              aria-label={`Select ${item.maker} ${item.model}`}
              aria-pressed={item.id === vehicle.id}
              onClick={() =>
                selectVehicle(item.id, index >= currentIndex ? 1 : -1)
              }
            >
              <span />
            </button>
          ))}
        </div>
      </div>
      <span className="model-stage-location">
        JJ AUTOS&nbsp;&nbsp; / &nbsp;&nbsp;CUPERTINO, CALIFORNIA
      </span>
      <p className="sr-only" aria-live="polite">
        Selected {vehicle.maker} {vehicle.model}.
      </p>
    </section>
  );
}

function MiniModelViewer({ vehicle }: { vehicle: Vehicle }) {
  const reduceMotion = Boolean(useReducedMotion());
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<ViewerApi | null>(null);
  const intersectingRef = useRef(false);
  const [intersecting, setIntersecting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;
    const supportsIntersectionObserver =
      typeof window.IntersectionObserver === 'function';
    if (!supportsIntersectionObserver) {
      intersectingRef.current = true;
      const timer = window.setTimeout(() => {
        setIntersecting(true);
        setRequested(true);
        setStatus('loading');
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersectingRef.current = entry.isIntersecting;
        setIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setRequested(true);
          setStatus((current) => (current === 'idle' ? 'loading' : current));
          apiRef.current?.start();
        } else {
          apiRef.current?.stop();
        }
      },
      { rootMargin: '360px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!requested) return;
    let active = true;
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const timeout = window.setTimeout(() => {
      if (active) setStatus('error');
    }, 15_000);
    loadSketchfab()
      .then((Sketchfab) => {
        if (!active || !iframeRef.current) return;
        new Sketchfab('1.12.1', iframeRef.current).init(vehicle.model3d.uid, {
          autostart: 1,
          autospin: reduceMotion ? 0 : 0.08,
          camera: 0,
          dnt: 1,
          max_texture_size: 1024,
          scrollwheel: 0,
          transparent: 1,
          ui_annotations: 0,
          ui_controls: 1,
          ui_fullscreen: 1,
          ui_help: 0,
          ui_hint: 0,
          ui_infos: 1,
          ui_inspector: 0,
          ui_settings: 0,
          ui_stop: 0,
          ui_vr: 0,
          success: (api) => {
            if (!active) {
              api.stop();
              return;
            }
            apiRef.current = api;
            api.addEventListener('viewerready', () => {
              if (!active) return;
              api.setFov(mobile ? 32 : 28);
              api.getCameraLookAt((error, camera) => {
                if (!active) return;
                window.clearTimeout(timeout);
                if (!error && camera) {
                  const scale = mobile
                    ? vehicle.model3d.miniatureScaleMobile
                    : vehicle.model3d.miniatureScale;
                  const position = camera.position.map(
                    (value, index) =>
                      camera.target[index] +
                      (value - camera.target[index]) * scale,
                  );
                  api.setCameraLookAt(position, camera.target, 0);
                }
                setStatus('ready');
              });
            });
            api.start();
            if (!intersectingRef.current) {
              window.requestAnimationFrame(() => {
                if (active && !intersectingRef.current) api.stop();
              });
            }
          },
          error: () => {
            window.clearTimeout(timeout);
            if (active) setStatus('error');
          },
        });
      })
      .catch(() => {
        window.clearTimeout(timeout);
        if (active) setStatus('error');
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      apiRef.current?.stop();
      apiRef.current = null;
    };
  }, [reduceMotion, requested, vehicle]);

  return (
    <div
      className={`mini-model-viewer mini-model-viewer--${status}`}
      ref={hostRef}
    >
      {requested && intersecting && !reduceMotion && (
        <video
          className="mini-model-film"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={GARAGE_FILM} type="video/mp4" />
        </video>
      )}
      <div className="mini-model-frame-wrap">
        {requested && (
          <iframe
            ref={iframeRef}
            className="mini-model-frame"
            title={`Mini interactive 3D model of ${vehicle.maker} ${vehicle.model}`}
            allow="autoplay; fullscreen"
          />
        )}
      </div>
      <output className="mini-model-status" aria-live="polite">
        {status === 'idle' && <span>3D MODEL STANDBY</span>}
        {status === 'loading' && (
          <>
            <span>LOADING MINIATURE</span>
            <i aria-hidden="true" />
          </>
        )}
        {status === 'error' && (
          <span>3D PREVIEW UNAVAILABLE / OPEN FULL GARAGE</span>
        )}
      </output>
    </div>
  );
}

function FleetCard({
  vehicle,
  onBook,
  onView3d,
}: {
  vehicle: Vehicle;
  onBook: (vehicleId: string) => void;
  onView3d: (vehicleId: string) => void;
}) {
  return (
    <article className={`fleet-card fleet-card--${vehicle.id}`}>
      <div className="fleet-card-console">
        <div className="fleet-card-console-head">
          <span>LIVE MINIATURE / {vehicle.number}</span>
          <span>DRAG / ROTATE</span>
        </div>
        <MiniModelViewer vehicle={vehicle} />
        <div className="fleet-card-console-footer">
          <p>
            <span>REPRESENTATIVE 3D / </span>
            <a href={vehicle.model3d.source} target="_blank" rel="noreferrer">
              {vehicle.model3d.author}
            </a>
            <span> / </span>
            <a
              href={vehicle.model3d.licenseUrl}
              target="_blank"
              rel="noreferrer"
            >
              {vehicle.model3d.license}
            </a>
          </p>
          <button
            type="button"
            onClick={() => onView3d(vehicle.id)}
            aria-label={`Open ${vehicle.maker} ${vehicle.model} in the full 3D garage`}
          >
            OPEN FULL GARAGE <b aria-hidden="true">↗</b>
          </button>
        </div>
      </div>
      <div className="fleet-card-body">
        <div className="vehicle-title-row">
          <div>
            <span>{vehicle.eyebrow}</span>
            <h3>
              {vehicle.maker} <strong>{vehicle.model}</strong>
            </h3>
          </div>
          <div className="vehicle-rate">
            <small>PRICING</small>
            <strong>QUOTE</strong>
            <span>WITH DATES</span>
          </div>
        </div>
        <p>{vehicle.description}</p>
        <div className="spec-grid">
          {vehicle.specs.map((spec) => (
            <div key={spec.label}>
              <strong>{spec.value}</strong>
              <span>{spec.label}</span>
            </div>
          ))}
        </div>
        <div className="feature-list">
          {vehicle.features.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
        <button
          className="card-cta"
          type="button"
          onClick={() => onBook(vehicle.id)}
        >
          <span>Check {vehicle.model} dates</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

function Fleet({
  onBook,
  onView3d,
}: {
  onBook: (vehicleId: string) => void;
  onView3d: (vehicleId: string) => void;
}) {
  return (
    <section className="fleet section-pad" id="fleet">
      <div className="section-heading">
        <div>
          <h2>
            Choose one of
            <br />
            three vehicles.
          </h2>
        </div>
        <div>
          <p>
            The Corvette C8 2LT is a two-seat, mid-engine V8 sports car. The BMW
            840i is a four-seat turbocharged grand tourer. The Model S Plaid is
            a five-seat electric sedan.
          </p>
        </div>
      </div>
      <div className="fleet-grid">
        {vehicles.map((vehicle) => (
          <FleetCard
            key={vehicle.id}
            vehicle={vehicle}
            onBook={onBook}
            onView3d={onView3d}
          />
        ))}
      </div>
      <p className="rate-note">
        Pricing is confirmed with your dates, delivery area, and trip details.
        Manufacturer benchmarks are shown. The Corvette&apos;s 2.9-second figure
        requires the available Z51 Performance Package. BMW&apos;s 4.7-second
        figure is the manufacturer benchmark for the rear-wheel-drive 840i
        Coupe. Tesla&apos;s 1.99-second figure uses rollout subtracted. Confirm
        the configuration of each car. Conditions affect results.
      </p>
    </section>
  );
}

function Experience({ onBook }: { onBook: () => void }) {
  const moments = [
    {
      number: '01',
      label: 'SEND YOUR DATES',
      title: 'Request a vehicle.',
      copy: 'Send your dates and vehicle choice. JJ Autos replies with availability and a quote.',
    },
    {
      number: '02',
      label: 'VEHICLE PREPARATION',
      title: 'JJ Autos prepares the car.',
      copy: 'The team cleans, inspects, charges or fuels, and prepares the selected vehicle before handoff.',
    },
    {
      number: '03',
      label: 'PICKUP OR DELIVERY',
      title: 'Receive the vehicle.',
      copy: 'Pick up in Cupertino or request Bay Area delivery. JJ Autos reviews the vehicle controls with you at handoff.',
    },
  ];

  return (
    <section className="experience" id="experience">
      <div className="experience-banner" aria-hidden="true">
        <span>OWNER-MANAGED BOOKING AND HANDOFF.</span>
        <span className="banner-outline">
          CUPERTINO PICKUP OR BAY AREA DELIVERY.
        </span>
      </div>
      <div className="experience-inner section-pad">
        <div className="experience-intro">
          <h2>
            How rental
            <br />
            requests work.
          </h2>
          <p>
            JJ Autos confirms the dates, prepares the vehicle, and arranges
            pickup or delivery.
          </p>
        </div>
        <ol className="moment-list">
          {moments.map((moment) => (
            <li className="moment" key={moment.number}>
              <span className="moment-number" aria-hidden="true">
                {moment.number}
              </span>
              <div className="moment-copy">
                <span>{moment.label}</span>
                <h3>{moment.title}</h3>
                <p>{moment.copy}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="care-strip">
          <div>
            <span>Owner-managed from request to return</span>
          </div>
          <button type="button" onClick={onBook}>
            Check availability <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="story section-pad" id="story">
      <div className="story-topline">
        <span>JJ AUTOS / EST. 2024</span>
        <span>CUPERTINO, CALIFORNIA</span>
      </div>
      <div className="story-grid">
        <div className="story-title">
          <h2>
            Owner-operated
            <br />
            since 2024.
          </h2>
        </div>
        <div className="story-copy">
          <p className="story-lead">
            JJ Autos began renting performance vehicles in 2024. The company is
            based in Cupertino and manages a three-car fleet.
          </p>
          <p>
            The owner and team manage cleaning, maintenance, service, and
            delivery for each rental. Pickup is available in Cupertino; Bay Area
            delivery can be requested.
          </p>
          <div className="story-signature">
            <span className="signature-mark">JJ</span>
            <span>
              FOUNDER &amp; OWNER
              <br />
              JJ AUTOS
            </span>
          </div>
        </div>
      </div>
      <div className="story-principles">
        <div>
          <span>01</span>
          <strong>One point of contact</strong>
          <p>
            JJ Autos manages each request from the first question through
            vehicle return.
          </p>
        </div>
        <div>
          <span>02</span>
          <strong>Vehicle preparation</strong>
          <p>
            Each vehicle is cleaned, inspected, charged or fueled, and prepared
            before handoff.
          </p>
        </div>
        <div>
          <span>03</span>
          <strong>Pickup or delivery</strong>
          <p>Choose Cupertino pickup or request delivery in the Bay Area.</p>
        </div>
      </div>
    </section>
  );
}

function FinalCta({ onBook }: { onBook: (vehicleId: string) => void }) {
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <section className="final-cta">
      {!reduceMotion && (
        <video
          className="final-cta-film"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={GARAGE_FILM} type="video/mp4" />
        </video>
      )}
      <div className="final-cta-content">
        <h2>
          Request
          <br />
          rental dates.
        </h2>
        <div className="final-vehicle-choices">
          {vehicles.map((vehicle) => (
            <button
              type="button"
              key={vehicle.id}
              onClick={() => onBook(vehicle.id)}
            >
              <span>{vehicle.maker.toUpperCase()}</span>
              <strong>{vehicle.model}</strong>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ onBook }: { onBook: () => void }) {
  return (
    <footer>
      <div className="footer-main">
        <Logo />
        <div className="footer-location">Cupertino, California</div>
        <button type="button" onClick={onBook}>
          Check availability <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} JJ AUTOS</span>
        <span>OWNER-OPERATED PERFORMANCE RENTALS</span>
        <a href="#top">BACK TO TOP ↑</a>
      </div>
    </footer>
  );
}

type BookingState = 'idle' | 'submitting' | 'sent';

function BookingDialog({
  open,
  selectedVehicle,
  onSelectVehicle,
  onClose,
}: {
  open: boolean;
  selectedVehicle: Vehicle;
  onSelectVehicle: (vehicleId: string) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<BookingState>('idle');
  const [submitError, setSubmitError] = useState('');
  const [dateError, setDateError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const cleanupRef = useRef<null | (() => void)>(null);
  const requestRef = useRef(0);
  const minimumDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
  }, []);

  const restorePage = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  useEffect(() => {
    if (!open || cleanupRef.current) return;
    previousFocusRef.current = document.activeElement;
    setState('idle');
    setSubmitError('');
    setDateError('');
    document.body.classList.add('dialog-open');
    const pageElements = Array.from(
      document.querySelectorAll<HTMLElement>('.site-header, main, footer'),
    );
    const previous = pageElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
    }));
    pageElements.forEach((element) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
    const focusTimer = window.setTimeout(
      () => closeRef.current?.focus({ preventScroll: true }),
      40,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    cleanupRef.current = () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove('dialog-open');
      window.removeEventListener('keydown', onKeyDown);
      previous.forEach(({ element, ariaHidden, inert }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
      const previousFocus = previousFocusRef.current;
      window.requestAnimationFrame(() => {
        if (
          previousFocus instanceof HTMLElement &&
          previousFocus.isConnected &&
          previousFocus !== document.body
        ) {
          previousFocus.focus();
        } else {
          document.querySelector<HTMLElement>('.nav-trigger')?.focus();
        }
      });
    };
  }, [onClose, open]);

  useEffect(() => restorePage, [restorePage]);
  useEffect(() => {
    if (!open) requestRef.current += 1;
  }, [open]);

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startDateEntry = formData.get('startDate');
    const endDateEntry = formData.get('endDate');
    const startDate = typeof startDateEntry === 'string' ? startDateEntry : '';
    const endDate = typeof endDateEntry === 'string' ? endDateEntry : '';
    if (startDate && endDate && endDate <= startDate) {
      setDateError('Return date must be after the pickup date.');
      return;
    }
    const payload = {
      vehicle: `${selectedVehicle.maker} ${selectedVehicle.model}`,
      vehicleId: selectedVehicle.id,
      startDate,
      endDate,
      handoff: formData.get('handoff'),
      name: formData.get('name'),
      email: formData.get('email'),
      note: formData.get('note') || '',
      source: window.location.hostname,
    };
    setDateError('');
    setSubmitError('');
    const requestId = ++requestRef.current;
    setState('submitting');
    try {
      const response = await fetch(BOOKING_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Booking endpoint returned ${response.status}.`);
      }
      if (requestId === requestRef.current) setState('sent');
    } catch {
      if (requestId !== requestRef.current) return;
      setState('idle');
      setSubmitError(
        'We could not send your request. Check your connection and try again. Your entries are still here.',
      );
    }
  };

  const submitting = state === 'submitting';

  return (
    <AnimatePresence onExitComplete={restorePage}>
      {open && (
        <motion.div
          className="dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.dialog
            className="booking-dialog"
            open
            ref={dialogRef}
            aria-modal="true"
            aria-labelledby="booking-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.65, ease: EASE }}
          >
            <div className="dialog-visual">
              <div className="dialog-vehicle-mark" aria-hidden="true">
                3D
              </div>
              <span className="dialog-vehicle-index">
                LIVE GARAGE / {selectedVehicle.number}
              </span>
              <div className="dialog-visual-copy">
                <span>{selectedVehicle.eyebrow}</span>
                <strong>
                  {selectedVehicle.maker}
                  <br />
                  {selectedVehicle.model}
                </strong>
                <small>RATE CONFIRMED WITH DATES</small>
                <div className="dialog-vehicle-specs">
                  {selectedVehicle.specs.map((spec) => (
                    <span key={spec.label}>
                      <b>{spec.value}</b>
                      {spec.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="dialog-form-wrap">
              <button
                className="dialog-close"
                type="button"
                aria-label="Close booking request"
                onClick={onClose}
                ref={closeRef}
              >
                <span aria-hidden="true">×</span>
              </button>
              <AnimatePresence mode="wait">
                {state === 'sent' ? (
                  <motion.div
                    className="success-state"
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: EASE }}
                  >
                    <div className="success-icon" aria-hidden="true">
                      ✓
                    </div>
                    <span>REQUEST SUBMITTED</span>
                    <h2 id="booking-title">
                      Request
                      <br />
                      submitted.
                    </h2>
                    <p>
                      Your request was accepted by the booking service. JJ Autos
                      will reply with availability and a quote.
                    </p>
                    <button type="button" onClick={onClose}>
                      Return to site <span aria-hidden="true">→</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -15 }}
                  >
                    <h2 id="booking-title">
                      Request
                      <br />
                      rental dates.
                    </h2>
                    <p className="dialog-intro">
                      Enter your dates and contact details. JJ Autos will
                      confirm availability and send a quote.
                    </p>
                    <div className="dialog-car-toggle">
                      {vehicles.map((vehicle) => (
                        <button
                          type="button"
                          key={vehicle.id}
                          className={
                            vehicle.id === selectedVehicle.id ? 'active' : ''
                          }
                          aria-pressed={vehicle.id === selectedVehicle.id}
                          disabled={submitting}
                          onClick={() => onSelectVehicle(vehicle.id)}
                        >
                          <span>{vehicle.maker}</span>
                          <strong>{vehicle.model}</strong>
                        </button>
                      ))}
                    </div>
                    <form onSubmit={submit} aria-busy={submitting}>
                      <div className="form-row">
                        <label>
                          <span>Pickup date</span>
                          <input
                            type="date"
                            name="startDate"
                            min={minimumDate}
                            required
                          />
                        </label>
                        <label>
                          <span>Return date</span>
                          <input
                            type="date"
                            name="endDate"
                            min={minimumDate}
                            required
                          />
                        </label>
                      </div>
                      {dateError && (
                        <p className="form-error" role="alert">
                          {dateError}
                        </p>
                      )}
                      {submitError && (
                        <p className="form-error" role="alert">
                          {submitError}
                        </p>
                      )}
                      <label>
                        <span>Pickup or delivery</span>
                        <select name="handoff" defaultValue="Cupertino pickup">
                          <option>Cupertino pickup</option>
                          <option>Bay Area delivery request</option>
                        </select>
                      </label>
                      <div className="form-row">
                        <label>
                          <span>Your name</span>
                          <input
                            type="text"
                            name="name"
                            autoComplete="name"
                            placeholder="First and last name"
                            required
                          />
                        </label>
                        <label>
                          <span>Email</span>
                          <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                          />
                        </label>
                      </div>
                      <label>
                        <span>
                          Trip details <span>Optional</span>
                        </span>
                        <textarea
                          name="note"
                          rows={3}
                          placeholder="Describe your trip or delivery needs."
                        />
                      </label>
                      <button
                        className="submit-request"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting
                          ? 'Sending request...'
                          : 'Send rental request'}{' '}
                        <span aria-hidden="true">→</span>
                      </button>
                      <p className="form-disclaimer">
                        JJ Autos receives this request at its connected booking
                        inbox. No payment is collected here.
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getEmbedParentOrigin() {
  if (
    typeof window === 'undefined' ||
    new URLSearchParams(window.location.search).get('embed') !==
      'squarespace' ||
    !document.referrer
  ) {
    return null;
  }
  try {
    const origin = new URL(document.referrer).origin;
    return EMBED_ALLOWED_ORIGINS.has(origin) ? origin : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [vehicleId, setVehicleId] = useState(vehicles[0].id);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const vehicle =
    vehicles.find((candidate) => candidate.id === vehicleId) ?? vehicles[0];

  const openBooking = (nextVehicleId?: string) => {
    if (nextVehicleId) setVehicleId(nextVehicleId);
    const parentOrigin = getEmbedParentOrigin();
    if (parentOrigin && window.parent !== window) {
      const requestId = window.crypto.randomUUID();
      let acknowledged = false;
      const onMessage = (event: MessageEvent) => {
        if (
          event.origin === parentOrigin &&
          event.source === window.parent &&
          event.data?.type === 'jjautos:open-booking:ack' &&
          event.data?.requestId === requestId
        ) {
          acknowledged = true;
          window.removeEventListener('message', onMessage);
        }
      };
      window.addEventListener('message', onMessage);
      window.parent.postMessage(
        {
          type: 'jjautos:open-booking',
          vehicleId: nextVehicleId ?? vehicleId,
          requestId,
        },
        parentOrigin,
      );
      window.setTimeout(() => {
        window.removeEventListener('message', onMessage);
        if (!acknowledged) setBookingOpen(true);
      }, 1200);
      return;
    }
    setBookingOpen(true);
  };

  const closeBooking = useCallback(() => setBookingOpen(false), []);
  const markModelReady = useCallback(() => setModelReady(true), []);
  const viewVehicle = useCallback((nextVehicleId: string) => {
    setVehicleId(nextVehicleId);
    window.requestAnimationFrame(() => {
      document.getElementById('top')?.scrollIntoView({ block: 'start' });
    });
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <GarageLoader ready={modelReady} />
        <Header onBook={() => openBooking()} />
        <main>
          <GarageHero
            activeVehicle={vehicle}
            onSelect={setVehicleId}
            onBook={() => openBooking()}
            onModelReady={markModelReady}
          />
          <Fleet onBook={openBooking} onView3d={viewVehicle} />
          <Experience onBook={() => openBooking()} />
          <Story />
          <FinalCta onBook={openBooking} />
        </main>
        <Footer onBook={() => openBooking()} />
        <BookingDialog
          open={bookingOpen}
          selectedVehicle={vehicle}
          onSelectVehicle={setVehicleId}
          onClose={closeBooking}
        />
      </div>
    </MotionConfig>
  );
}
