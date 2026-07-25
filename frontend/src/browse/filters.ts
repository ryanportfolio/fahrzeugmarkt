import { bodyLabel, formatMileage, formatPrice, formatPower, fuelLabel, transmissionLabel } from '../format'
import type { BodyType, FuelType, ListingQuery, SortKey, Transmission } from '../types'

export interface FilterState {
  q: string
  make: string
  model: string
  yearFrom: number | null
  yearTo: number | null
  priceFrom: number | null
  priceTo: number | null
  mileageFrom: number | null
  mileageTo: number | null
  powerFrom: number | null
  powerTo: number | null
  fuelType: FuelType[]
  transmission: Transmission[]
  bodyType: BodyType[]
}

export type MultiField = 'fuelType' | 'transmission' | 'bodyType'

export type RangeField =
  | 'yearFrom'
  | 'yearTo'
  | 'priceFrom'
  | 'priceTo'
  | 'mileageFrom'
  | 'mileageTo'
  | 'powerFrom'
  | 'powerTo'

export interface FilterChip {
  id: string
  label: string
  field: keyof FilterState
  value?: string
}

export const SORT_KEYS: SortKey[] = ['newest', 'price_asc', 'price_desc', 'mileage_asc', 'year_desc']

export const PAGE_SIZE = 24

export function emptyFilters(): FilterState {
  return {
    q: '',
    make: '',
    model: '',
    yearFrom: null,
    yearTo: null,
    priceFrom: null,
    priceTo: null,
    mileageFrom: null,
    mileageTo: null,
    powerFrom: null,
    powerTo: null,
    fuelType: [],
    transmission: [],
    bodyType: [],
  }
}

type RawQuery = Record<string, string | null | Array<string | null> | undefined>

function firstString(value: string | null | Array<string | null> | undefined): string {
  if (Array.isArray(value)) return firstString(value[0])
  return typeof value === 'string' ? value : ''
}

function asNumber(value: string | null | Array<string | null> | undefined): number | null {
  const raw = firstString(value)
  if (!raw.trim()) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function asList<T extends string>(
  value: string | null | Array<string | null> | undefined,
  allowed: readonly T[],
): T[] {
  const raw = Array.isArray(value) ? value : [value]
  const seen = new Set<T>()
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const upper = item.toUpperCase() as T
    if (allowed.includes(upper)) seen.add(upper)
  }
  return [...seen]
}

const FUELS: readonly FuelType[] = [
  'PETROL',
  'DIESEL',
  'ELECTRIC',
  'HYBRID',
  'PLUG_IN_HYBRID',
  'LPG',
]
const TRANSMISSIONS: readonly Transmission[] = ['MANUAL', 'AUTOMATIC']
const BODIES: readonly BodyType[] = [
  'SEDAN',
  'ESTATE',
  'HATCHBACK',
  'SUV',
  'COUPE',
  'CONVERTIBLE',
  'VAN',
  'PICKUP',
]

export function filtersFromQuery(query: RawQuery): FilterState {
  return {
    q: firstString(query.q),
    make: firstString(query.make),
    model: firstString(query.model),
    yearFrom: asNumber(query.yearFrom),
    yearTo: asNumber(query.yearTo),
    priceFrom: asNumber(query.priceFrom),
    priceTo: asNumber(query.priceTo),
    mileageFrom: asNumber(query.mileageFrom),
    mileageTo: asNumber(query.mileageTo),
    powerFrom: asNumber(query.powerFrom),
    powerTo: asNumber(query.powerTo),
    fuelType: asList(query.fuelType, FUELS),
    transmission: asList(query.transmission, TRANSMISSIONS),
    bodyType: asList(query.bodyType, BODIES),
  }
}

export function sortFromQuery(query: RawQuery): SortKey {
  const raw = firstString(query.sort) as SortKey
  return SORT_KEYS.includes(raw) ? raw : 'newest'
}

export function pageFromQuery(query: RawQuery): number {
  const raw = asNumber(query.page)
  return raw !== null && raw > 0 ? Math.floor(raw) : 0
}

export function filtersToQuery(
  filters: FilterState,
  sort: SortKey,
  page: number,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}
  if (filters.q.trim()) query.q = filters.q.trim()
  if (filters.make) query.make = filters.make
  if (filters.model) query.model = filters.model
  const ranges: RangeField[] = [
    'yearFrom',
    'yearTo',
    'priceFrom',
    'priceTo',
    'mileageFrom',
    'mileageTo',
    'powerFrom',
    'powerTo',
  ]
  for (const field of ranges) {
    const value = filters[field]
    if (value !== null) query[field] = String(value)
  }
  if (filters.fuelType.length) query.fuelType = [...filters.fuelType]
  if (filters.transmission.length) query.transmission = [...filters.transmission]
  if (filters.bodyType.length) query.bodyType = [...filters.bodyType]
  if (sort !== 'newest') query.sort = sort
  if (page > 0) query.page = String(page)
  return query
}

export function filtersToApiQuery(filters: FilterState, sort: SortKey, page: number): ListingQuery {
  return {
    q: filters.q.trim() || undefined,
    make: filters.make || undefined,
    model: filters.model || undefined,
    yearFrom: filters.yearFrom ?? undefined,
    yearTo: filters.yearTo ?? undefined,
    priceFrom: filters.priceFrom ?? undefined,
    priceTo: filters.priceTo ?? undefined,
    mileageFrom: filters.mileageFrom ?? undefined,
    mileageTo: filters.mileageTo ?? undefined,
    powerFrom: filters.powerFrom ?? undefined,
    powerTo: filters.powerTo ?? undefined,
    fuelType: filters.fuelType.length ? filters.fuelType : undefined,
    transmission: filters.transmission.length ? filters.transmission : undefined,
    bodyType: filters.bodyType.length ? filters.bodyType : undefined,
    sort,
    page,
    size: PAGE_SIZE,
  }
}

export function hasActiveFilters(filters: FilterState): boolean {
  return activeChips(filters).length > 0
}

function rangeLabel(
  name: string,
  from: number | null,
  to: number | null,
  render: (value: number) => string,
): string {
  if (from !== null && to !== null) return `${name} ${render(from)} to ${render(to)}`
  if (from !== null) return `${name} from ${render(from)}`
  return `${name} up to ${render(to as number)}`
}

export function activeChips(filters: FilterState): FilterChip[] {
  const chips: FilterChip[] = []

  if (filters.q.trim()) {
    chips.push({ id: 'q', label: `Search "${filters.q.trim()}"`, field: 'q' })
  }
  if (filters.make) chips.push({ id: 'make', label: filters.make, field: 'make' })
  if (filters.model) chips.push({ id: 'model', label: filters.model, field: 'model' })

  if (filters.yearFrom !== null || filters.yearTo !== null) {
    chips.push({
      id: 'year',
      label: rangeLabel('Year', filters.yearFrom, filters.yearTo, (value) => String(value)),
      field: 'yearFrom',
    })
  }
  if (filters.priceFrom !== null || filters.priceTo !== null) {
    chips.push({
      id: 'price',
      label: rangeLabel('Price', filters.priceFrom, filters.priceTo, formatPrice),
      field: 'priceFrom',
    })
  }
  if (filters.mileageFrom !== null || filters.mileageTo !== null) {
    chips.push({
      id: 'mileage',
      label: rangeLabel('Mileage', filters.mileageFrom, filters.mileageTo, formatMileage),
      field: 'mileageFrom',
    })
  }
  if (filters.powerFrom !== null || filters.powerTo !== null) {
    chips.push({
      id: 'power',
      label: rangeLabel('Power', filters.powerFrom, filters.powerTo, formatPower),
      field: 'powerFrom',
    })
  }

  for (const value of filters.fuelType) {
    chips.push({ id: `fuelType:${value}`, label: fuelLabel(value), field: 'fuelType', value })
  }
  for (const value of filters.transmission) {
    chips.push({
      id: `transmission:${value}`,
      label: transmissionLabel(value),
      field: 'transmission',
      value,
    })
  }
  for (const value of filters.bodyType) {
    chips.push({ id: `bodyType:${value}`, label: bodyLabel(value), field: 'bodyType', value })
  }

  return chips
}

export function removeChip(filters: FilterState, chip: FilterChip): FilterState {
  const next: FilterState = {
    ...filters,
    fuelType: [...filters.fuelType],
    transmission: [...filters.transmission],
    bodyType: [...filters.bodyType],
  }

  switch (chip.id) {
    case 'q':
      next.q = ''
      break
    case 'make':
      next.make = ''
      next.model = ''
      break
    case 'model':
      next.model = ''
      break
    case 'year':
      next.yearFrom = null
      next.yearTo = null
      break
    case 'price':
      next.priceFrom = null
      next.priceTo = null
      break
    case 'mileage':
      next.mileageFrom = null
      next.mileageTo = null
      break
    case 'power':
      next.powerFrom = null
      next.powerTo = null
      break
    default: {
      const field = chip.field as MultiField
      next[field] = (next[field] as string[]).filter((item) => item !== chip.value) as never
    }
  }

  return next
}

type AnyQuery = Record<string, unknown>

function normalizeQueryValue(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value.filter((item) => item !== null).map(String)
  return [String(value)]
}

export function queriesEqual(a: AnyQuery, b: AnyQuery): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const left = normalizeQueryValue(a[key])
    const right = normalizeQueryValue(b[key])
    if (left.length !== right.length) return false
    for (let i = 0; i < left.length; i += 1) {
      if (left[i] !== right[i]) return false
    }
  }
  return true
}
