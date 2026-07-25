import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChips from '../FilterChips.vue'
import { activeChips, emptyFilters, removeChip } from '../../browse/filters'
import type { FilterChip, FilterState } from '../../browse/filters'

const chips: FilterChip[] = [
  { id: 'make', label: 'BMW', field: 'make' },
  { id: 'fuelType:DIESEL', label: 'Diesel', field: 'fuelType', value: 'DIESEL' },
  { id: 'price', label: 'Price up to 20.000 €', field: 'priceFrom' },
]

describe('FilterChips', () => {
  it('renders one removable chip per active filter plus a clear action', () => {
    const wrapper = mount(FilterChips, { props: { chips } })
    expect(wrapper.findAll('.chip')).toHaveLength(3)
    expect(wrapper.get('.clear').text()).toBe('Clear all')
  })

  it('emits remove with the chip that was clicked', async () => {
    const wrapper = mount(FilterChips, { props: { chips } })
    await wrapper.findAll('.chip')[1].trigger('click')
    const emitted = wrapper.emitted('remove')
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toEqual(chips[1])
  })

  it('emits clear when clear all is pressed', async () => {
    const wrapper = mount(FilterChips, { props: { chips } })
    await wrapper.get('.clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('renders nothing when no filters are active', () => {
    const wrapper = mount(FilterChips, { props: { chips: [] } })
    expect(wrapper.find('.chips').exists()).toBe(false)
  })

  it('removes only the clicked value from a multi-select dimension', () => {
    const state: FilterState = { ...emptyFilters(), fuelType: ['DIESEL', 'PETROL'] }
    const chip = activeChips(state).find((item) => item.id === 'fuelType:DIESEL')
    expect(chip).toBeDefined()
    expect(removeChip(state, chip as FilterChip).fuelType).toEqual(['PETROL'])
  })
})
