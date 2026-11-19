// SearchTable mounted (D69): rows stay on screen while a changed query loads (livewire D76), and the
// empty slot hears `stale` meanwhile; no row of an ended connection stays; clearSearch() drops a text
// still in the debounce.
import { afterEach, expect, jest, test } from 'bun:test'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { createLivePair, type LivePair } from '../../../demo/src/api/runtime'
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

// The sort row of card mode (D97). The harness compiles no styles, so the row is in the DOM at
// every width; the container query that shows it only under 48rem is a browser check.
const sortable = [{ key: 'name', label: 'Name', sortable: true }, { key: 'revenue', label: 'Revenue', sortable: true }]
const revenues = (root: HTMLElement) => [...root.querySelectorAll('.ui-table__row')].map((row) => Number(row.querySelectorAll('td')[1]!.textContent))
const names = (root: HTMLElement) => [...root.querySelectorAll('.ui-table__row')].map((row) => row.querySelector('td')!.textContent!.trim())
const byName = (left: string, right: string) => left.localeCompare(right, 'en')
function choose(select: HTMLSelectElement, value: string) {
  select.value = value
  select.dispatchEvent(new Event('change'))
}
const sortRow = (root: HTMLElement) => root.querySelector('.ui-search-table__sort')

test('the first load shows as many placeholder rows as the page holds', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: sortable, rowKey: 'id', pageSize: 7 }))
  await nextTick()
  expect(table.root.querySelectorAll('tbody[aria-hidden="true"] tr').length).toBe(7)
  expect(table.root.querySelectorAll('tbody[aria-hidden="true"] .ui-skeleton').length).toBe(14)
  await settle()
  expect(table.root.querySelector('tbody[aria-hidden="true"]')).toBeNull()
})

test('the sort select and the direction button change the read\'s sort; a new column keeps the direction', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: sortable, rowKey: 'id', pageSize: 50 }))
  await settle()
  const unsorted = revenues(table.root)
  expect(unsorted).not.toEqual([...unsorted].sort((a, b) => a - b))
  const select = table.root.querySelector<HTMLSelectElement>('select[name="sort"]')!
  const direction = sortRow(table.root)!.querySelector<HTMLButtonElement>('.ui-button')!
  expect([select.value, direction.disabled]).toEqual(['', true])
  choose(select, 'revenue')
  await settle()
  const ascending = revenues(table.root)
  expect(ascending).toEqual([...ascending].sort((a, b) => a - b))
  expect([direction.disabled, direction.getAttribute('aria-label')]).toEqual([false, 'Ascending'])
  direction.click()
  await settle()
  const descending = revenues(table.root)
  expect(descending).toEqual([...descending].sort((a, b) => b - a))
  expect(direction.getAttribute('aria-label')).toBe('Descending')
  choose(select, 'name')
  await settle()
  const namesDown = names(table.root)
  expect(namesDown).toEqual([...namesDown].sort(byName).reverse())
  expect(direction.getAttribute('aria-label')).toBe('Descending')
})

test('a sort on a column without an option shows "Sort by", and every option then sorts', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: sortable, rowKey: 'id', pageSize: 50, defaultSort: { key: 'createdAt', direction: 'desc' } }))
  await settle()
  const select = table.root.querySelector<HTMLSelectElement>('select[name="sort"]')!
  expect([select.value, select.selectedOptions[0]!.textContent]).toEqual(['', 'Sort by'])
  choose(select, 'name')
  await settle()
  const namesDown = names(table.root)
  expect(namesDown).toEqual([...namesDown].sort(byName).reverse())
})

test('a selectable table without a sortable column shows Select all and no sort select', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id', selectable: true }))
  await settle()
  expect(sortRow(table.root)!.querySelector('input[type="checkbox"]')).not.toBeNull()
  expect(table.root.querySelector('select[name="sort"]')).toBeNull()
})

test('a sortable table without a search box shows the sort select; searchLabel names the box', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: sortable, rowKey: 'id' }))
  await settle()
  expect(table.root.querySelector('input[name="search"]')).toBeNull()
  expect(sortRow(table.root)!.querySelector('select[name="sort"]')!.getAttribute('aria-label')).toBe('Sort by')
  expect(sortRow(table.root)!.querySelector('input[type="checkbox"]')).toBeNull()
  table.unmount()
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: sortable, rowKey: 'id', searchable: true, searchLabel: 'Search customers' }))
  const search = table.root.querySelector<HTMLInputElement>('input[name="search"]')!
  expect([search.getAttribute('aria-label'), search.placeholder]).toEqual(['Search customers', 'Search customers'])
})

test('Select all follows the rows and selects them, and the header checkbox agrees', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: sortable, rowKey: 'id', pageSize: 5, selectable: true }))
  await nextTick()
  const all = sortRow(table.root)!.querySelector<HTMLInputElement>('input[type="checkbox"]')!
  const header = table.root.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!
  expect([all.disabled, header.disabled]).toEqual([true, true])
  await settle()
  const rowBoxes = () => [...table!.root.querySelectorAll<HTMLInputElement>('tbody .ui-table__select input')]
  expect([all.checked, all.indeterminate, all.disabled]).toEqual([false, false, false])
  rowBoxes()[0]!.click()
  await nextTick()
  expect([all.checked, all.indeterminate]).toEqual([false, true])
  all.click()
  await nextTick()
  expect(rowBoxes().map((box) => box.checked)).toEqual([true, true, true, true, true])
  expect([all.checked, all.indeterminate, header.checked, header.indeterminate]).toEqual([true, false, true, false])
})

test('the empty slot hears stale while a changed query loads, and not once its first page arrived', async () => {
  const filter = ref<{ search?: string }>({ search: 'no customer is named like this' })
  table = mount(SearchTable as Component, () => ({ target: live.customers, filter: filter.value, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id' }),
    { empty: ({ stale }: { stale: boolean }) => h('p', { class: 'empty' }, String(stale)) })
  const empty = () => table!.root.querySelector('.empty')?.textContent
  await settle()
  expect(empty()).toBe('false')
  filter.value = { search: 'nor is anyone named like this' }
  await nextTick()
  await nextTick()
  expect(empty()).toBe('true')
  await settle()
  expect(empty()).toBe('false')
})

test('clearSearch() through a template ref empties the box and the search, a text still in the debounce included', async () => {
  const list = ref<{ clearSearch(): void } | null>(null)
  const searches: string[] = []
  const Host = defineComponent({
    setup: () => () => h(SearchTable as Component, {
      ref: list, target: live.customers, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id', searchable: true,
      'onUpdate:search': (text: string) => searches.push(text),
    }),
  })
  table = mount(Host)
  await settle()
  jest.useFakeTimers()
  const box = table.root.querySelector<HTMLInputElement>('input[name="search"]')!
  box.value = 'ab'
  box.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
  list.value!.clearSearch()
  jest.advanceTimersByTime(300)
  await nextTick()
  await nextTick()
  expect([box.value, searches.includes('ab')]).toEqual(['', false])
})

test('a page whose rows all left steps back to the last page instead of standing empty past it', async () => {
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id', pageSize: 3 }))
  const { customers } = table.engine.store.tables
  for (const customer of customers.slice(7)) table.engine.store.remove('customers', customer.id)
  await settle()
  const pageText = () => table!.root.querySelector('.ui-pagination__page')?.textContent
  expect(pageText()).toBe('Page 1 of 3')
  // Vue drops a click stamped in the millisecond its button's listener was attached: let the clock move.
  await new Promise((resolve) => setTimeout(resolve, 2))
  table.root.querySelector<HTMLButtonElement>('.ui-pagination button[aria-label="Last"]')!.click()
  await settle()
  expect([pageText(), table.root.querySelectorAll('.ui-table__row').length]).toEqual(['Page 3 of 3', 1])
  table.engine.store.remove('customers', customers.at(-1)!.id)
  await settle()
  expect([pageText(), table.root.querySelectorAll('.ui-table__row').length]).toEqual(['Page 2 of 2', 3])
})

test('the emptied last page shows placeholders, never the empty slot, until it stepped back', async () => {
  const emptied: string[] = []
  table = mount(SearchTable as Component, () => ({ target: live.customers, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id', pageSize: 3 }), {
    empty: () => (emptied.push('empty'), h('p', 'No results')),
  })
  const { customers } = table.engine.store.tables
  for (const customer of customers.slice(7)) table.engine.store.remove('customers', customer.id)
  await settle()
  await new Promise((resolve) => setTimeout(resolve, 2))
  table.root.querySelector<HTMLButtonElement>('.ui-pagination button[aria-label="Last"]')!.click()
  await settle()
  expect(table.root.querySelectorAll('.ui-table__row').length).toBe(1)
  table.engine.store.remove('customers', customers.at(-1)!.id)
  await settle()
  expect([table.root.querySelector('.ui-pagination__page')?.textContent, table.root.querySelectorAll('.ui-table__row').length, emptied]).toEqual(['Page 2 of 2', 3, []])
})

/** A pair whose list totals are capped at 11, as a server's count cap answers (livewire D14: at most CountCap + 1). */
function cappedPair(view: Mounted): LivePair {
  const cap = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(cap)
    if (value === null || typeof value !== 'object') return value
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, key === 'total' && typeof inner === 'number' ? Math.min(inner, 11) : cap(inner)]))
  }
  const Server = view.engine.WebSocket as unknown as new (url: string) => { emit(frame: unknown): void }
  class Capped extends Server {
    override emit(frame: unknown): void {
      super.emit(cap(frame))
    }
  }
  return createLivePair({
    identity: () => 'test:ada',
    client: { baseURL: '/api/v1', fetch: view.engine.fetch },
    connection: { url: 'ws://fake/api/v1/socket', WebSocket: Capped as never, reconnectDelay: 0 },
  })
}

/** SearchTable with the URL sync on, mounted once the test has pushed its URL. */
function routed(pair?: (view: Mounted) => LivePair): { view: Mounted; router: () => Router; show: () => void } {
  let router: Router | undefined
  const ready = ref(false)
  const Host = defineComponent({
    setup() {
      router = useRouter()
      return () => (ready.value ? h(SearchTable as Component, { target: live.customers, columns: [{ key: 'name', label: 'Name' }], rowKey: 'id', pageSize: 3, syncQuery: true }) : null)
    },
  })
  const view = mount(Host)
  if (pair) view.pair.value = pair(view)
  return { view, router: () => router!, show: () => (ready.value = true) }
}

test('a page that has rows stays, although a capped total puts it past the last page', async () => {
  const { view, router, show } = routed(cappedPair)
  table = view
  await router().push('/?page=6')
  show()
  await settle(8)
  expect([view.root.querySelectorAll('.ui-table__row').length, router().currentRoute.value.query['page']]).toEqual([3, '6'])
})

test('a list whose connection ended keeps its page', async () => {
  const { view, router, show } = routed()
  table = view
  await router().push('/?page=3')
  show()
  await settle(8)
  expect(view.root.querySelector('.ui-pagination__page')?.textContent).toMatch(/^Page 3 of /)
  view.pair.value.end()
  await settle()
  expect([router().currentRoute.value.query['page'], view.root.querySelectorAll('.ui-table__row').length]).toEqual(['3', 0])
})
