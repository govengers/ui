// SearchTable mounted (D69): rows stay on screen while a changed query loads (livewire D76);
// no row of an ended connection does.
import { afterEach, expect, test } from 'bun:test'
import { nextTick, ref, type Component } from 'vue'
import { live } from '../../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import SearchTable from './SearchTable.vue'

let table: Mounted | undefined
afterEach(() => {
  table?.unmount()
  table = undefined
})

test('an ended connection keeps no row on screen, before any new pair', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id' }))
  await settle()
  expect(table.root.querySelectorAll('.ui-table__row').length).toBeGreaterThan(0)
  table.pair.value.end()
  await settle()
  expect(table.root.querySelectorAll('.ui-table__row').length).toBe(0)
})

test('a changed search keeps the rows on screen, not a skeleton, until its first page', async () => {
  const filter = ref<{ search?: string }>({})
  table = mount(SearchTable as Component, () => ({ target: live.customers, filter: filter.value, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id' }))
  await settle()
  const before = table.root.querySelectorAll('.ui-table__row').length
  expect(before).toBeGreaterThan(1)
  filter.value = { search: 'no customer is named like this' }
  await nextTick()
  await nextTick()
  expect(table.root.querySelector('[aria-busy="true"]')).toBeNull()
  expect(table.root.querySelectorAll('.ui-table__row').length).toBe(before)
  await settle()
  expect(table.root.querySelectorAll('.ui-table__row').length).toBe(0)
})
