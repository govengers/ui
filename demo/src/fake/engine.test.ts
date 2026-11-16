// The fake engine under the real runtime.ts and vue.ts (D16): every test builds a pair on a fresh
// engine with latency 0 and waits for what the socket delivers.

import { describe, expect, test } from 'bun:test'
import { effectScope } from 'vue'
import { ApiError, createLivePair, type ListResponse, type LivePair, type LiveState, type PresenceItem } from '../api/runtime'
import { useLiveList } from '../api/vue'
import { calls, cancelJob, createCustomer, getBilling, getCustomerFacets, getCustomers, getJobs, getJobsItem, getOrders, getTasks, live, moveTask, retryJob, saveFilter, uploadFile, type CustomersFilter } from './api'
import type { Customer, CustomerFacets, FileItem } from './data'
import { createFakeEngine, type FakeEngine } from './engine'

function setup(): { engine: FakeEngine; pair: LivePair } {
  const engine = createFakeEngine({ latency: 0 })
  const pair = createLivePair({
    identity: () => 'demo:ada',
    client: { baseURL: 'http://fake/api/v1', fetch: engine.fetch },
    connection: { url: 'ws://fake/api/v1/socket', WebSocket: engine.WebSocket },
  })
  return { engine, pair }
}

async function eventually(what: string, condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 2000
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
    await new Promise((resolve) => setTimeout(resolve, 2))
  }
}

/** Collects every state of a subscription and the error that ended it. */
function collector<Data>(): { states: LiveState<Data>[]; error: unknown; listener: { next(state: LiveState<Data>): void; error(error: unknown): void } } {
  const collected = {
    states: [] as LiveState<Data>[],
    error: undefined as unknown,
    listener: {
      next: (state: LiveState<Data>) => collected.states.push(state),
      error: (error: unknown) => {
        collected.error = error
      },
    },
  }
  return collected
}

async function refusal(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(() => undefined, (failure: unknown) => failure)
  if (!(error instanceof ApiError)) throw new Error(`expected an ApiError, got ${String(error)}`)
  return error
}

const ids = (items: readonly { id: string }[]): string[] => items.map((item) => item.id)

describe('fake engine', () => {
  test('moveTask moves a card and refuses a bad position', async () => {
    const { pair } = setup()
    const moved = await moveTask(pair.client, { id: 'tsk-01' }, { status: 'done', position: 1 })
    expect(moved).toMatchObject({ id: 'tsk-01', status: 'done', position: 1 })
    const done = await getTasks(pair.client, { filter: { where: { field: 'status', op: 'eq', value: 'done' } } })
    expect(done.items[0]?.id).toBe('tsk-01')
    const error = await refusal(moveTask(pair.client, { id: 'tsk-01' }, { status: 'done', position: Number.NaN }))
    expect(error.fields).toEqual({ position: 'must be a finite number' })
    pair.end()
  })

  test('a list read filters, sorts, pages and refuses a bad filter with its path', async () => {
    const { engine, pair } = setup()
    const filter: CustomersFilter = { where: { and: [{ field: 'status', op: 'eq', value: 'active' }, { field: 'country', op: 'in', value: ['DE', 'AT'] }] } }
    const page = await getCustomers(pair.client, { filter, sort: ['-revenue'], limit: 10 })
    const expected = engine.store.tables.customers
      .filter((customer) => customer.status === 'active' && ['DE', 'AT'].includes(customer.country))
      .sort((left, right) => right.revenue - left.revenue || left.id.localeCompare(right.id))
    expect(page.total).toBe(expected.length)
    expect(page.limit).toBe(10)
    expect(ids(page.items)).toEqual(ids(expected.slice(0, 10)))

    const bad = await refusal(getCustomers(pair.client, { filter: { where: { field: 'status', op: 'contains' as 'eq', value: 'active' } } }))
    expect(bad.code).toBe('invalid_filter')
    expect(bad.fields).toEqual({ 'where.op': 'operator "contains" is not allowed on enum field "status"' })
    pair.end()
  })

  test('cursor pages tile the list without a gap, over REST and in useLiveList', async () => {
    const { pair } = setup()
    const first = await getOrders(pair.client, { limit: 25 })
    expect(first.next).toBeString()
    const second = await getOrders(pair.client, { limit: 25, after: first.next as string })
    const both = await getOrders(pair.client, { limit: 50 })
    expect(ids([...first.items, ...second.items])).toEqual(ids(both.items))
    expect((await refusal(getOrders(pair.client, { sort: ['total'], after: first.next as string }))).code).toBe('invalid_cursor')

    const scope = effectScope()
    const list = scope.run(() => useLiveList(live.orders, { mode: 'cursor', limit: 20, connection: pair.connection }))
    if (list === undefined) throw new Error('no list')
    await eventually('the first page arrived', () => list.items.value.length === 20)
    expect(list.hasMore.value).toBe(true)
    list.loadMore()
    await eventually('the second page arrived', () => list.items.value.length === 40)
    expect(ids(list.items.value)).toEqual(ids((await getOrders(pair.client, { limit: 40 })).items))
    scope.stop()
    pair.end()
  })

  test('a subscription gets its snapshot, then a diff per change on its page only', async () => {
    const { engine, pair } = setup()
    const watched = collector<ListResponse<Customer>>()
    pair.connection.subscribe(live.customers, { limit: 5 }, watched.listener)
    await eventually('the snapshot arrived', () => watched.states.length === 1)
    const [snapshot] = watched.states
    const first = snapshot?.data.items[0] as Customer
    expect(snapshot?.cause).toBe('snapshot')
    expect(snapshot?.data.items).toHaveLength(5)

    engine.store.update('customers', first.id, { revenue: 1 })
    await eventually('the diff arrived', () => watched.states.length === 2)
    expect(watched.states[1]?.cause).toBe('change')
    expect(watched.states[1]?.data.items[0]).toEqual({ ...first, revenue: 1 })

    const offPage = engine.store.tables.customers.find((customer) => !ids(snapshot?.data.items ?? []).includes(customer.id)) as Customer
    engine.store.update('customers', offPage.id, { revenue: 2 })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(watched.states).toHaveLength(2) // a row the page does not show pushes nothing
    pair.end()
  })

  test('a refused call carries the fields, a key runs once, a removed item ends its subscription', async () => {
    const { engine, pair } = setup()
    const invalid = await refusal(pair.connection.call(calls.createCustomer, {}, { name: '', email: 'not-an-email' }))
    expect(invalid.status).toBe(400) // a socket answer carries its status
    expect(invalid.code).toBe('invalid_request')
    expect(invalid.fields).toEqual({ name: 'must not be empty', email: 'must be an email address' })
    expect((await refusal(createCustomer(pair.client, { name: 'Acme', email: 'acme@example.com', status: 'gone' as 'active' }))).fields).toEqual({ status: 'must be one of active, onHold, churned' })

    const before = engine.store.tables.customers.length
    const key = 'retried-key'
    const created = await createCustomer(pair.client, { name: 'Acme', email: 'acme@example.com' }, { idempotencyKey: key })
    const replayed = await createCustomer(pair.client, { name: 'Acme', email: 'acme@example.com' }, { idempotencyKey: key })
    expect(replayed).toEqual(created)
    expect(engine.store.tables.customers.length).toBe(before + 1)

    const watched = collector<Customer>()
    pair.connection.subscribe(live['customers.item'], { id: created.id }, watched.listener)
    await eventually('the item arrived', () => watched.states.length === 1)
    await pair.connection.call(calls.deleteCustomer, { id: created.id }, undefined)
    await eventually('the error push arrived', () => watched.error !== undefined)
    expect(watched.error).toBeInstanceOf(ApiError)
    expect((watched.error as ApiError).status).toBe(404) // an error push has no status: the runtime derives it from the code
    expect((await refusal(getBilling(pair.client))).code).toBe('forbidden')
    pair.end()
  })

  test('an evicted filterId is sent inline again (D54) and registered anew', async () => {
    const { engine, pair } = setup()
    const churned = engine.store.tables.customers.filter((customer) => customer.status === 'churned').length
    const stored = await saveFilter(pair.client, { resource: 'customers', filter: { where: { field: 'status', op: 'eq', value: 'churned' } } })
    engine.store.forgetFilters()

    const recovered = await getCustomers(pair.client, { filterId: stored.id })
    expect(recovered.total).toBe(churned)

    const watched = collector<ListResponse<Customer>>()
    pair.connection.subscribe(live.customers, { filterId: stored.id }, watched.listener)
    await eventually('the inline snapshot arrived', () => watched.states.length === 1 || watched.error !== undefined)
    expect(watched.error).toBeUndefined()
    expect(watched.states[0]?.data.total).toBe(churned)
    expect(watched.states[0]?.filterId).toBeString()
    expect(watched.states[0]?.filterId).not.toBe(stored.id)

    const stranger = setup().pair // another pair never stored the filter: nothing to recover
    expect((await refusal(getCustomers(stranger.client, { filterId: stored.id }))).code).toBe('not_found')
    stranger.end()
    pair.end()
  })

  test('each facet counts under the filter without its own selection (D31), live', async () => {
    const { engine, pair } = setup()
    const filter: CustomersFilter = { where: { and: [{ field: 'status', op: 'in', value: ['churned'] }, { field: 'country', op: 'eq', value: 'DE' }] } }
    const facets = await getCustomerFacets(pair.client, { filter })
    const customers = engine.store.tables.customers
    expect(facets.status.map((facet) => facet.value)).toEqual(['active', 'onHold', 'churned'])
    for (const facet of facets.status) expect(facet.count).toBe(customers.filter((customer) => customer.country === 'DE' && customer.status === facet.value).length)
    for (const facet of facets.country) expect(facet.count).toBe(customers.filter((customer) => customer.status === 'churned' && customer.country === facet.value).length)
    expect(facets.status.find((facet) => facet.value === 'active')?.count).toBeGreaterThan(0)

    const watched = collector<CustomerFacets>()
    pair.connection.subscribe(live.customerFacets, { filter }, watched.listener)
    await eventually('the facets arrived', () => watched.states.length === 1)
    const german = customers.find((customer) => customer.country === 'DE' && customer.status === 'active') as Customer
    engine.store.update('customers', german.id, { status: 'onHold' })
    await eventually('the facets were replaced', () => watched.states.length === 2)
    const active = (state: LiveState<CustomerFacets> | undefined): number | undefined => state?.data.status.find((facet) => facet.value === 'active')?.count
    expect(active(watched.states[1])).toBe((active(watched.states[0]) ?? 0) - 1)
    pair.end()
  })

  test('the jobs list leaves the result out; the item read carries it', async () => {
    const { pair } = setup()
    const page = await getJobs(pair.client)
    expect(page.items.every((job) => job.result === null)).toBe(true)
    expect((await getJobsItem(pair.client, { id: 'job-1' })).result).toEqual({ fileId: 'fil-3', rows: 1240 })
    expect((await refusal(cancelJob(pair.client, { id: 'job-1' }))).code).toBe('conflict')
    expect((await refusal(retryJob(pair.client, { id: 'job-3' }))).code).toBe('conflict')
    pair.end()
  })

  test('an upload pushes its row before it answers it, then the scan turns it ready', async () => {
    const { pair } = setup()
    const statuses: string[] = []
    const watched = collector<ListResponse<FileItem>>()
    pair.connection.subscribe(live.files, {}, {
      ...watched.listener,
      next: (state) => {
        const row = state.data.items.find((file) => file.name === 'report.pdf')
        if (row !== undefined && statuses.at(-1) !== row.status) statuses.push(row.status)
        watched.listener.next(state)
      },
    })
    await eventually('the files arrived', () => watched.states.length === 1)
    const file = await uploadFile(pair.client, { name: 'report.pdf' }, new Blob(['%PDF-1.7'], { type: 'application/pdf' }))
    expect(file).toMatchObject({ name: 'report.pdf', type: 'application/pdf', size: 8, status: 'scanning' })
    expect(statuses).toEqual(['scanning'])
    await eventually('the scan finished', () => statuses.at(-1) === 'ready')
    const refused = await refusal(uploadFile(pair.client, {}, new Blob(['x'], { type: 'application/zip' }), { contentType: 'application/zip' as 'text/plain' }))
    expect(refused.fields['file']).toStartWith('must be one of')
    pair.end()
  })

  test('a join shows the socket on the record next to the fake colleagues', async () => {
    const { engine, pair } = setup()
    const key = engine.store.tables.customers[0]?.id as string
    const watched = collector<ListResponse<PresenceItem>>()
    pair.connection.subscribe(live['customers.presence'], { key }, watched.listener)
    await eventually('the presences arrived', () => watched.states.length === 1)
    const colleagues = watched.states[0]?.data.total ?? 0
    const registration = pair.connection.join(live['customers.presence'], { key }, { editing: 'name' })
    await registration.ready
    await eventually('the join was pushed', () => watched.states.at(-1)?.data.total === colleagues + 1)
    expect(watched.states.at(-1)?.data.items.at(-1)).toMatchObject({ display: 'Ada Lovelace', state: { editing: 'name' } })
    registration.leave()
    await eventually('the leave was pushed', () => watched.states.at(-1)?.data.total === colleagues)
    pair.end()
  })
})
