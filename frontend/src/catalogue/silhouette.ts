/* Lifts the car out of its studio photograph.
 *
 * The API renders each vehicle as an SVG of a car standing in a lit studio: a
 * sky wash, a floor, a pool of light, a horizon line and a closing vignette,
 * with the car drawn in the middle of it. Treated as a photograph the whole
 * thing gets cropped into a thumbnail and the drawing underneath is wasted.
 *
 * So the studio is removed and the car is kept. What comes back is a
 * transparent side profile that can be scaled, aligned to a shared baseline,
 * lit by the page instead of by a baked gradient, and set at whatever size the
 * layout wants. The lighting that is thrown away here is put back in CSS, where
 * it can respond to the theme and to hover.
 *
 * Two things have to be handled for this to work at all:
 *
 *   1. Every rendered SVG uses the same gradient ids (paint, glass, rim, ...).
 *      Inlining more than one on a page would make every car take the first
 *      car's paint. Ids are rewritten per instance.
 *   2. The document is a full <svg> element. Only its inner markup is wanted,
 *      under a viewBox cropped to the car, so the box ends on the ground line
 *      and two drawings at different scales share a baseline.
 */

/** Fills that belong to the studio rather than to the car. */
const STUDIO_FILLS = ['sky', 'glow', 'floor', 'floorlight', 'vignette', 'shadow']

const NAMESPACED_IDS = [
  'sky',
  'glow',
  'floor',
  'floorlight',
  'shadow',
  'paint',
  'glass',
  'tyre',
  'rim',
  'head',
  'tail',
  'sheen',
  'vignette',
  'bodyclip',
]

let counter = 0

export interface Silhouette {
  /** Inner markup of the drawing, ready to inject under a cropped viewBox. */
  markup: string
}

/* Only the generated drawings are ever inlined.
 *
 * Lifting a car out of its studio means injecting the response into the document
 * as markup, and that is only safe for a response the server composed itself from
 * a fixed template. Seller uploads are served from a different path and are
 * currently restricted to jpeg, png and webp, so none of them could be inlined
 * today, but the safety of this function must not depend on a validation rule
 * living in another service. Anything that is not a seed drawing is refused here
 * and shown as an ordinary image instead. */
const SEED_PATH = /\/api\/images\/seed\/\d+-\d+\.svg$/

export function isSeedDrawing(url: string | null | undefined): boolean {
  if (!url) return false
  // Compare the path alone, so a query string or host cannot smuggle the suffix.
  const path = url.split('?')[0].split('#')[0]
  return SEED_PATH.test(path)
}

function stripStudio(markup: string): string {
  let out = markup

  // Whole self-closing elements painted with a studio gradient.
  for (const fill of STUDIO_FILLS) {
    const element = new RegExp(`<(rect|ellipse|circle|path)\\b[^>]*fill="url\\(#${fill}\\)"[^>]*/>`, 'g')
    out = out.replace(element, '')
  }

  // The horizon: a 2px rule laid across the full canvas at the ground line.
  out = out.replace(/<rect\b[^>]*\by="619"[^>]*\/>/g, '')

  return out
}

function namespaceIds(markup: string, uid: string): string {
  let out = markup
  for (const id of NAMESPACED_IDS) {
    out = out.replace(new RegExp(`id="${id}"`, 'g'), `id="${id}-${uid}"`)
    out = out.replace(new RegExp(`url\\(#${id}\\)`, 'g'), `url(#${id}-${uid})`)
  }
  return out
}

/** Pulls the inner markup out of an <svg> document without parsing it as XML,
 *  which would reject the document if the renderer ever emits an entity. */
function innerMarkup(document: string): string {
  const open = document.indexOf('>', document.indexOf('<svg'))
  const close = document.lastIndexOf('</svg>')
  if (open < 0 || close < 0) return ''
  return document.slice(open + 1, close)
}

export function toSilhouette(svgDocument: string): Silhouette {
  counter += 1
  const uid = `c${counter}`
  return { markup: namespaceIds(stripStudio(innerMarkup(svgDocument)), uid) }
}

const cache = new Map<string, Promise<Silhouette>>()

export function loadSilhouette(url: string): Promise<Silhouette> {
  if (!isSeedDrawing(url)) {
    return Promise.reject(new Error('Not a generated drawing, so not inlined'))
  }

  const hit = cache.get(url)
  if (hit) return hit

  const pending = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Drawing unavailable: ${response.status}`)
      return response.text()
    })
    .then(toSilhouette)
    .catch((error: unknown) => {
      // A failed drawing must not be cached, or a transient network error would
      // leave that car blank for the rest of the session.
      cache.delete(url)
      throw error
    })

  cache.set(url, pending)
  return pending
}
