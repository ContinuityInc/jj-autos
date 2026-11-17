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
  /**
   * The car is not in the fleet yet. It is listed with an "Arriving soon"
   * tag and still takes date requests. Remove this once the car is here.
   */
  arriving?: boolean;
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
      'Three electric motors and all-wheel drive add up to 1,020 hp. It seats five and runs silently, and ours is white.',
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
  {
    id: 'model-y',
    maker: 'Tesla',
    model: 'Model Y Long Range',
    shortName: 'Model Y',
    summary: 'Dual-motor all-wheel drive, 327 miles of range',
    description:
      'The everyday one. Two motors drive all four wheels, the hatch swallows luggage for five, and a full charge is rated at 327 miles. Ours is black.',
    specs: [
      { value: '327 mi', label: 'EPA range' },
      { value: '4.6 s*', label: '0–60 mph' },
      { value: 'AWD', label: 'Drive' },
      { value: '5', label: 'Seats' },
    ],
    model3d: {
      uid: '59e2ead369984b1a85c800ff6cf6789d',
      title: '2021 Tesla Model Y',
      author: 'tonielpro520',
      source:
        'https://sketchfab.com/3d-models/2021-tesla-model-y-59e2ead369984b1a85c800ff6cf6789d',
      ...CC_BY,
      camera: {
        position: [-5.245, -3.678, 1.614],
        target: [0.003, -0.004, 0.827],
      },
      poster: {
        src: '/cars/model-y-3d',
        widthRatio: 0.5881,
        heightRatio: 0.7433,
      },
    },
  },
  {
    // Same 3D model as the Long Range, seen from the other side so the two
    // read as different cars in the showroom.
    id: 'model-y-performance',
    maker: 'Tesla',
    model: 'Model Y Performance',
    shortName: 'Model Y Performance',
    summary: '460 hp dual-motor, all-wheel drive',
    description:
      'The quick Model Y: 460 hp through all four wheels, with the same five seats and hatch as the Long Range. Ours is on order in dark gray.',
    specs: [
      { value: '460 hp', label: 'Power' },
      { value: '3.3 s*', label: '0–60 mph' },
      { value: 'AWD', label: 'Drive' },
      { value: '5', label: 'Seats' },
    ],
    arriving: true,
    model3d: {
      uid: '59e2ead369984b1a85c800ff6cf6789d',
      title: '2021 Tesla Model Y',
      author: 'tonielpro520',
      source:
        'https://sketchfab.com/3d-models/2021-tesla-model-y-59e2ead369984b1a85c800ff6cf6789d',
      ...CC_BY,
      camera: {
        position: [4.958, -4.087, 1.614],
        target: [-0.289, -0.413, 0.827],
      },
      poster: {
        src: '/cars/model-y-performance-3d',
        widthRatio: 0.5719,
        heightRatio: 0.7433,
      },
    },
  },
  {
    id: 'model-3',
    maker: 'Tesla',
    model: 'Model 3 Performance',
    shortName: 'Model 3 Performance',
    summary: '510 hp dual-motor, all-wheel drive',
    description:
      'Tesla’s compact sport sedan: 510 hp, all-wheel drive, and room for five.',
    specs: [
      { value: '510 hp', label: 'Power' },
      { value: '2.9 s*', label: '0–60 mph' },
      { value: 'AWD', label: 'Drive' },
      { value: '5', label: 'Seats' },
    ],
    arriving: true,
    model3d: {
      uid: '36c52f3f89f6439c90310f14e8ff33f2',
      title: 'Tesla model 3 2024',
      author: 'brandonleong28',
      source:
        'https://sketchfab.com/3d-models/tesla-model-3-2024-36c52f3f89f6439c90310f14e8ff33f2',
      ...CC_BY,
      camera: {
        position: [9.491, -27.205, 5.343],
        target: [-5.108, -9.807, 2.555],
      },
      poster: {
        src: '/cars/model-3-3d',
        widthRatio: 0.5923,
        heightRatio: 0.705,
      },
    },
  },
  {
    id: 'model-x',
    maker: 'Tesla',
    model: 'Model X Plaid',
    shortName: 'Model X Plaid',
    summary: '1,020 hp tri-motor, all-wheel drive',
    description:
      'The Model S Plaid’s three motors and 1,020 hp in an SUV, with falcon-wing rear doors and six seats.',
    specs: [
      { value: '1,020 hp', label: 'Power' },
      { value: '2.5 s*', label: '0–60 mph' },
      { value: 'AWD', label: 'Drive' },
      { value: '6', label: 'Seats' },
    ],
    arriving: true,
    model3d: {
      uid: 'b69c8d8f607e4822b93eaf277bd36588',
      title: 'TESLA MODEL X (Part 1)',
      author: 'Number1FanGuy98',
      source:
        'https://sketchfab.com/3d-models/tesla-model-x-part-1-b69c8d8f607e4822b93eaf277bd36588',
      ...CC_BY,
      camera: {
        position: [-186.14, -98.5, 63.91],
        target: [39.52, 59.51, 30.08],
      },
      poster: {
        src: '/cars/model-x-3d',
        widthRatio: 0.7165,
        heightRatio: 0.7633,
      },
    },
  },
  {
    id: 'cybertruck',
    maker: 'Tesla',
    model: 'Cybertruck Cyberbeast',
    shortName: 'Cyberbeast',
    summary: '845 hp tri-motor, all-wheel drive',
    description:
      'The three-motor Cybertruck: 845 hp, all-wheel drive, a stainless-steel body, and a six-foot bed. It seats five.',
    specs: [
      { value: '845 hp', label: 'Power' },
      { value: '2.6 s*', label: '0–60 mph' },
      { value: 'AWD', label: 'Drive' },
      { value: '5', label: 'Seats' },
    ],
    arriving: true,
    model3d: {
      uid: '8950fc178e254c9198b2a8555ef1590a',
      title: 'Tesla Cybertruck',
      author: 'TAIGA-ZOE',
      source:
        'https://sketchfab.com/3d-models/tesla-cybertruck-8950fc178e254c9198b2a8555ef1590a',
      ...CC_BY,
      camera: {
        position: [-225.5, 335.22, 35.77],
        target: [8.32, 1.28, -14.28],
      },
      poster: {
        src: '/cars/cybertruck-3d',
        widthRatio: 0.7319,
        heightRatio: 0.885,
      },
    },
  },
];
