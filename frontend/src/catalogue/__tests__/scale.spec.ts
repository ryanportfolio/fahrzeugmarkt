import { describe, expect, it } from 'vitest'
import {
  SCALE_CEILING_MM,
  lengthFraction,
  modelLengthMm,
  plateAspect,
  plateViewBox,
} from '../scale'
import type { BodyType } from '../../types'

/* Nothing on the surface prints a length, but the drawings are still sized
 * relative to each other, and that quietly broke once: the crop was one fixed box
 * for every body type, while the renderer draws a hatchback across 845 canvas
 * units and a pickup across 935, so scaling the box by length scaled the car by
 * length times its body type. A 4.69 m hatchback came out visibly shorter than a
 * 4.34 m estate beside it.
 *
 * These are the tests that would have caught it. Sizing that contradicts itself
 * reads as a bug whether or not a number is printed next to it. */

const BODY_TYPES: BodyType[] = [
  'SEDAN',
  'ESTATE',
  'HATCHBACK',
  'SUV',
  'COUPE',
  'CONVERTIBLE',
  'VAN',
  'PICKUP',
]

/* The extent SeedImageService.profile() actually draws each body type across,
 * transcribed from the renderer rather than from scale.ts, so the two have to
 * agree for these tests to pass. Given as frontX - rearX in canvas units. */
const RENDERED_EXTENT: Record<BodyType, number> = {
  SEDAN: 1070 - 140,
  ESTATE: 1070 - 140,
  HATCHBACK: 1035 - 190,
  SUV: 1060 - 150,
  COUPE: 1075 - 145,
  CONVERTIBLE: 1070 - 145,
  VAN: 1060 - 140,
  PICKUP: 1075 - 140,
}

/** Width in px the car itself occupies, which is what the reader measures.
 *
 *  The SVG is laid out at `lengthFraction` of the slot and maps its viewBox width
 *  onto that, so one canvas unit is `boxPx / viewBoxWidth` px, and the car covers
 *  its rendered extent of them. When the crop wraps the car the two cancel; when
 *  it does not, this is where the error shows up. */
function drawnWidth(model: string, bodyType: BodyType, slotPx: number): number {
  const boxPx = lengthFraction(model) * slotPx
  const [, , viewBoxWidth] = plateViewBox(bodyType).split(' ').map(Number)
  return boxPx * (RENDERED_EXTENT[bodyType] / viewBoxWidth)
}

describe('catalogue scale', () => {
  it('draws a given length the same size whatever the body type', () => {
    const slot = 1000
    const pxPerMetre = BODY_TYPES.map((bodyType) => {
      const width = drawnWidth('Octavia', bodyType, slot)
      return width / (modelLengthMm('Octavia') / 1000)
    })
    for (const value of pxPerMetre) {
      expect(value).toBeCloseTo(pxPerMetre[0], 6)
    }
  })

  it('draws a longer car longer than a shorter one across different body types', () => {
    // The exact pair that used to invert: a hatchback Octavia against an estate i30.
    const octavia = drawnWidth('Octavia', 'HATCHBACK', 1000)
    const i30 = drawnWidth('i30', 'ESTATE', 1000)
    expect(modelLengthMm('Octavia')).toBeGreaterThan(modelLengthMm('i30'))
    expect(octavia).toBeGreaterThan(i30)
  })

  it('wraps each body type with the extent the renderer actually draws', () => {
    expect(plateViewBox('HATCHBACK')).toBe('190 232 845 388')
    expect(plateViewBox('SEDAN')).toBe('140 232 930 388')
    expect(plateAspect('HATCHBACK')).toBeCloseTo(845 / 388, 6)
  })

  it('never asks for more than the full slot', () => {
    const models = ['5 Series', 'Octavia', 'Yaris', 'Model 3']
    for (const model of models) {
      expect(lengthFraction(model)).toBeGreaterThan(0)
      expect(lengthFraction(model)).toBeLessThanOrEqual(1)
    }
  })

  it('gives the longest vehicle in the catalogue the full slot', () => {
    expect(lengthFraction('5 Series')).toBe(1)
    expect(modelLengthMm('5 Series')).toBe(SCALE_CEILING_MM)
  })

  it('falls back to a mid-size length for a model it does not know', () => {
    expect(modelLengthMm('Not A Real Model')).toBe(4400)
  })
})
