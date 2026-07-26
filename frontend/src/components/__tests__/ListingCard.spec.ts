import { describe, expect, it } from 'vitest'
import { RouterLinkStub, mount } from '@vue/test-utils'
import ListingCard from '../ListingCard.vue'
import type { ListingCardDto } from '../../types'

const listing: ListingCardDto = {
  id: 42,
  title: 'BMW 3 Series 320d Sport Line',
  make: 'BMW',
  model: '3 Series',
  priceEur: 24990,
  firstRegistration: '2019-03-01',
  mileageKm: 68500,
  powerKw: 110,
  fuelType: 'DIESEL',
  transmission: 'AUTOMATIC',
  bodyType: 'SEDAN',
  city: 'Hamburg',
  coverImageUrl: '/api/images/seed/42-0.svg',
  createdAt: '2020-01-01T10:00:00Z',
}

function render(overrides: Partial<ListingCardDto> = {}, props: Record<string, unknown> = {}) {
  return mount(ListingCard, {
    props: { listing: { ...listing, ...overrides }, ...props },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

function normalize(value: string): string {
  return value.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('ListingCard', () => {
  it('renders the price in German currency format', () => {
    const wrapper = render()
    expect(normalize(wrapper.get('.price').text())).toBe('24.990 €')
  })

  it('sets the family as a label above the variant so neither repeats the other', () => {
    const wrapper = render()
    expect(wrapper.get('.family').text()).toBe('BMW 3 Series')
    expect(wrapper.get('.title').text()).toBe('320d Sport Line')
  })

  it('keeps a title whole when it does not open with the make and model', () => {
    const wrapper = render({ title: 'Sport Line 320d' })
    expect(wrapper.get('.title').text()).toBe('Sport Line 320d')
  })

  it('renders registration, mileage and power as three labelled columns', () => {
    const columns = render()
      .findAll('.spec')
      .map((column) => [
        normalize(column.get('dt').text()),
        normalize(column.get('dd').text()),
      ])
    expect(columns).toEqual([
      ['EZ', '03/2019'],
      ['km', '68.500'],
      ['kW (PS)', '110 (150)'],
    ])
  })

  it('carries the unit in the column label so the values stay bare figures', () => {
    const values = render()
      .findAll('.spec-value')
      .map((value) => value.text())
    expect(values.some((value) => /km|kW|PS/.test(value))).toBe(false)
  })

  it('shows the drivetrain, body type and city', () => {
    const wrapper = render()
    expect(normalize(wrapper.get('.drivetrain').text())).toBe('Diesel · Automatic')
    expect(wrapper.get('.body-tag').text()).toBe('Sedan')
    expect(wrapper.get('.city').text()).toBe('Hamburg')
  })

  it('emits the listing when the save heart is toggled', async () => {
    const wrapper = render()
    await wrapper.get('button.save').trigger('click')
    const emitted = wrapper.emitted('toggleSave')
    expect(emitted).toHaveLength(1)
    expect((emitted?.[0]?.[0] as ListingCardDto).id).toBe(42)
  })
})
