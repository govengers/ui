// StatusTile mounted (D69): the period follows the delta, outside its coloured pill, and only with it.
import { afterEach, expect, test } from 'bun:test'
import { reactive, type Component } from 'vue'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import StatusTile from './StatusTile.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

test('the period shows after the delta pill, never without a delta or while loading', async () => {
  const props = reactive<Record<string, unknown>>({ label: 'Revenue', value: 12, delta: 12.4, period: 'vs last month' })
  view = mount(StatusTile as Component, () => ({ ...props }))
  await settle(1)
  const change = () => view!.root.querySelector('.ui-status-tile__change')
  expect([...change()!.children].map((part) => part.className)).toEqual(['ui-status-tile__delta', 'ui-status-tile__period'])
  expect(change()?.querySelector('.ui-status-tile__delta')?.textContent).not.toContain('vs last month')
  expect(change()?.textContent).toBe('+12.4%vs last month')
  props['loading'] = true
  await settle(1)
  expect(change()).toBeNull()
  props['loading'] = false
  props['delta'] = undefined
  await settle(1)
  expect(view.root.textContent).not.toContain('vs last month')
})
