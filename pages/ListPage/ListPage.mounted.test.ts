// ListPage mounted (D69): the empty table tells a first run from a filtered list, and never in a
// frame while the list still shows the query before; Clear filters never brings a cleared URL key
// back; the delete confirm names its count and keeps it while it leaves; the focus stays in the list
// after a delete (plan WP10). Few customers per test: the suite has a time budget.
import { afterAll, afterEach, beforeAll, expect, jest, test } from 'bun:test'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import { useRouter, type LocationQuery, type Router } from 'vue-router'
import type { FakeEngine } from '../../demo/src/fake/engine'
import { calls } from '../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../scripts/test/mount'
import { toasts } from '../../ui/Toast/toast'
import ListPage from './ListPage.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
  toasts.splice(0)
})

/** Mounts the page at `url` with the first `keep` customers of the store; the harness router has a catch-all only. */
async function open(url: string, keep: number): Promise<{ root: HTMLElement; router: Router; engine: FakeEngine }> {
  let router: Router | undefined
  const ready = ref(false)
  const Host = defineComponent({
    setup() {
      router = useRouter()
      const empty = { render: () => null }
      router.addRoute({ name: 'customers.list', path: '/customers', component: empty })
      router.addRoute({ name: 'customers.detail', path: '/customers/:id', component: empty })
      return () => (ready.value ? h(ListPage as Component) : null)
    },
  })
  view = mount(Host)
  if (router === undefined) throw new Error('no router')
  const engine = view.engine
  for (const customer of engine.store.tables.customers.slice(keep)) engine.store.remove('customers', customer.id)
  await router.push(url)
  ready.value = true
  await settle(8)
  return { root: view.root, router, engine }
}

const emptyState = (root: HTMLElement) => root.querySelector<HTMLElement>('.ui-empty-state')
const titleOf = (root: HTMLElement) => emptyState(root)?.querySelector('.ui-empty-state__title')?.textContent
const buttonNamed = (root: ParentNode, text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === text)

// Clear filters (plan WP10 step 2): every route the router lands on is recorded until it settles.
const facetKeys = ['status', 'country', 'owner', 'tags'].flatMap(key => [key, `${key}.not`])
const blockKeys = (query: LocationQuery) => Object.keys(query).filter(key => facetKeys.includes(key) || key === 't')
const rangeLabel = (root: HTMLElement) => root.querySelector('[aria-label^="Time range"]')!.getAttribute('aria-label')

/** Every frame's empty-state title (or "rows"), recorded after each DOM change until `stop()`. */
function frames(root: HTMLElement): { titles: string[]; stop(): void } {
  const titles: string[] = []
  const observer = new MutationObserver(() => titles.push(titleOf(root) ?? 'rows'))
  observer.observe(root, { childList: true, subtree: true, characterData: true })
  return { titles, stop: () => observer.disconnect() }
}
/** Advances fake timers in 10 ms steps; between two steps the promises run out, as in a browser
 * (a router navigation takes about 30 promise turns). */
async function drive(ms: number): Promise<void> {
  for (let step = 0; step < ms / 10; step++) {
    for (let round = 0; round < 50; round++) await nextTick()
    jest.advanceTimersByTime(10)
  }
  for (let round = 0; round < 50; round++) await nextTick()
}

async function clearFilters(root: HTMLElement, router: Router, presses = 1): Promise<LocationQuery[]> {
  const landed: LocationQuery[] = []
  const stop = router.afterEach((to, _from, failure) => { if (!failure) landed.push(to.query) })
  const button = buttonNamed(emptyState(root)!, 'Clear filters')!
  for (let press = 0; press < presses; press++) button.click()
  // Settled: the route has not changed for three rounds.
  let path = ''
  for (let quiet = 0, round = 0; quiet < 3 && round < 50; round++) {
    await settle(1)
    quiet = router.currentRoute.value.fullPath === path ? quiet + 1 : 0
    path = router.currentRoute.value.fullPath
  }
  stop()
  return landed
}
function expectCleared(root: HTMLElement, router: Router, landed: LocationQuery[]): void {
  expect(landed.length).toBeGreaterThan(0)
  expect(landed.flatMap(blockKeys)).toEqual([])
  const query = router.currentRoute.value.query
  expect([blockKeys(query), query['search'], query['page']]).toEqual([[], undefined, undefined])
  expect(root.querySelectorAll('.ui-facet-filter__chip').length).toBe(0)
  expect(root.querySelector<HTMLInputElement>('input[name="search"]')!.value).toBe('')
  expect(rangeLabel(root)).toBe('Time range: Any time')
  expect(root.querySelectorAll('.ui-table__row').length).toBeGreaterThan(0)
}

test('no customers: a search shows Clear filters, which leads to the first run, whose New customer leaves the focus on the header', async () => {
  const { root, router } = await open('/customers?search=nobody-is-called-like-this', 0)
  expect(titleOf(root)).toBe('No customers match')
  expect(emptyState(root)!.querySelector('.ui-empty-state__description')).toBeNull()
  expect(emptyState(root)!.querySelector('[data-action="createCustomer"]')).toBeNull()
  const landed = await clearFilters(root, router)
  expect([landed.length > 0, router.currentRoute.value.query['search'], root.querySelector<HTMLInputElement>('input[name="search"]')!.value]).toEqual([true, undefined, ''])

  // Nothing narrows on the default tab: the first run.
  const state = emptyState(root)!
  expect(titleOf(root)).toBe('No customers yet')
  expect(state.querySelector('.ui-empty-state__description')!.textContent).toBe('A customer keeps the contact, the owner and the revenue of one company in one place.')
  expect(buttonNamed(state, 'Clear filters')).toBeUndefined()
  const create = state.querySelector<HTMLButtonElement>('[data-action="createCustomer"]')!
  expect(create.dataset['variant']).toBe('primary')
  const createDialog = root.querySelector('#customer-create')!.closest('dialog')!
  expect(createDialog.hasAttribute('open')).toBe(false)
  create.focus()
  create.click()
  await nextTick()
  expect(createDialog.hasAttribute('open')).toBe(true)

  // The created row replaces the empty state and its button; the focus goes to the header's twin.
  const form = createDialog.querySelector('form')!
  for (const [name, value] of [['name', 'First Customer Ltd'], ['email', 'first@example.com'], ['country', 'DE']] as const) {
    const input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  await settle(8)
  expect([createDialog.hasAttribute('open'), root.querySelectorAll('.ui-table__row').length, emptyState(root) === null]).toEqual([false, 1, true])
  expect(document.activeElement).toBe(root.querySelector('.ui-page-header [data-action="createCustomer"]'))

  // Another tab with nothing narrowing: the title only.
  await router.push('/customers?tab=churned')
  await settle()
  expect(titleOf(root)).toBe('No customers match')
  expect(emptyState(root)!.querySelector('.ui-empty-state__description')).toBeNull()
  expect(emptyState(root)!.querySelector('button')).toBeNull()
})

test('Clear filters refused by a guard changes nothing; pressed twice in one task it empties search, facets and range, keeps the sort, and no frame claims a first run', async () => {
  const { root, router } = await open('/customers?search=nobody-is-called-like-this&country=DE&t=-30d&sort=name', 4)
  expect([titleOf(root), buttonNamed(emptyState(root)!, 'Clear filters') !== undefined]).toEqual(['No customers match', true])
  expect(root.querySelector('input[name="search"]')!.getAttribute('aria-label')).toBe('Search customers')
  expect([root.querySelectorAll('.ui-facet-filter__chip').length, rangeLabel(root)]).toEqual([1, 'Time range: Last 30 days'])
  // A guard that refuses the navigation: the URL keeps its keys, so search, facet and range stay.
  const refuse = router.beforeEach(() => false)
  buttonNamed(emptyState(root)!, 'Clear filters')!.click()
  await settle()
  refuse()
  expect([router.currentRoute.value.query['country'], root.querySelectorAll('.ui-facet-filter__chip').length, rangeLabel(root)]).toEqual(['DE', 1, 'Time range: Last 30 days'])
  expect([root.querySelector<HTMLInputElement>('input[name="search"]')!.value, titleOf(root)]).toEqual(['nobody-is-called-like-this', 'No customers match'])
  // Rows and total stay the query before's until its first page: "No customers yet" would be a lie.
  const cleared = frames(root)
  // The second press does nothing while the first one's navigation runs: no navigation is cancelled.
  let cancelled = 0
  const count = router.afterEach((_to, _from, failure) => { if (failure) cancelled += 1 })
  const landed = await clearFilters(root, router, 2)
  count()
  cleared.stop()
  expect(cancelled).toBe(0)
  expectCleared(root, router, landed)
  expect(cleared.titles).not.toContain('No customers yet')
  expect(router.currentRoute.value.query['sort']).toBe('name')
  // The button left with the empty state; the focus went to the filter button, not the body.
  expect(document.activeElement).toBe(root.querySelector('[data-action="filter"]'))

  // The same window when the user empties the search box: the frames keep "No customers match".
  jest.useFakeTimers()
  const box = root.querySelector<HTMLInputElement>('input[name="search"]')!
  const type = async (text: string) => {
    box.value = text
    box.dispatchEvent(new Event('input', { bubbles: true }))
    await drive(300)
  }
  await type('nobody-is-called-like-this')
  expect(titleOf(root)).toBe('No customers match')
  const emptied = frames(root)
  await type('')
  emptied.stop()
  expect(root.querySelectorAll('.ui-table__row').length).toBe(4)
  expect(emptied.titles).not.toContain('No customers yet')
})

test('Clear filters after page 2 with facets and a range emptied, no search, ends without a page key', async () => {
  // A link with facets opens on page 1 (their URL read changes the filter after SearchTable took
  // the page), so the list pages to 2 by its pager and empties there by live removals. The emptied
  // page steps back (SearchTable), so the filtered list shows its empty state on page 1.
  const { root, router, engine } = await open('/customers?status=active,onHold,churned&t=-3650d', 26)
  root.querySelector<HTMLButtonElement>('.ui-pagination [aria-label="Next"]')!.click()
  await settle(4)
  expect(router.currentRoute.value.query['page']).toBe('2')
  // Every customer leaves the range (created twenty years ago): the filtered list is empty.
  const old = new Date(Date.now() - 20 * 365 * 86_400_000).toISOString()
  for (const customer of engine.store.tables.customers.slice()) engine.store.update('customers', customer.id, { createdAt: old })
  await settle(4)
  expect([router.currentRoute.value.query['page'], root.querySelectorAll('.ui-table__row').length, titleOf(root)]).toEqual([undefined, 0, 'No customers match'])
  expectCleared(root, router, await clearFilters(root, router))
})

test('Clear filters ends after a search of blanks with a facet, after a facet only and after a range only', async () => {
  // SearchTable takes the blanks from the URL and writes the key away: the search narrows nothing.
  const { root, router } = await open('/customers?search=%20%20%20&country=XX', 4)
  expect([root.querySelector<HTMLInputElement>('input[name="search"]')!.value, router.currentRoute.value.query['search']]).toEqual(['   ', undefined])
  expectCleared(root, router, await clearFilters(root, router))
  // FacetFilter and RangePicker follow the URL, so the same page takes the next start from it.
  for (const [url, chips, ranged] of [['/customers?country=XX', 1, false], ['/customers?t=2000-01-01T00:00..2000-01-02T00:00', 0, true]] as const) {
    await router.replace(url)
    await settle()
    expect([titleOf(root), root.querySelectorAll('.ui-facet-filter__chip').length, rangeLabel(root) !== 'Time range: Any time']).toEqual(['No customers match', chips, ranged])
    expectCleared(root, router, await clearFilters(root, router))
  }

  // A text still in SearchTable's 200 ms debounce goes with Clear filters, box and URL.
  await router.replace('/customers?country=XX')
  await settle()
  jest.useFakeTimers()
  const box = root.querySelector<HTMLInputElement>('input[name="search"]')!
  box.value = 'ab'
  box.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
  buttonNamed(emptyState(root)!, 'Clear filters')!.click()
  await drive(300)
  expect([box.value, router.currentRoute.value.query['search'], router.currentRoute.value.query['country']]).toEqual(['', undefined, undefined])
})

test('the delete confirm names the count, keeps it while it leaves, a second press deletes nothing more, and the focus stays in the list', async () => {
  // Page 2 of 32 customers: seven rows, and once they are gone an empty page that is no first run.
  const { root, engine } = await open('/customers?page=2', 32)
  const connection = view!.pair.value.connection
  const call = connection.call.bind(connection)
  let deletes = 0
  // `early`: the answer reaches the page before the push that removes the row (either may come first).
  let early = false
  connection.call = ((...args: Parameters<typeof call>) => {
    if (args[0] !== calls.deleteCustomer) return call(...args)
    deletes += 1
    if (!early) return call(...args)
    setTimeout(() => void call(...args)) // the server's work, and so its push, comes after the answer
    return Promise.resolve(undefined)
  }) as typeof connection.call
  const rows = () => [...root.querySelectorAll<HTMLElement>('.ui-table__row')]
  const nameOf = (row: Element) => row.querySelector('td:not(.ui-table__select)')!.textContent!.trim()
  const rowNamed = (name: string) => rows().find(row => nameOf(row) === name)!
  const names = rows().map(nameOf)
  expect(names.length).toBe(7)
  const [first, second, third, fourth, fifth, sixth, seventh] = names as [string, string, string, string, string, string, string]
  async function bulkDelete(...picked: string[]): Promise<void> {
    for (const name of picked) {
      rowNamed(name).querySelector<HTMLInputElement>('.ui-table__select input')!.click()
      await nextTick()
    }
    const button = root.querySelector<HTMLButtonElement>('.ui-table__bulk [data-action="deleteCustomer"]')!
    button.focus()
    button.click()
    await nextTick()
  }
  const rowDelete = async (name: string) => {
    rowNamed(name).querySelector<HTMLButtonElement>('.ui-menu [data-action="deleteCustomer"]')!.click()
    await nextTick()
  }

  // The second and third rows through the bulk bar.
  await bulkDelete(second, third)
  const confirm = root.querySelector<HTMLDialogElement>('dialog[data-variant="danger"]')!
  const title = () => confirm.querySelector('.ui-dialog__title')!.textContent
  const remove = confirm.querySelector<HTMLButtonElement>('[data-action="deleteCustomer"]')!
  expect([confirm.hasAttribute('open'), title(), remove.textContent?.trim()]).toEqual([true, 'Delete 2 customers?', 'Delete 2 customers'])
  remove.click()
  remove.click()
  await settle()
  expect([confirm.hasAttribute('open'), deletes, engine.store.tables.customers.length]).toEqual([false, 2, 30])
  // The closed dialog still says what it did: a leaving dialog stays visible for its exit.
  expect([title(), remove.textContent?.trim()]).toEqual(['Delete 2 customers?', 'Delete 2 customers'])
  remove.click()
  await settle()
  expect(deletes).toBe(2)
  expect(toasts.filter(item => item.variant === 'danger')).toEqual([])
  // The bulk bar left with the selection; the focus is on the row that took the first deleted row's place.
  expect(rows().map(nameOf)).toEqual([first, fourth, fifth, sixth, seventh])
  expect(document.activeElement).toBe(rowNamed(fourth))

  // The last row through its own menu: the title names it, Cancel keeps the title, the delete hands
  // the focus to the row before it, also when the answer comes before the push.
  await rowDelete(seventh)
  expect([confirm.hasAttribute('open'), title(), remove.textContent?.trim()]).toEqual([true, `Delete ${seventh}?`, 'Delete customer'])
  buttonNamed(confirm, 'Cancel')!.click()
  await nextTick()
  expect([confirm.hasAttribute('open'), title(), deletes]).toEqual([false, `Delete ${seventh}?`, 2])
  early = true
  await rowDelete(seventh)
  remove.click()
  await settle()
  expect([deletes, rows().map(nameOf)]).toEqual([3, [first, fourth, fifth, sixth]])
  expect(document.activeElement).toBe(rowNamed(sixth))

  // The user moves the focus after the dialog closed and before the push: it stays there.
  await rowDelete(sixth)
  remove.click()
  for (let round = 0; round < 5 && confirm.hasAttribute('open'); round++) await nextTick()
  await nextTick()
  const box = root.querySelector<HTMLInputElement>('input[name="search"]')!
  box.focus()
  await settle()
  early = false
  expect([deletes, rows().map(nameOf)]).toEqual([4, [first, fourth, fifth]])
  expect(document.activeElement).toBe(box)

  // A live change takes the successor while the delete runs (its push lands before the deleted
  // row's): the focus goes to the row now at the deleted row's place.
  await rowDelete(first)
  engine.store.remove('customers', engine.store.tables.customers.find(customer => customer.name === fourth)!.id)
  remove.click()
  await settle()
  expect([deletes, rows().map(nameOf)]).toEqual([5, [fifth]])
  expect(document.activeElement).toBe(rowNamed(fifth))

  // No row of the page stays: the list itself, a group named like the page, takes the focus, and
  // the emptied page steps back to the last one, the 25 customers that remain (SearchTable).
  await rowDelete(fifth)
  remove.click()
  await settle()
  const list = root.querySelector('.ui-search-table')!
  expect([deletes, rows().length, root.querySelector('.ui-pagination__page')?.textContent, emptyState(root) === null]).toEqual([6, 25, 'Page 1 of 1', true])
  expect(document.activeElement).toBe(list)
  expect([list.getAttribute('role'), list.getAttribute('aria-label')]).toEqual(['group', 'Customers'])
})
