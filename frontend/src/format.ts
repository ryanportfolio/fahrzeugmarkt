import type { BodyType, FuelType, ListingStatus, SortKey, Transmission } from './types'

const priceFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })

const PS_PER_KW = 1.35962

const NOT_SPECIFIED = 'Not specified'

export function formatPrice(priceEur: number): string {
  return priceFormatter.format(priceEur)
}

// Non-breaking spaces keep a value and its unit on one line, so a card never
// wraps as "96 kW / (131 PS)".
export function formatMileage(km: number): string {
  return `${numberFormatter.format(km)} km`
}

export function formatPower(kw: number): string {
  return `${kw} kW (${Math.round(kw * PS_PER_KW)} PS)`
}

export function formatMonthYear(isoDate: string | null | undefined): string {
  if (!isoDate) return NOT_SPECIFIED
  const [year, month] = isoDate.split('-')
  if (!year || !month) return NOT_SPECIFIED
  return `${month}/${year}`
}

export function formatRegistration(isoDate: string | null | undefined): string {
  return `EZ ${formatMonthYear(isoDate)}`
}

export function formatInspection(isoDate: string | null | undefined): string {
  if (!isoDate) return 'No valid inspection'
  return `HU ${formatMonthYear(isoDate)}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return NOT_SPECIFIED
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return NOT_SPECIFIED
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatCount(value: number, singular: string, plural: string): string {
  return `${numberFormatter.format(value)} ${value === 1 ? singular : plural}`
}

const FUEL_LABELS: Record<FuelType, string> = {
  PETROL: 'Petrol',
  DIESEL: 'Diesel',
  ELECTRIC: 'Electric',
  HYBRID: 'Hybrid',
  PLUG_IN_HYBRID: 'Plug-in hybrid',
  LPG: 'LPG',
}

const TRANSMISSION_LABELS: Record<Transmission, string> = {
  MANUAL: 'Manual',
  AUTOMATIC: 'Automatic',
}

const BODY_LABELS: Record<BodyType, string> = {
  SEDAN: 'Sedan',
  ESTATE: 'Estate',
  HATCHBACK: 'Hatchback',
  SUV: 'SUV',
  COUPE: 'Coupé',
  CONVERTIBLE: 'Convertible',
  VAN: 'Van',
  PICKUP: 'Pickup',
}

const STATUS_LABELS: Record<ListingStatus, string> = {
  ACTIVE: 'Active',
  FLAGGED: 'Flagged',
  REMOVED: 'Removed',
}

export const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  price_asc: 'Price, lowest first',
  price_desc: 'Price, highest first',
  mileage_asc: 'Mileage, lowest first',
  year_desc: 'Registration, newest first',
}

export function fuelLabel(value: FuelType | string): string {
  return FUEL_LABELS[value as FuelType] ?? titleCase(value)
}

export function transmissionLabel(value: Transmission | string): string {
  return TRANSMISSION_LABELS[value as Transmission] ?? titleCase(value)
}

export function bodyLabel(value: BodyType | string): string {
  return BODY_LABELS[value as BodyType] ?? titleCase(value)
}

export function statusLabel(value: ListingStatus | string): string {
  return STATUS_LABELS[value as ListingStatus] ?? titleCase(value)
}

export function sortLabel(value: SortKey | string): string {
  return SORT_LABELS[value as SortKey] ?? titleCase(value)
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function specLine(listing: {
  firstRegistration: string
  mileageKm: number
  powerKw: number
  fuelType: FuelType
  transmission: Transmission
}): string {
  return [
    formatRegistration(listing.firstRegistration),
    formatMileage(listing.mileageKm),
    formatPower(listing.powerKw),
    fuelLabel(listing.fuelType),
    transmissionLabel(listing.transmission),
  ].join(' · ')
}

// Cards split the spec line into two fixed rows. Letting one long line wrap
// on its own leaves a separator dangling at the end of a line.
export function specGroups(listing: {
  firstRegistration: string
  mileageKm: number
  powerKw: number
  fuelType: FuelType
  transmission: Transmission
}): [string, string] {
  return [
    [formatRegistration(listing.firstRegistration), formatMileage(listing.mileageKm)].join(' · '),
    [
      formatPower(listing.powerKw),
      fuelLabel(listing.fuelType),
      transmissionLabel(listing.transmission),
    ].join(' · '),
  ]
}

export function isNew(createdAt: string, now: number = Date.now()): boolean {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return now - created < 7 * 24 * 60 * 60 * 1000
}
