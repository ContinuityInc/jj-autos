# JJ Autos

Owner-operated performance car rental website for JJ Autos in Cupertino,
California. The page has an interactive 3D showroom for a Chevrolet Corvette C8
2LT, BMW M4 Competition, and Tesla Model S Plaid, real photos of the Corvette,
and a rental request form.

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
- Only one viewer loads at first. On desktop, once it is ready, the other cars
  load one at a time in the background, so switching cars is instant. Phones
  and slow or data-saver connections skip this.
- Viewers that are hidden or scrolled out of view stop rendering.
- Camera framing lives in `lib/vehicles.ts`. If you change a camera, re-render
  that car's still so the hand-off from still to live model stays seamless.

## Photos

`public/cars/corvette-*.webp` are photos of the actual Corvette. License plates
and a bystander are blurred.

## 3D model credits

- 2019 Chevrolet Corvette C8 Stingray by Haris3D — CC BY 4.0
- BMW M4 G82 by rosemarinch — CC BY 4.0
- Tesla Model S Plaid 2023 by slowpoly — CC BY 4.0

The website shows source and license links for the active model in the
showroom and for all three in the footer.
