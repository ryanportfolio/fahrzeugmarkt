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
  return value.replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('ListingCard', () => {
  it('renders the price in German currency format', () => {
    const wrapper = render()
    expect(normalize(wrapper.get('.price').text())).toBe('24.990 €')
  })

  it('renders mileage, power and registration in the German spec rows', () => {
    const rows = render().findAll('.specs')
    expect(rows).toHaveLength(2)
    const [age, drivetrain] = rows.map((row) => normalize(row.text()))
    expect(age).toBe('EZ 03/2019 · 68.500 km')
    expect(drivetrain).toBe('110 kW (150 PS) · Diesel · Automatic')
  })

  it('joins each value to its unit with a non-breaking space', () => {
    const drivetrain = render().findAll('.specs')[1].text()
    expect(drivetrain).toContain('110 kW')
    expect(drivetrain).toContain('150 PS')
  })

  it('shows the city and title', () => {
    const wrapper = render()
    expect(wrapper.get('.city').text()).toBe('Hamburg')
    expect(wrapper.get('.title').text()).toBe('BMW 3 Series 320d Sport Line')
  })

  it('marks listings younger than seven days as new', () => {
    expect(render().find('.new-badge').exists()).toBe(false)
    const fresh = render({ createdAt: new Date().toISOString() })
    expect(fresh.get('.new-badge').text()).toBe('New')
  })

  it('emits the listing when the save heart is toggled', async () => {
    const wrapper = render()
    await wrapper.get('button.save').trigger('click')
    const emitted = wrapper.emitted('toggleSave')
    expect(emitted).toHaveLength(1)
    expect((emitted?.[0]?.[0] as ListingCardDto).id).toBe(42)
  })
})
