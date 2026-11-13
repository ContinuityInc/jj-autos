export type Vec3 = [number, number, number];

export type Photo = {
  /** Path without the width suffix; files exist at -800.webp and -1200.webp. */
  src: string;
  alt: string;
  /** CSS object-position, to keep the car in frame when cropped. */
  focus?: string;
};

export type Vehicle = {
  id: string;
  maker: string;
  model: string;
  shortName: string;
  summary: string;
  description: string;
  specs: Array<{ value: string; label: string }>;
  /** Real photos of the car. Shown in its fleet card when present. */
  photos?: Photo[];
  model3d: {
    uid: string;
    title: string;
    author: string;
    source: string;
    license: string;
    licenseUrl: string;
    /** Desktop framing, used with a 32° field of view. */
    camera: { position: Vec3; target: Vec3 };
    /**
     * A still of the model rendered from `camera`, shown while the live
     * viewer loads. Ratios are the crop's size relative to the render frame,
     * so CSS can draw the still at the same size as the live model.
     * Files exist at -900.webp and -1800.webp.
     */
    poster: { src: string; widthRatio: number; heightRatio: number };
  };
};

/** Phones pull the camera back by this much and widen the field of view. */
export const MOBILE_CAMERA_DISTANCE = 1.9;
export const DESKTOP_FOV = 32;
export const MOBILE_FOV = 42;

const CC_BY = {
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};

export function getVehicle(id: string) {
  return vehicles.find((vehicle) => vehicle.id === id) ?? vehicles[0];
}

/** Pull the camera back on phones so the whole car stays in frame. */
export function cameraFor(vehicle: Vehicle, small: boolean) {
  const { position, target } = vehicle.model3d.camera;
  if (!small) return { position, target };
  return {
    position: position.map(
      (value, index) =>
        target[index] + (value - target[index]) * MOBILE_CAMERA_DISTANCE,
    ),
    target,
  };
}

export const vehicles: Vehicle[] = [
  {
    id: 'corvette',
    maker: 'Chevrolet',
    model: 'Corvette C8 2LT',
    shortName: 'Corvette C8',
    summary: '490 hp mid-engine V8, rear-wheel drive',
    description:
      'The 6.2-liter V8 sits right behind the seats and sends its power to the rear wheels through an eight-speed dual-clutch gearbox. Ours is red, with the tall rear wing.',
    specs: [
      { value: '490 hp', label: 'Power' },
      { value: '2.9 s†', label: '0–60 mph' },
      { value: 'RWD', label: 'Drive' },
      { value: '2', label: 'Seats' },
    ],
    photos: [
      {
        src: '/cars/corvette-side',
        alt: 'The red Corvette parked in a garage, seen from the driver’s side',
        focus: '50% 45%',
      },
      {
        src: '/cars/corvette-front',
        alt: 'Front of the Corvette, seen from above',
      },
      {
        src: '/cars/corvette-rear-wheel',
        alt: 'Rear three-quarter view of the Corvette showing the tall rear wing',
      },
      {
        src: '/cars/corvette-rear',
        alt: 'Rear of the Corvette, showing the taillights and exhaust',
      },
    ],
    model3d: {
      uid: '790c40ccff6843eab0b7b4bd18421ff8',
      title: '2019 Chevrolet Corvette C8 Stingray',
      author: 'Haris3D',
      source:
        'https://sketchfab.com/3d-models/2019-chevrolet-corvette-c8-stingray-790c40ccff6843eab0b7b4bd18421ff8',
      ...CC_BY,
      camera: { position: [5.774, 2.794, 1.469], target: [0, -0.003, 0.681] },
      poster: {
        src: '/cars/corvette-3d',
        widthRatio: 0.6639,
        heightRatio: 0.637,
      },
    },
  },
  {
    // The id stays 'bmw' so booking payloads and the Squarespace embed
    // messages keep the same vehicle key they had before the M4 replaced the
    // 840i.
    id: 'bmw',
    maker: 'BMW',
    model: 'M4 Competition',
    shortName: 'M4 Competition',
    summary: '503 hp twin-turbo inline-six, rear-wheel drive',
    description:
      "BMW's twin-turbo 3.0-liter inline-six sends 503 hp to the rear wheels through an eight-speed automatic. It seats four, and ours is white.",
    specs: [
      { value: '503 hp', label: 'Power' },
      { value: '3.8 s*', label: '0–60 mph' },
      { value: 'RWD', label: 'Drive' },
      { value: '4', label: 'Seats' },
    ],
    model3d: {
      uid: '5a9007d569a846548dbf352877550c4e',
      title: 'BMW M4 G82',
      author: 'rosemarinch',
      source:
        'https://sketchfab.com/3d-models/bmw-m4-g82-5a9007d569a846548dbf352877550c4e',
      ...CC_BY,
      camera: { position: [-3.732, 4.454, 1.429], target: [0.005, 0, 0.715] },
      poster: { src: '/cars/bmw-3d', widthRatio: 0.6625, heightRatio: 0.7772 },
    },
  },
  {
    id: 'tesla',
    maker: 'Tesla',
    model: 'Model S Plaid',
    shortName: 'Model S Plaid',
    summary: '1,020 hp tri-motor, all-wheel drive',
    description:
      'Three electric motors and all-wheel drive add up to 1,020 hp. It seats five and runs silently, which makes it the most practical of the three.',
    specs: [
      { value: '1,020 hp', label: 'Power' },
      { value: '1.99 s*', label: '0–60 mph' },
      { value: 'AWD', label: 'Drive' },
      { value: '5', label: 'Seats' },
    ],
    model3d: {
      uid: 'aec912ed367b4aebacc8676922f42beb',
      title: 'Tesla Model S Plaid 2023',
      author: 'slowpoly',
      source:
        'https://sketchfab.com/3d-models/tesla-model-s-plaid-2023-aec912ed367b4aebacc8676922f42beb',
      ...CC_BY,
      camera: {
        position: [168.439, -243.897, 69.831],
        target: [0.095, 0.053, 33.438],
      },
      poster: {
        src: '/cars/tesla-3d',
        widthRatio: 0.7903,
        heightRatio: 0.9472,
      },
    },
  },
];
