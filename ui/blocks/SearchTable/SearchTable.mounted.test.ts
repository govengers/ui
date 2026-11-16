// SearchTable mounted (D69): no row of an ended connection stays on screen.
import { afterEach, expect, test } from 'bun:test'
import type { Component } from 'vue'
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
