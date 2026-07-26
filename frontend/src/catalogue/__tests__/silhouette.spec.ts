import { describe, expect, it } from 'vitest'
import { isSeedDrawing, toSilhouette } from '../silhouette'

/* Lifting a car out of its studio means injecting a response into the document as
 * markup. These tests hold the two properties that makes safe: only the generated
 * drawings are ever eligible, and what comes back carries no studio and no shared
 * ids. */

const STUDIO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
<defs><linearGradient id="sky"><stop offset="0"/></linearGradient>
<linearGradient id="paint"><stop offset="0"/></linearGradient>
<radialGradient id="glow"><stop offset="0"/></radialGradient>
<linearGradient id="floor"><stop offset="0"/></linearGradient>
<radialGradient id="floorlight"><stop offset="0"/></radialGradient>
<radialGradient id="shadow"><stop offset="0"/></radialGradient>
<linearGradient id="vignette"><stop offset="0"/></linearGradient>
<clipPath id="bodyclip"><rect/></clipPath></defs>
<rect x="0" y="0" width="1200" height="800" fill="url(#sky)"/>
<rect x="0" y="0" width="1200" height="620" fill="url(#glow)"/>
<rect x="0" y="620" width="1200" height="180" fill="url(#floor)"/>
<ellipse cx="476" cy="680" rx="620" ry="140" fill="url(#floorlight)"/>
<rect x="0" y="619" width="1200" height="2" fill="hsl(220 30% 62%)"/>
<ellipse cx="612" cy="634" rx="462" ry="34" fill="url(#shadow)"/>
<path d="M 190 552 L 1035 552 Z" fill="url(#paint)" clip-path="url(#bodyclip)"/>
<rect x="0" y="0" width="1200" height="800" fill="url(#vignette)"/></svg>`

describe('isSeedDrawing', () => {
  it('accepts a generated drawing', () => {
    expect(isSeedDrawing('/api/images/seed/11-0.svg')).toBe(true)
    expect(isSeedDrawing('/prototype/fahrzeugmarkt/api/images/seed/218-2.svg')).toBe(true)
  })

  it('refuses a seller upload, which is a photograph and never inlined', () => {
    expect(isSeedDrawing('/api/images/upload/9f3a1c.png')).toBe(false)
    expect(isSeedDrawing('/api/images/upload/9f3a1c.svg')).toBe(false)
  })

  it('refuses anything that only ends in the seed suffix', () => {
    expect(isSeedDrawing('https://evil.test/api/images/upload/x.svg?a=/api/images/seed/1-0.svg')).toBe(
      false,
    )
    expect(isSeedDrawing('/api/images/upload/x.svg#/api/images/seed/1-0.svg')).toBe(false)
    expect(isSeedDrawing(null)).toBe(false)
    expect(isSeedDrawing('')).toBe(false)
  })
})

describe('toSilhouette', () => {
  const { markup } = toSilhouette(STUDIO)

  it('drops every element painted with a studio gradient', () => {
    for (const fill of ['sky', 'glow', 'floor', 'floorlight', 'vignette', 'shadow']) {
      expect(markup).not.toContain(`url(#${fill}-`)
    }
  })

  it('drops the horizon rule laid across the canvas at the ground line', () => {
    expect(markup).not.toContain('y="619"')
  })

  it('keeps the car', () => {
    expect(markup).toContain('M 190 552 L 1035 552 Z')
  })

  it('returns inner markup only, so it can go under a cropped viewBox', () => {
    expect(markup).not.toContain('<svg')
    expect(markup).not.toContain('</svg>')
  })

  it('rewrites ids per instance, so two cars on one page keep their own paint', () => {
    const a = toSilhouette(STUDIO).markup
    const b = toSilhouette(STUDIO).markup
    const idOf = (m: string) => m.match(/id="paint-([^"]+)"/)?.[1]
    expect(idOf(a)).toBeDefined()
    expect(idOf(b)).toBeDefined()
    expect(idOf(a)).not.toBe(idOf(b))
    // The reference has to move with the definition or the fill breaks.
    expect(a).toContain(`url(#paint-${idOf(a)})`)
    expect(b).toContain(`url(#paint-${idOf(b)})`)
  })

  it('rewrites clip path references too', () => {
    expect(markup).toMatch(/clip-path="url\(#bodyclip-[^)]+\)"/)
  })
})
