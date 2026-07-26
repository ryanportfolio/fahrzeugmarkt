export type Role = 'BUYER' | 'SELLER' | 'ADMIN'

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUG_IN_HYBRID' | 'LPG'

export type Transmission = 'MANUAL' | 'AUTOMATIC'

export type BodyType =
  | 'SEDAN'
  | 'ESTATE'
  | 'HATCHBACK'
  | 'SUV'
  | 'COUPE'
  | 'CONVERTIBLE'
  | 'VAN'
  | 'PICKUP'

export type ListingStatus = 'ACTIVE' | 'FLAGGED' | 'REMOVED'

export type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'mileage_asc' | 'year_desc'

export interface UserDto {
  id: number
  email: string
  displayName: string
  role: Role
  city: string | null
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  role: Exclude<Role, 'ADMIN'>
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ListingCardDto {
  id: number
  title: string
  make: string
  model: string
  priceEur: number
  firstRegistration: string
  mileageKm: number
  powerKw: number
  fuelType: FuelType
  transmission: Transmission
  bodyType: BodyType
  city: string | null
  coverImageUrl: string | null
  createdAt: string
}

export interface SellerListingDto extends ListingCardDto {
  status: ListingStatus
  imageCount: number
  inquiryCount: number
  savedCount: number
}

/* The moderation queue is its own projection, not a card with extra fields on it.
 * Declaring it as `extends ListingCardDto` claimed a dozen vehicle fields the API
 * record does not carry, so the page read undefined off every row and threw before
 * it painted. It is the seven fields the endpoint actually returns. */
export interface AdminListingDto {
  id: number
  title: string
  priceEur: number
  status: ListingStatus
  sellerEmail: string
  sellerDisplayName: string
  createdAt: string
}

export interface VehicleDetailDto {
  make: string
  model: string
  bodyType: BodyType
  fuelType: FuelType
  transmission: Transmission
  color: string
  mileageKm: number
  powerKw: number
  doors: number | null
  seats: number | null
  firstRegistration: string
  nextInspection: string | null
}

export interface SellerDto {
  id: number
  displayName: string
  city: string | null
  phone: string | null
  memberSince: string
}

export interface ListingImageDto {
  id: number
  url: string
  sortOrder: number
}

export interface ListingDetailDto {
  id: number
  title: string
  description: string
  priceEur: number
  status: ListingStatus
  createdAt: string
  vehicle: VehicleDetailDto
  seller: SellerDto
  images: ListingImageDto[]
  savedByMe: boolean
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface FacetBucket {
  value: string
  count: number
}

export interface FacetsDto {
  makes: FacetBucket[]
  fuelTypes: FacetBucket[]
  transmissions: FacetBucket[]
  bodyTypes: FacetBucket[]
}

export interface MetaMakeDto {
  name: string
  models: string[]
}

export interface MetaDto {
  makes: MetaMakeDto[]
  fuelTypes: FuelType[]
  transmissions: Transmission[]
  bodyTypes: BodyType[]
  sorts: SortKey[]
}

export interface VehicleInput {
  makeName: string
  modelName: string
  bodyType: BodyType
  fuelType: FuelType
  transmission: Transmission
  color: string
  mileageKm: number
  powerKw: number
  doors: number | null
  seats: number | null
  firstRegistration: string
  nextInspection: string | null
}

export interface ListingInput {
  title: string
  description: string
  priceEur: number
  vehicle: VehicleInput
}

export interface ContactRequest {
  name: string
  email: string
  message: string
}

export interface InquiryDto {
  id: number
  listingId: number
  listingTitle?: string
  senderName: string
  senderEmail: string
  message: string
  createdAt: string
}

export interface ApiErrorBody {
  status: number
  message: string
  fieldErrors?: Record<string, string>
}

export interface ListingQuery {
  make?: string
  model?: string
  yearFrom?: number
  yearTo?: number
  priceFrom?: number
  priceTo?: number
  mileageFrom?: number
  mileageTo?: number
  powerFrom?: number
  powerTo?: number
  fuelType?: FuelType[]
  transmission?: Transmission[]
  bodyType?: BodyType[]
  q?: string
  sort?: SortKey
  page?: number
  size?: number
}
