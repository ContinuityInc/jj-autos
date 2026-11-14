'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, SyntheticEvent } from 'react';
import {
  SKETCHFAB_VERSION,
  canPreloadModels,
  loadSketchfab,
  readProgress,
  whenIdle,
} from '@/lib/sketchfab';
import type { ViewerApi } from '@/lib/sketchfab';
import {
  BOOKING_ENDPOINT,
  buildBookingPayload,
  getEmbedParentOrigin,
  validateBookingDates,
} from '@/lib/booking';
import {
  DESKTOP_FOV,
  MOBILE_FOV,
  cameraFor,
  getVehicle,
  nextVehicleToPreload,
  vehicles,
} from '@/lib/vehicles';
import type { Photo, Vehicle } from '@/lib/vehicles';
// Slow connections can take a while on the first model. The timer restarts
// whenever Sketchfab reports progress, so this only trips on a stalled load.
const LOAD_TIMEOUT_MS = 30_000;

const VIEWER_OPTIONS = {
  autostart: 1,
  camera: 0,
  dnt: 1,
  preload: 0,
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
};

type ViewerStatus = 'loading' | 'ready' | 'error';

function Header({ onBook }: { onBook: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header" ref={headerRef}>
      <a className="wordmark" href="#top">
        JJ Autos
      </a>
      <nav
        className={`site-nav${menuOpen ? ' is-open' : ''}`}
        id="site-nav"
        aria-label="Main"
      >
        <a href="#fleet" onClick={closeMenu}>
          Fleet
        </a>
        <a href="#how" onClick={closeMenu}>
          How it works
        </a>
        <a href="#about" onClick={closeMenu}>
          About
        </a>
      </nav>
      <button
        className="button button--primary header-cta"
        type="button"
        onClick={() => {
          closeMenu();
          onBook();
        }}
      >
        Request dates
      </button>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={() => setMenuOpen((open) => !open)}
        ref={toggleRef}
      >
        {menuOpen ? 'Close' : 'Menu'}
      </button>
    </header>
  );
}

function ModelViewer({
  vehicle,
  active,
  running,
  onStatus,
  onProgress,
}: {
  vehicle: Vehicle;
  active: boolean;
  running: boolean;
  onStatus: (id: string, status: ViewerStatus) => void;
  onProgress: (id: string, progress: number) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<ViewerApi | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const { id, model3d } = vehicle;
    const small = window.matchMedia('(max-width: 640px)').matches;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const fail = () => {
      window.clearTimeout(timer);
      if (alive) onStatus(id, 'error');
    };
    const armTimeout = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fail, LOAD_TIMEOUT_MS);
    };
    armTimeout();

    loadSketchfab()
      .then((Sketchfab) => {
        if (!alive || !iframeRef.current) return;
        new Sketchfab(SKETCHFAB_VERSION, iframeRef.current).init(model3d.uid, {
          ...VIEWER_OPTIONS,
          autospin: reduceMotion ? 0 : 0.06,
          max_texture_size: small ? 1024 : 2048,
          success: (api) => {
            if (!alive) {
              api.stop();
              return;
            }
            apiRef.current = api;
            api.addEventListener('modelLoadProgress', (event) => {
              const progress = readProgress(event);
              if (!alive || progress === undefined) return;
              armTimeout();
              onProgress(id, progress);
            });
            api.addEventListener('viewerready', () => {
              if (!alive) return;
              window.clearTimeout(timer);
              const { position, target } = cameraFor(vehicle, small);
              api.setFov(small ? MOBILE_FOV : DESKTOP_FOV);
              api.setCameraLookAt(position, target, 0);
              setReady(true);
              onStatus(id, 'ready');
            });
            api.start();
          },
          error: fail,
        });
      })
      .catch(fail);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      apiRef.current?.stop();
      apiRef.current = null;
    };
  }, [onProgress, onStatus, vehicle]);

  // Only the visible car renders. Cached cars stay loaded but paused, so
  // switching back to them is instant without burning GPU in the background.
  useEffect(() => {
    if (!ready) return;
    if (running) apiRef.current?.start();
    else apiRef.current?.stop();
  }, [ready, running]);

  const resetView = () => {
    const small = window.matchMedia('(max-width: 640px)').matches;
    const { position, target } = cameraFor(vehicle, small);
    apiRef.current?.setCameraLookAt(position, target, 0.7);
  };

  return (
    <div
      className={`viewer${active ? ' is-active' : ''}${ready ? ' is-ready' : ''}`}
      inert={!active}
    >
      <iframe
        ref={iframeRef}
        title={`3D model of the ${vehicle.maker} ${vehicle.model}`}
        allow="autoplay; fullscreen"
      />
      {active && ready && (
        <button className="viewer-reset" type="button" onClick={resetView}>
          Reset view
        </button>
      )}
    </div>
  );
}

function Showroom({
  vehicle,
  onSelect,
  onBook,
}: {
  vehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
  onBook: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [mountedIds, setMountedIds] = useState<string[]>(() => [vehicle.id]);
  const [statuses, setStatuses] = useState<Record<string, ViewerStatus>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [inView, setInView] = useState(true);

  // A car becomes mounted the first time it is shown and then stays cached.
  if (!mountedIds.includes(vehicle.id)) {
    setMountedIds((ids) =>
      ids.includes(vehicle.id) ? ids : [...ids, vehicle.id],
    );
  }

  const mount = useCallback((id: string) => {
    setMountedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);
  const handleStatus = useCallback((id: string, status: ViewerStatus) => {
    setStatuses((current) =>
      current[id] === status ? current : { ...current, [id]: status },
    );
  }, []);
  const handleProgress = useCallback((id: string, value: number) => {
    setProgress((current) => ({ ...current, [id]: value }));
  }, []);

  const statusOf = (id: string) => statuses[id] ?? 'loading';
  const activeStatus = statusOf(vehicle.id);
  const activeProgress = progress[vehicle.id] ?? 0;

  // Once nothing is downloading, quietly load the next car in line so the
  // picker switches instantly. One at a time, so the visible car never
  // competes for bandwidth.
  const busy = mountedIds.some((id) => (statuses[id] ?? 'loading') === 'loading');
  const nextToPreload = nextVehicleToPreload(vehicle.id, mountedIds);

  useEffect(() => {
    if (busy || !nextToPreload || activeStatus !== 'ready') return;
    if (!canPreloadModels()) return;
    return whenIdle(() => mount(nextToPreload));
  }, [activeStatus, busy, mount, nextToPreload]);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const retry = (id: string) => {
    setStatuses((current) => ({ ...current, [id]: 'loading' }));
    setProgress((current) => ({ ...current, [id]: 0 }));
    setAttempts((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  };

  const credit = vehicle.model3d;
  const poster = vehicle.model3d.poster;

  return (
    <section
      className="showroom"
      id="top"
      ref={sectionRef}
      aria-labelledby="showroom-title"
    >
      <div className="stage">
        {/* A still of the car from the same camera, shown until the live
            model is ready. It stays up if WebGL is unavailable. The first
            car's still is the page's largest image, so it loads first.
            Images here are pre-sized WebP files with srcset: next/image needs
            a Cloudflare Images binding this site doesn't have. */}
        {/* oxlint-disable-next-line nextjs/no-img-element */}
        <img
          key={vehicle.id}
          className={`stage-poster${activeStatus === 'ready' ? ' is-hidden' : ''}`}
          src={`${poster.src}-900.webp`}
          srcSet={`${poster.src}-900.webp 900w, ${poster.src}-1800.webp 1800w`}
          sizes="(max-width: 640px) 100vw, 66vw"
          alt=""
          fetchPriority={vehicle.id === vehicles[0].id ? 'high' : 'auto'}
          decoding="async"
          style={{ '--poster-h': poster.heightRatio } as CSSProperties}
        />
        {vehicles
          .filter((item) => mountedIds.includes(item.id))
          .map((item) => (
            <ModelViewer
              key={`${item.id}-${attempts[item.id] ?? 0}`}
              vehicle={item}
              active={item.id === vehicle.id}
              running={item.id === vehicle.id && inView}
              onStatus={handleStatus}
              onProgress={handleProgress}
            />
          ))}

        <div className="stage-intro">
          <h1 id="showroom-title">Performance car rentals in Cupertino</h1>
          <p>Three cars, run by their owner. Pickup or Bay Area delivery.</p>
        </div>

        <output className="stage-loading">
          {activeStatus === 'loading' && (
            <>
              <span>Loading 3D</span>
              <span
                className={`progress${activeProgress > 0 ? '' : ' progress--waiting'}`}
                aria-hidden="true"
              >
                <span
                  style={{ width: `${Math.round(activeProgress * 100)}%` }}
                />
              </span>
            </>
          )}
          {activeStatus === 'error' && (
            <>
              <span>3D view didn’t load.</span>
              <button type="button" onClick={() => retry(vehicle.id)}>
                Try again
              </button>
            </>
          )}
        </output>

        <div className="stage-foot">
          <p className="stage-credit">
            Representative model:{' '}
            <a href={credit.source} target="_blank" rel="noreferrer">
              {credit.title}
            </a>{' '}
            by {credit.author},{' '}
            <a href={credit.licenseUrl} target="_blank" rel="noreferrer">
              {credit.license}
            </a>
          </p>
        </div>
      </div>

      <div className="showroom-bar">
        <div className="showroom-car" key={vehicle.id}>
          <p className="showroom-maker">{vehicle.maker}</p>
          <h2>{vehicle.model}</h2>
          <p className="showroom-summary">{vehicle.summary}</p>
        </div>
        <div className="showroom-actions">
          <button
            className="button button--primary"
            type="button"
            onClick={onBook}
          >
            Request dates
          </button>
          <a className="button button--quiet" href={`#${vehicle.id}`}>
            Specs
          </a>
        </div>
        <fieldset className="picker">
          <legend className="sr-only">Choose a car</legend>
          {vehicles.map((item) => {
            const selected = item.id === vehicle.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                className={selected ? 'is-selected' : undefined}
                onPointerEnter={() => mount(item.id)}
                onFocus={() => mount(item.id)}
                onClick={() => onSelect(item.id)}
              >
                <span>{item.maker}</span>
                {item.shortName}
              </button>
            );
          })}
        </fieldset>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing the {vehicle.maker} {vehicle.model}.
      </p>
    </section>
  );
}

function PhotoGallery({ photos, label }: { photos: Photo[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = (next + photos.length) % photos.length;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="gallery" aria-label={label}>
      <div
        className="gallery-track"
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          setIndex(Math.round(track.scrollLeft / track.clientWidth));
        }}
      >
        {photos.map((photo) => (
          // oxlint-disable-next-line nextjs/no-img-element
          <img
            key={photo.src}
            src={`${photo.src}-800.webp`}
            srcSet={`${photo.src}-800.webp 800w, ${photo.src}-1200.webp 1200w`}
            sizes="(max-width: 960px) 100vw, 400px"
            width={800}
            height={600}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            style={photo.focus ? { objectPosition: photo.focus } : undefined}
          />
        ))}
      </div>
      <span className="media-tag">Our car</span>
      <div className="gallery-controls">
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(index - 1)}
        >
          ‹
        </button>
        <span aria-live="polite">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(index + 1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}

function CarMedia({
  vehicle,
  onView3d,
}: {
  vehicle: Vehicle;
  onView3d: (vehicleId: string) => void;
}) {
  if (vehicle.photos?.length) {
    return (
      <PhotoGallery
        photos={vehicle.photos}
        label={`Photos of the ${vehicle.maker} ${vehicle.model}`}
      />
    );
  }
  const poster = vehicle.model3d.poster;
  return (
    <button
      className="render"
      type="button"
      onClick={() => onView3d(vehicle.id)}
      aria-label={`View the ${vehicle.maker} ${vehicle.model} in 3D`}
    >
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img
        src={`${poster.src}-900.webp`}
        srcSet={`${poster.src}-900.webp 900w, ${poster.src}-1800.webp 1800w`}
        sizes="(max-width: 960px) 100vw, 400px"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="media-tag">3D render</span>
    </button>
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
    <section className="section" id="fleet" aria-labelledby="fleet-title">
      <div className="section-head">
        <h2 id="fleet-title">The fleet</h2>
        <p>
          Three cars, each owned and maintained by JJ Autos. Rates depend on
          your dates and whether you need delivery, so every request gets its
          own quote.
        </p>
      </div>
      <div className="fleet-grid">
        {vehicles.map((vehicle) => (
          <article
            className="car"
            id={vehicle.id}
            key={vehicle.id}
            aria-labelledby={`${vehicle.id}-name`}
          >
            <CarMedia vehicle={vehicle} onView3d={onView3d} />
            <p className="car-maker">{vehicle.maker}</p>
            <h3 id={`${vehicle.id}-name`}>{vehicle.model}</h3>
            <p className="car-summary">{vehicle.summary}</p>
            <dl className="car-specs">
              {vehicle.specs.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
            <p className="car-description">{vehicle.description}</p>
            <div className="car-actions">
              <button
                className="button button--primary"
                type="button"
                onClick={() => onBook(vehicle.id)}
              >
                Request dates
              </button>
              <button
                className="button button--outline"
                type="button"
                onClick={() => onView3d(vehicle.id)}
              >
                View in 3D
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="fine-print">
        * Manufacturer 0–60 mph figures. Tesla’s subtracts a one-foot rollout.
        † Requires the Z51 Performance Package. Real-world times depend on
        conditions, so ask about each car’s exact configuration.
      </p>
    </section>
  );
}

const steps = [
  {
    title: 'Send a request',
    copy: 'Pick a car, your dates, and whether you want to pick up in Cupertino or have it delivered. You’ll get availability and a quote by email.',
  },
  {
    title: 'We get the car ready',
    copy: 'Before every rental the car is cleaned, inspected, and fueled or charged.',
  },
  {
    title: 'Pick up or get it delivered',
    copy: 'Collect the car in Cupertino or have it brought to you in the Bay Area. We’ll walk you through the controls before you drive off.',
  },
];

function HowItWorks() {
  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="section-head">
        <h2 id="how-title">How it works</h2>
      </div>
      <ol className="steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="step-number" aria-hidden="true">
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function About() {
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="about">
        <h2 id="about-title">About JJ Autos</h2>
        <div className="about-copy">
          <p className="lead">
            JJ Autos is a small rental business in Cupertino, run by its owner
            since 2024.
          </p>
          <p>
            There are three cars, and the owner and a small team handle every
            booking, cleaning, service, and delivery themselves. You deal with
            the same people from your first message until you hand the keys
            back.
          </p>
          <dl className="facts">
            <div>
              <dt>Based in</dt>
              <dd>Cupertino, California</dd>
            </div>
            <div>
              <dt>Renting since</dt>
              <dd>2024</dd>
            </div>
            <div>
              <dt>Handoff</dt>
              <dd>Pickup in Cupertino or Bay Area delivery</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function RequestBand({ onBook }: { onBook: (vehicleId: string) => void }) {
  return (
    <section className="request-band" aria-labelledby="request-title">
      <div className="request-band-copy">
        <h2 id="request-title">Check dates for a car</h2>
        <p>
          Pick one and send your dates. You’ll hear back with availability and a
          quote.
        </p>
      </div>
      <div className="request-band-cars">
        {vehicles.map((vehicle) => (
          <button
            type="button"
            key={vehicle.id}
            onClick={() => onBook(vehicle.id)}
          >
            <span>{vehicle.maker}</span>
            <strong>{vehicle.model}</strong>
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <a className="wordmark" href="#top">
            JJ Autos
          </a>
          <p>Performance car rentals in Cupertino, California.</p>
        </div>
        <nav aria-label="Footer">
          <a href="#fleet">Fleet</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
        </nav>
      </div>
      <p className="credits">
        3D models are representative and may differ from the rental cars in
        color and options:{' '}
        {vehicles.map((vehicle, index) => (
          <span key={vehicle.id}>
            <a href={vehicle.model3d.source} target="_blank" rel="noreferrer">
              {vehicle.model3d.title}
            </a>{' '}
            by {vehicle.model3d.author}
            {index < vehicles.length - 1 ? ', ' : ''}
          </span>
        ))}
        , all{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 4.0
        </a>
        .
      </p>
      <p className="copyright">© {new Date().getFullYear()} JJ Autos</p>
    </footer>
  );
}

type BookingState = 'idle' | 'submitting' | 'sent';

function todayInLocalTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function BookingForm({
  vehicle,
  onSelectVehicle,
  onClose,
}: {
  vehicle: Vehicle;
  onSelectVehicle: (vehicleId: string) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<BookingState>('idle');
  const [error, setError] = useState('');
  const [minimumDate] = useState(todayInLocalTime);
  const [startDate, setStartDate] = useState('');
  const [sentTo, setSentTo] = useState({ name: '', email: '' });

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const read = (key: string) => {
      const value = formData.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };
    const start = read('startDate');
    const end = read('endDate');
    const dateError = validateBookingDates(start, end);
    if (dateError) {
      setError(dateError);
      return;
    }
    const payload = buildBookingPayload({
      vehicle,
      fields: {
        startDate: start,
        endDate: end,
        handoff: read('handoff'),
        name: read('name'),
        email: read('email'),
        note: read('note'),
      },
      source: window.location.hostname,
    });
    setError('');
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
      setSentTo({ name: payload.name, email: payload.email });
      setState('sent');
    } catch {
      setState('idle');
      setError(
        'Your request didn’t go through. Check your connection and try again. Everything you entered is still here.',
      );
    }
  };

  if (state === 'sent') {
    const firstName = sentTo.name.split(/\s+/)[0];
    return (
      <div className="booking-sent">
        <h2 id="booking-title">Request sent</h2>
        <p>
          Thanks{firstName ? `, ${firstName}` : ''}. We’ll reply to{' '}
          <strong>{sentTo.email}</strong> with availability and a quote for the{' '}
          {vehicle.maker} {vehicle.model}.
        </p>
        <button
          className="button button--primary"
          type="button"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    );
  }

  const submitting = state === 'submitting';

  return (
    <>
      <h2 id="booking-title">Request dates</h2>
      <p className="booking-intro">
        We’ll email you with availability and a quote. Nothing is charged here.
      </p>
      <form onSubmit={submit} aria-busy={submitting}>
        <fieldset className="car-choice" disabled={submitting}>
          <legend>Car</legend>
          {vehicles.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={item.id === vehicle.id}
              onClick={() => onSelectVehicle(item.id)}
            >
              <span>{item.maker}</span>
              {item.shortName}
            </button>
          ))}
        </fieldset>
        <div className="field-row">
          <label>
            Pickup date
            <input
              type="date"
              name="startDate"
              min={minimumDate}
              required
              onChange={(event) => setStartDate(event.currentTarget.value)}
            />
          </label>
          <label>
            Return date
            <input
              type="date"
              name="endDate"
              min={startDate || minimumDate}
              required
            />
          </label>
        </div>
        <label>
          Pickup or delivery
          <select name="handoff" defaultValue="Cupertino pickup">
            <option value="Cupertino pickup">Pick up in Cupertino</option>
            <option value="Bay Area delivery request">
              Deliver in the Bay Area
            </option>
          </select>
        </label>
        <div className="field-row">
          <label>
            Name
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
        </div>
        <label>
          <span>
            Anything else? <span className="optional">Optional</span>
          </span>
          <textarea
            name="note"
            rows={3}
            placeholder="Occasion, delivery address, questions"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button--primary button--wide"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Sending…' : 'Send request'}
        </button>
      </form>
    </>
  );
}

function BookingDialog({
  open,
  formKey,
  vehicle,
  onSelectVehicle,
  onClose,
}: {
  open: boolean;
  formKey: number;
  vehicle: Vehicle;
  onSelectVehicle: (vehicleId: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // A click that starts and ends on the dialog element itself landed on the
  // backdrop, since the content wrapper fills the dialog box.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let pressedBackdrop = false;
    const onPointerDown = (event: PointerEvent) => {
      pressedBackdrop = event.target === dialog;
    };
    const onClick = (event: MouseEvent) => {
      if (pressedBackdrop && event.target === dialog) onClose();
    };
    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('click', onClick);
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('click', onClick);
    };
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('dialog-open');
    return () => document.documentElement.classList.remove('dialog-open');
  }, [open]);

  return (
    <dialog
      className="booking"
      ref={dialogRef}
      aria-labelledby="booking-title"
      onClose={onClose}
    >
      <div className="booking-body">
        <button
          className="booking-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        {formKey > 0 && (
          <BookingForm
            key={formKey}
            vehicle={vehicle}
            onSelectVehicle={onSelectVehicle}
            onClose={onClose}
          />
        )}
      </div>
    </dialog>
  );
}

function readEmbedParentOrigin() {
  if (typeof window === 'undefined') return null;
  return getEmbedParentOrigin({
    search: window.location.search,
    referrer: document.referrer,
  });
}

export default function Home() {
  const [vehicleId, setVehicleId] = useState(vehicles[0].id);
  const [booking, setBooking] = useState({ open: false, key: 0 });
  const vehicle = getVehicle(vehicleId);

  const showBooking = () =>
    setBooking((current) => ({ open: true, key: current.key + 1 }));

  const openBooking = (nextVehicleId?: string) => {
    if (nextVehicleId) setVehicleId(nextVehicleId);
    const parentOrigin = readEmbedParentOrigin();
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
        if (!acknowledged) showBooking();
      }, 1200);
      return;
    }
    showBooking();
  };

  const closeBooking = useCallback(
    () => setBooking((current) => ({ ...current, open: false })),
    [],
  );
  const viewIn3d = useCallback((nextVehicleId: string) => {
    setVehicleId(nextVehicleId);
    window.requestAnimationFrame(() => {
      document.getElementById('top')?.scrollIntoView({ block: 'start' });
    });
  }, []);

  return (
    <>
      <Header onBook={() => openBooking()} />
      <main>
        <Showroom
          vehicle={vehicle}
          onSelect={setVehicleId}
          onBook={() => openBooking()}
        />
        <Fleet onBook={openBooking} onView3d={viewIn3d} />
        <HowItWorks />
        <About />
        <RequestBand onBook={openBooking} />
      </main>
      <Footer />
      <BookingDialog
        open={booking.open}
        formKey={booking.key}
        vehicle={vehicle}
        onSelectVehicle={setVehicleId}
        onClose={closeBooking}
      />
    </>
  );
}
