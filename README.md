# JJ Autos

Owner-operated performance car rental website for JJ Autos in Cupertino,
California. The page has an interactive 3D showroom for the fleet (a Chevrolet
Corvette C8 2LT, a BMW M4 Competition, and six Teslas), real photos of the
Corvette, and a rental request form.

## The fleet

Every car is one entry in `lib/vehicles.ts`. The showroom picker, fleet cards,
request form, and footer credits are all built from that list, and so is the
"four cars, and four more arriving soon" copy.

A car that has not been delivered yet has `arriving: true`. It gets an
"Arriving soon" tag and a note in the request form, and still takes date
requests. Delete that line once the car is here.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
pnpm lint
pnpm build
```

## How the 3D showroom loads

- The layout preloads the Sketchfab viewer script, so it downloads while the
  page's own JavaScript is still loading.
- Each car has a still image rendered from the same camera as its live model,
  in `public/cars/<id>-3d-*.webp`. The still shows straight away, and the live
  model fades in over it once it is ready. If WebGL is unavailable, the still
  stays.
- Only one viewer loads at first. On desktop, once it is ready, the next cars
  load one at a time in the background, so switching to them is instant. Phones
  and slow or data-saver connections skip this.
- At most three cars stay loaded, because each one holds its own WebGL viewer.
  Showing a fourth drops the one that was shown longest ago, and it loads again
  from its still if the visitor comes back to it.
- Viewers that are hidden or scrolled out of view stop rendering.
- Camera framing lives in `lib/vehicles.ts`. If you change a camera, re-render
  that car's still so the hand-off from still to live model stays seamless. A
  still is the viewer's own `getScreenShot` at that camera with a 32° field of
  view, a transparent background and the vignette off, cropped evenly around
  the centre of the frame.

## Photos

`public/cars/corvette-*.webp` are photos of the actual Corvette. License plates
and a bystander are blurred.

## 3D model credits

- 2019 Chevrolet Corvette C8 Stingray by Haris3D — CC BY 4.0
- BMW M4 G82 by rosemarinch — CC BY 4.0
- Tesla Model S Plaid 2023 by slowpoly — CC BY 4.0
- 2021 Tesla Model Y by tonielpro520 — CC BY 4.0 (used for both Model Ys)
- Tesla model 3 2024 by brandonleong28 — CC BY 4.0
- TESLA MODEL X (Part 1) by Number1FanGuy98 — CC BY 4.0
- Tesla Cybertruck by TAIGA-ZOE — CC BY 4.0

The website shows source and license links for the active model in the
showroom and for every model in the footer.
