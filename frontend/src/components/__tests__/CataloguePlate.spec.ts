import { describe, expect, it } from 'vitest'
import { RouterLinkStub, mount } from '@vue/test-utils'
import CataloguePlate from '../CataloguePlate.vue'
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
  return mount(CataloguePlate, {
    props: { listing: { ...listing, ...overrides }, index: 7, ...props },
    global: {
      stubs: { RouterLink: RouterLinkStub, CarSilhouette: true },
    },
  })
}

function normalize(value: string): string {
  return value.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('CataloguePlate', () => {
  it('renders the price in German currency format', () => {
    expect(normalize(render().get('.price').text())).toBe('24.990 €')
  })

  it('gives the reading line to the vehicle and demotes the variant to a label', () => {
    const wrapper = render()
    expect(wrapper.get('.family').text()).toBe('BMW 3 Series')
    expect(wrapper.get('.variant').text()).toBe('320d Sport Line')
  })

  it('keeps a variant whole when the title does not open with the make and model', () => {
    expect(render({ title: 'Sport Line 320d' }).get('.variant').text()).toBe('Sport Line 320d')
  })

  it('renders registration, mileage and power as three labelled columns', () => {
    const columns = render()
      .findAll('.spec')
      .map((column) => [normalize(column.get('dt').text()), normalize(column.get('dd').text())])
    expect(columns).toEqual([
      ['EZ', '03/2019'],
      ['km', '68.500'],
      ['kW (PS)', '110 (150)'],
    ])
  })

  it('carries the unit in the column label so the values stay bare figures', () => {
    const values = render()
      .findAll('.spec dd')
      .map((value) => value.text())
    expect(values.some((value) => /km|kW|PS/.test(value))).toBe(false)
  })

  it('prints the plate number zero padded to three digits', () => {
    expect(render().get('.plate-no').text()).toBe('007')
  })

  /* The plate prints no measurement. The drawings are sized relative to each other,
   * but a length caption and a tick rule under every car was apparatus a real
   * marketplace would not carry, so there is a plain ground rule and nothing else. */
  it('prints no length caption or tick rule under the drawing', () => {
    const wrapper = render()
    expect(wrapper.find('.length').exists()).toBe(false)
    expect(wrapper.findAll('.tick')).toHaveLength(0)
    expect(wrapper.get('.baseline').text()).toBe('')
  })

  it('shows the body type, drivetrain and city', () => {
    const wrapper = render()
    expect(normalize(wrapper.get('.drivetrain').text())).toBe('Sedan · Diesel · Automatic')
    expect(wrapper.get('.city').text()).toBe('Hamburg')
  })

  it('emits the listing when the save heart is toggled', async () => {
    const wrapper = render()
    await wrapper.get('button.save').trigger('click')
    const emitted = wrapper.emitted('toggleSave')
    expect(emitted).toHaveLength(1)
    expect((emitted?.[0]?.[0] as ListingCardDto).id).toBe(42)
  })

  it('emits the listing when compare is toggled', async () => {
    const wrapper = render()
    await wrapper.get('button.compare').trigger('click')
    expect(wrapper.emitted('toggleCompare')).toHaveLength(1)
  })
})
