import { buildQuery, request, upload } from './client'
import type {
  AdminListingDto,
  ContactRequest,
  FacetsDto,
  InquiryDto,
  ListingCardDto,
  ListingDetailDto,
  ListingImageDto,
  ListingInput,
  ListingQuery,
  ListingStatus,
  LoginRequest,
  MetaDto,
  PageResponse,
  RegisterRequest,
  SellerListingDto,
  UserDto,
} from '../types'

function listingParams(query: ListingQuery): string {
  return buildQuery({
    make: query.make,
    model: query.model,
    yearFrom: query.yearFrom,
    yearTo: query.yearTo,
    priceFrom: query.priceFrom,
    priceTo: query.priceTo,
    mileageFrom: query.mileageFrom,
    mileageTo: query.mileageTo,
    powerFrom: query.powerFrom,
    powerTo: query.powerTo,
    fuelType: query.fuelType,
    transmission: query.transmission,
    bodyType: query.bodyType,
    q: query.q,
    sort: query.sort,
    page: query.page,
    size: query.size,
  })
}

export const api = {
  register: (body: RegisterRequest) => request<UserDto>('/auth/register', { method: 'POST', body }),
  login: (body: LoginRequest) => request<UserDto>('/auth/login', { method: 'POST', body }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<UserDto>('/auth/me'),

  meta: () => request<MetaDto>('/meta'),

  searchListings: (query: ListingQuery, signal?: AbortSignal) =>
    request<PageResponse<ListingCardDto>>(`/listings${listingParams(query)}`, { signal }),
  facets: (query: ListingQuery, signal?: AbortSignal) =>
    request<FacetsDto>(`/listings/facets${listingParams(query)}`, { signal }),
  listing: (id: number) => request<ListingDetailDto>(`/listings/${id}`),

  createListing: (body: ListingInput) =>
    request<ListingDetailDto>('/listings', { method: 'POST', body }),
  updateListing: (id: number, body: ListingInput) =>
    request<ListingDetailDto>(`/listings/${id}`, { method: 'PUT', body }),
  deleteListing: (id: number) => request<void>(`/listings/${id}`, { method: 'DELETE' }),

  uploadImage: (listingId: number, file: File) =>
    upload<ListingImageDto>(`/listings/${listingId}/images`, file),
  deleteImage: (imageId: number) => request<void>(`/images/${imageId}`, { method: 'DELETE' }),

  contact: (listingId: number, body: ContactRequest) =>
    request<void>(`/listings/${listingId}/contact`, { method: 'POST', body }),

  savedListings: () => request<ListingCardDto[]>('/saved'),
  save: (listingId: number) => request<void>(`/saved/${listingId}`, { method: 'PUT' }),
  unsave: (listingId: number) => request<void>(`/saved/${listingId}`, { method: 'DELETE' }),

  sellerListings: () => request<SellerListingDto[]>('/seller/listings'),
  sellerInquiries: () => request<InquiryDto[]>('/seller/inquiries'),

  adminListings: (status?: ListingStatus) =>
    request<AdminListingDto[]>(`/admin/listings${buildQuery({ status })}`),
  adminFlag: (id: number) => request<void>(`/admin/listings/${id}/flag`, { method: 'POST' }),
  adminApprove: (id: number) => request<void>(`/admin/listings/${id}/approve`, { method: 'POST' }),
}
