import type { BodyType } from '../types'

/* Drawing geometry for the catalogue.
 *
 * The seed artwork is vector, side profile, and every car stands on the same
 * ground line at y=620 of a 1200x800 canvas. Two jobs here.
 *
 * The first is cropping. The renderer does not give every body type the same
 * share of the canvas: it draws a hatchback across 845 units and a pickup across
 * 935, so a single fixed crop leaves each drawing with a different amount of
 * empty air beside it. The crop wraps each body type exactly instead.
 *
 * The second is relative size, so a supermini is drawn smaller than an estate
 * rather than every car being stretched to fill its own box. Nothing on the
 * surface claims a measurement or prints a length. This is proportion only, and
 * the numbers below are drawing data, not listing data.
 */

/** Horizontal extent the renderer gives each body type, as [x, width] in canvas
 *  units. Mirrors the profile table in SeedImageService.profile(): the pair is
 *  its rearX and frontX - rearX. */
const BODY_EXTENT: Record<BodyType, { x: number; width: number }> = {
  SEDAN: { x: 140, width: 930 },
  ESTATE: { x: 140, width: 930 },
  HATCHBACK: { x: 190, width: 845 },
  SUV: { x: 150, width: 910 },
  COUPE: { x: 145, width: 930 },
  CONVERTIBLE: { x: 145, width: 925 },
  VAN: { x: 140, width: 920 },
  PICKUP: { x: 140, width: 935 },
}

/** Vertical crop, shared by every body type. The bottom edge is the ground line
 *  at y=620, so bottom-aligning two drawings of different sizes stands both cars
 *  on one baseline. The top clears the tallest roof the renderer draws, which is
 *  the van at y=248. */
const CROP_TOP = 232
const CROP_HEIGHT = 388

/** The narrowest crop, and so the tallest a drawing can get per unit of width.
 *  The drawing slot reserves this ratio for every vehicle, which keeps a row of
 *  plates the same height whatever is in it. */
export const RESERVE_ASPECT = 845 / CROP_HEIGHT

export function plateViewBox(bodyType: BodyType): string {
  const extent = BODY_EXTENT[bodyType] ?? BODY_EXTENT.SEDAN
  return `${extent.x} ${CROP_TOP} ${extent.width} ${CROP_HEIGHT}`
}

export function plateAspect(bodyType: BodyType): number {
  return (BODY_EXTENT[bodyType] ?? BODY_EXTENT.SEDAN).width / CROP_HEIGHT
}

const MODEL_LENGTH_MM: Record<string, number> = {
  // Volkswagen
  Golf: 4284,
  Passat: 4917,
  Tiguan: 4509,
  Polo: 4053,
  'ID.3': 4261,
  // BMW
  '1 Series': 4361,
  '3 Series': 4709,
  '5 Series': 5060,
  X3: 4708,
  // Mercedes-Benz
  'A-Class': 4419,
  'C-Class': 4751,
  'E-Class': 4949,
  GLC: 4716,
  // Audi
  A3: 4343,
  A4: 4762,
  A6: 4939,
  Q5: 4682,
  // Opel
  Corsa: 4060,
  Astra: 4374,
  // Ford
  Fiesta: 4040,
  Focus: 4378,
  // Škoda
  Fabia: 4108,
  Octavia: 4689,
  // Toyota
  Yaris: 3940,
  Corolla: 4630,
  // Renault
  Clio: 4053,
  // Hyundai
  i30: 4340,
  // Tesla
  'Model 3': 4720,
}

/** The size a full-width drawing corresponds to. Fixed rather than derived from
 *  the current result set, so a car does not change size when a filter is applied
 *  and the longest car in view changes. Set to the longest vehicle in the
 *  catalogue, so one drawing does reach the full width. */
export const SCALE_CEILING_MM = 5060

/** Mid-size stand-in for a model this table does not know. */
const FALLBACK_LENGTH_MM = 4400

export function modelLengthMm(model: string): number {
  return MODEL_LENGTH_MM[model] ?? FALLBACK_LENGTH_MM
}

/** Fraction of the drawing slot this vehicle occupies, 0 to 1. Because the crop
 *  wraps the car, this is also the fraction of the slot the car itself covers. */
export function lengthFraction(model: string): number {
  return Math.min(modelLengthMm(model), SCALE_CEILING_MM) / SCALE_CEILING_MM
}
