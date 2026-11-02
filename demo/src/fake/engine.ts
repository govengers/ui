// The demo's in-browser fake livewire backend (D14): a `fetch` for the REST routes and a
// WebSocket class for the socket, both speaking livewire's wire protocol over the seeded tables
// of data.ts, so the vendored runtime.ts and vue.ts run unchanged. A frame's path through this
// file: ServerSocket.send waits `latency`, handle() answers it with read() or call(); a call
// changes a table through the store, which schedules publish(); publish() re-runs every
// subscription of every socket and pushes a diff (lists) or a replace (objects) where the answer
// changed. REST requests take the same read() and call() through the routes of api.ts.

import { uuidv7, type DistinctValue, type FilterItem, type ListChange, type ListResponse, type PresenceItem, type PushFrame, type RequestFrame, type ResponseFrame, type WebSocketLike } from '../api/runtime'
import { calls, downloads, reads, uploads } from './api'
import { createRandom, fields, seedTables, type Customer, type ListTable, type Tables, type User } from './data'
import { createHandlers, objectBody, type Answer } from './handlers'
import { Refusal, canonical, distinctValues, listPage, parseFilter, select, type Row } from './query'

export interface FakeEngineOptions {
  /** How long a request takes in ms (default 150), so loading states show; jobs and uploads step in multiples of it. */
  latency?: number
  /** The seed of the data and of the random changes (default 1). */
  seed?: number
}

type RowOf<Table extends keyof Tables> = Tables[Table][number]

/** The tables behind the fake, for the demo and the scripted agent; every change is pushed to the subscribers. */
export interface FakeStore {
  /** The rows as they are now; change them only through the functions below. */
  readonly tables: Readonly<Tables>
  insert<Table extends keyof Tables>(table: Table, row: RowOf<Table>): RowOf<Table>
  update<Table extends keyof Tables>(table: Table, id: string, patch: Partial<RowOf<Table>>): RowOf<Table> | undefined
  remove(table: keyof Tables, id: string): boolean
  /** One random, realistic change: a revenue moves, an order advances, an order arrives, a customer changes status. */
  tick(): void
  /** Evicts every unnamed stored filter, as the server's cap may (D54): a read naming one answers 404 and the runtime sends it inline. */
  forgetFilters(): void
}

export interface FakeEngine {
  /** Pass as ClientOptions.fetch. */
  fetch: typeof fetch
  /** Pass as LiveOptions.WebSocket. */
  WebSocket: new (url: string) => WebSocketLike
  store: FakeStore
}

interface Subscription {
  id: string
  target: string
  /** The parameters every re-run reads with: a filterId is resolved to its document once, as the real engine does. */
  parameters: Record<string, string>
  list: boolean
  sequence: number
  /** The payload last pushed, which the next re-run is diffed against. */
  last: unknown
}

interface Route {
  method: string
  path: string
  run(parameters: Record<string, string>, request: RequestInit, headers: Headers): Response | Promise<Response>
}

/** The list tables' default sort and paging mode (D38: orders page by cursor). */
const resources: Record<ListTable, { defaultSort: readonly string[]; cursor: boolean }> = {
  customers: { defaultSort: ['name'], cursor: false },
  orders: { defaultSort: ['-createdAt'], cursor: true },
  users: { defaultSort: ['name'], cursor: false },
  jobs: { defaultSort: ['-createdAt'], cursor: false },
  files: { defaultSort: ['-createdAt'], cursor: false },
  conversation: { defaultSort: ['createdAt'], cursor: false },
}

const listTargets = new Set(Object.values(reads).filter((target) => target.list).map((target) => target.target))
/** The demo's baseURL ends in this path; a REST route is matched on what follows it. */
const basePath = '/api/v1'

export function createFakeEngine(options: FakeEngineOptions = {}): FakeEngine {
  const latency = options.latency ?? 150
  const tables = seedTables(options.seed ?? 1)
  const random = createRandom((options.seed ?? 1) + 1)
  const actingUser = tables.users[0] as User // the demo identity demo:ada
  const filters = new Map<string, FilterItem>()
  const idempotency = new Map<string, Answer>()
  const sockets = new Set<ServerSocket>()
  /** Who joined a record ("customers:<id>"), by socket id (D37). */
  const presences = new Map<string, Map<string, PresenceItem>>()
  let publishScheduled = false
  let lastID = 0

  // The store: every change schedules one publish, so changes in one task push together.

  function rowsOf(table: keyof Tables): Row[] {
    return tables[table] as Row[]
  }

  function insert<Table extends keyof Tables>(table: Table, row: RowOf<Table>): RowOf<Table> {
    rowsOf(table).push(row)
    changed()
    return row
  }

  /** Replaces the row with a patched copy: the payload a subscription pushed last keeps the old one to diff against. */
  function update<Table extends keyof Tables>(table: Table, id: string, patch: Partial<RowOf<Table>>): RowOf<Table> | undefined {
    const rows = rowsOf(table)
    const index = rows.findIndex((row) => row.id === id)
    if (index < 0) return undefined
    const next = { ...rows[index], ...patch } as unknown as RowOf<Table>
    rows[index] = next
    changed()
    return next
  }

  function remove(table: keyof Tables, id: string): boolean {
    const rows = rowsOf(table)
    const index = rows.findIndex((row) => row.id === id)
    if (index < 0) return false
    rows.splice(index, 1)
    changed()
    return true
  }

  const handlers = createHandlers({ tables, insert, update, remove, random, latency })

  // Reads: the target's name, then its kind after a dot (livewire D46).

  function read(target: string | undefined, parameters: Record<string, string>): unknown {
    const [name = '', kind = ''] = (target ?? '').split('.')
    if (kind === '' && name === 'settings') return tables.settings[0]
    if (kind === '' && name === 'billing') throw new Refusal('forbidden')
    if (kind === '' && name === 'customerFacets') return handlers.customerFacets(filterOf('customers', parameters))
    if (!isListTable(name)) throw new Refusal('not_found')
    const rows: readonly Row[] = tables[name]
    if (kind === '') return listPage(rows, parameters, filterOf(name, parameters), { fields: fields[name], ...resources[name] }, Date.now())
    if (kind === 'item') return rows.find((row) => row.id === parameters['id']) ?? notFound()
    if (kind === 'distinct') return distinct(name, rows, parameters)
    if (kind === 'presence') return presenceOf(recordOf(name, parameters['key']), parameters['key'] ?? '')
    throw new Refusal('not_found')
  }

  /** The filter document a read names inline or by filterId; an unknown or evicted filterId is 404 (D54). */
  function filterOf(table: ListTable, parameters: Record<string, string>): unknown {
    const filterId = parameters['filterId']
    const inline = parameters['filter']
    if (filterId !== undefined && filterId !== '') {
      if (inline !== undefined) throw new Refusal('invalid_request', { filter: 'filter and filterId exclude each other' })
      const stored = filters.get(filterId)
      if (stored === undefined || stored.resource !== table) throw new Refusal('not_found')
      stored.lastUsedAt = new Date().toISOString()
      return stored.filter
    }
    if (inline === undefined || inline === '') return undefined
    try {
      return JSON.parse(inline)
    } catch {
      throw new Refusal('invalid_filter', { '': 'is not valid JSON' })
    }
  }

  /** The distinct read (livewire D15): one filterable scalar field under the filter, most frequent value first. */
  function distinct(table: ListTable, rows: readonly Row[], parameters: Record<string, string>): DistinctValue[] {
    const name = parameters['field']
    if (name === undefined || name === '') throw new Refusal('invalid_request', { field: 'required' })
    const meta = fields[table].find((candidate) => candidate.name === name)
    if (meta === undefined || !meta.filter || meta.type === 'stringArray') throw new Refusal('invalid_request', { field: 'must be a filterable scalar field' })
    const matches = parseFilter(fields[table], filterOf(table, parameters), Date.now())
    return distinctValues(rows.filter(matches), name).slice(0, 1000)
  }

  /** The record a presence read, join or leave names (D37): only customers have presence here. */
  function recordOf(declaration: string | undefined, key: string | undefined): string {
    if (declaration !== 'customers') throw new Refusal('not_found')
    if (key === undefined || key === '') throw new Refusal('invalid_request', { key: 'required, once' })
    if (!tables.customers.some((customer) => customer.id === key)) throw new Refusal('not_found')
    return `customers:${key}`
  }

  /** Who is on a record: the sockets that joined it, after zero to two fake colleagues, always the same ones per record. */
  function presenceOf(record: string, key: string): ListResponse<PresenceItem> {
    const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const colleagues = tables.users.slice(1).filter((_, index) => (hash + index) % 3 === 0).slice(0, hash % 3)
    const items: PresenceItem[] = colleagues.map((user) => ({ id: `colleague-${user.id}`, display: user.name, state: null }))
    items.push(...(presences.get(record)?.values() ?? []))
    return { limit: items.length, offset: 0, total: items.length, items }
  }

  // Calls: the handlers of handlers.ts, answered once per Idempotency-Key (D16).

  /** Runs a mutation; a key seen before answers its recorded answer without running it again. */
  function call(name: string | undefined, parameters: Record<string, string>, body: unknown, key: string | undefined): Answer {
    const mutation = name !== undefined && Object.hasOwn(handlers.mutations, name) ? handlers.mutations[name] : undefined
    if (mutation === undefined) throw new Refusal('not_found')
    const recorded = key === undefined ? undefined : idempotency.get(key)
    if (recorded !== undefined) return recorded
    const answer = mutation(parameters, body)
    if (key !== undefined) idempotency.set(key, answer)
    return answer
  }

  // Stored filters (livewire D13): an unnamed one is deduplicated by its canonical document.

  function saveFilter(body: unknown): FilterItem {
    const request = objectBody(body)
    const resource = request['resource']
    if (typeof resource !== 'string' || !isListTable(resource)) throw new Refusal('invalid_request', { resource: 'is not a filterable target' })
    if (request['filter'] === undefined) throw new Refusal('invalid_request', { filter: 'required' })
    parseFilter(fields[resource], request['filter'], Date.now())
    const name = typeof request['name'] === 'string' && request['name'] !== '' ? request['name'] : undefined
    const now = new Date().toISOString()
    if (name === undefined) {
      for (const stored of filters.values()) {
        if (stored.name === undefined && stored.resource === resource && canonical(stored.filter) === canonical(request['filter'])) {
          stored.lastUsedAt = now
          return stored
        }
      }
    }
    const stored: FilterItem = { id: uuidv7(), resource, filter: request['filter'], createdAt: now, lastUsedAt: now }
    if (name !== undefined) stored.name = name
    if (typeof request['context'] === 'string' && request['context'] !== '') stored.context = request['context']
    filters.set(stored.id, stored)
    return stored
  }

  // The socket: one instance per LiveConnection socket, frames answered after `latency`.

  class ServerSocket implements WebSocketLike {
    readyState = 0
    onopen: ((event: unknown) => void) | null = null
    onmessage: ((event: { data: unknown }) => void) | null = null
    onclose: ((event: { code: number; reason: string }) => void) | null = null
    onerror: ((event: unknown) => void) | null = null
    readonly id = `socket-${++lastID}`
    readonly subscriptions = new Map<string, Subscription>()
    readonly records = new Set<string>()

    constructor(readonly url: string) {
      sockets.add(this)
      setTimeout(() => {
        if (this.readyState !== 0) return
        this.readyState = 1
        this.onopen?.({})
      }, latency)
    }

    send(data: string): void {
      const frame = JSON.parse(data) as RequestFrame
      setTimeout(() => this.handle(frame), latency)
    }

    /** Ends the socket: its subscriptions end and its presences leave, as on the server. */
    close(code = 1000, reason = ''): void {
      if (this.readyState === 3) return
      this.readyState = 3
      sockets.delete(this)
      this.subscriptions.clear()
      for (const record of this.records) presences.get(record)?.delete(this.id)
      if (this.records.size > 0) changed()
      setTimeout(() => this.onclose?.({ code, reason }), 0)
    }

    emit(frame: ResponseFrame | PushFrame): void {
      if (this.readyState === 1) this.onmessage?.({ data: JSON.stringify(frame) })
    }

    private answer(id: string, answer: Answer): void {
      const frame: ResponseFrame = { id, ok: true, status: answer.status }
      if (answer.payload !== undefined) frame.payload = answer.payload
      this.emit(frame)
    }

    private handle(frame: RequestFrame): void {
      if (this.readyState !== 1) return
      const parameters = frame.params ?? {}
      try {
        switch (frame.op) {
          case 'ping':
            this.answer(frame.id, { status: 200 })
            break
          case 'query':
            this.answer(frame.id, { status: 200, payload: read(frame.target, parameters) })
            break
          case 'subscribe':
            this.subscribe(frame.id, frame.target ?? '', parameters)
            break
          case 'unsubscribe':
            if (!this.subscriptions.delete(frame.target ?? '')) notFound()
            this.answer(frame.id, { status: 200 })
            break
          case 'call':
            this.answer(frame.id, call(frame.target, parameters, frame.body, frame.idempotencyKey))
            break
          case 'join': {
            const record = recordOf(frame.target, parameters['key'])
            const present = presences.get(record) ?? new Map<string, PresenceItem>()
            present.set(this.id, { id: this.id, display: actingUser.name, state: frame.body ?? null })
            presences.set(record, present)
            this.records.add(record)
            changed()
            this.answer(frame.id, { status: 200 })
            break
          }
          case 'leave': {
            const record = recordOf(frame.target, parameters['key'])
            presences.get(record)?.delete(this.id)
            this.records.delete(record)
            changed()
            this.answer(frame.id, { status: 200 })
            break
          }
          default:
            throw new Refusal('invalid_request', { op: 'is not an operation of the fake socket' })
        }
      } catch (error) {
        const refusal = asRefusal(error)
        this.emit({ id: frame.id, ok: false, status: refusal.status, error: refusal.body })
      }
    }

    /** Answers the subscription id (and the filterId an inline filter was stored as, D13), then the first push. */
    private subscribe(id: string, target: string, parameters: Record<string, string>): void {
      const payload = read(target, parameters)
      const [name = '', kind = ''] = target.split('.')
      const filterable = isListTable(name) && (kind === '' || kind === 'distinct')
      let rerun = parameters
      let filterId: string | undefined
      if (filterable && parameters['filterId'] !== undefined) {
        rerun = { ...parameters, filter: JSON.stringify(filterOf(name, parameters)) }
        delete rerun['filterId']
      } else if (filterable && parameters['filter'] !== undefined) {
        filterId = saveFilter({ resource: name, filter: JSON.parse(parameters['filter']) }).id
      }
      const subscription: Subscription = { id: `sub-${++lastID}`, target, parameters: rerun, list: listTargets.has(target), sequence: 1, last: payload }
      this.subscriptions.set(subscription.id, subscription)
      const response: ResponseFrame = { id, ok: true, status: 200, subscription: subscription.id }
      if (filterId !== undefined) response.filterId = filterId
      this.emit(response)
      this.emit({ sub: subscription.id, seq: 1, kind: subscription.list ? 'snapshot' : 'replace', payload })
    }
  }

  // Publishing: every subscription re-runs after a change; only a changed answer is pushed.

  function changed(): void {
    if (publishScheduled) return
    publishScheduled = true
    setTimeout(publish, 0)
  }

  function publish(): void {
    publishScheduled = false
    for (const socket of sockets) {
      for (const subscription of [...socket.subscriptions.values()]) {
        const push = rerun(subscription)
        if (push === undefined) continue
        if (push.kind === 'error') socket.subscriptions.delete(subscription.id)
        socket.emit(push)
      }
    }
  }

  /** ponytail: re-runs every subscription on every change; index by table if a demo ever has hundreds. */
  function rerun(subscription: Subscription): PushFrame | undefined {
    let payload: unknown
    try {
      payload = read(subscription.target, subscription.parameters)
    } catch (error) {
      // A refusal ends the subscription with an error push (a deleted item, a revoked read).
      return { sub: subscription.id, seq: ++subscription.sequence, kind: 'error', payload: asRefusal(error).body }
    }
    const change = subscription.list
      ? diffLists(subscription.last as ListResponse<Row>, payload as ListResponse<Row>)
      : JSON.stringify(payload) === JSON.stringify(subscription.last) ? undefined : payload
    if (change === undefined) return undefined
    subscription.last = payload
    return { sub: subscription.id, seq: ++subscription.sequence, kind: subscription.list ? 'diff' : 'replace', payload: change }
  }

  // REST: the routes of api.ts, literal paths before paths with placeholders.

  const routes: Route[] = [
    ...Object.values(reads).map((target): Route => ({ method: 'GET', path: target.path, run: (parameters) => json(200, read(target.target, parameters)) })),
    ...Object.values(calls).map((mutation): Route => ({
      method: mutation.method,
      path: mutation.path,
      run: (parameters, request, headers) => {
        const answer = call(mutation.name, parameters, bodyOf(request), headers.get('Idempotency-Key') ?? undefined)
        return json(answer.status, answer.payload)
      },
    })),
    {
      method: 'POST', path: uploads.uploadFile.path, run: async (parameters, request, headers) => {
        const answer = await handlers.receiveUpload(parameters, request.body, headers.get('Content-Type'))
        return json(answer.status, answer.payload)
      },
    },
    { method: 'GET', path: downloads.customers.path, run: (parameters) => exportCustomers(parameters) },
    { method: 'POST', path: '/filters', run: (_, request) => json(201, saveFilter(bodyOf(request))) },
    {
      method: 'GET', path: '/filters', run: (parameters) => {
        const resource = parameters['resource']
        const items = [...filters.values()].filter((stored) => stored.name !== undefined && (resource === undefined || stored.resource === resource))
        return json(200, { limit: items.length, offset: 0, total: items.length, items })
      },
    },
    { method: 'DELETE', path: '/filters/{id}', run: (parameters) => (filters.delete(parameters['id'] ?? '') ? json(204, undefined) : notFound()) },
  ]
  routes.sort((left, right) => left.path.split('{').length - right.path.split('{').length)

  async function fakeFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
    const url = new URL(input instanceof Request ? input.url : String(input), 'http://fake')
    const method = (init.method ?? 'GET').toUpperCase()
    const base = url.pathname.indexOf(basePath)
    const path = base < 0 ? url.pathname : url.pathname.slice(base + basePath.length)
    await new Promise((resolve) => setTimeout(resolve, latency))
    init.signal?.throwIfAborted() // an aborted request rejects with its reason, as fetch does
    try {
      for (const route of routes) {
        const pathParameters = route.method === method ? matchPath(route.path, path) : undefined
        if (pathParameters === undefined) continue
        return await route.run({ ...Object.fromEntries(url.searchParams), ...pathParameters }, init, new Headers(init.headers))
      }
      return notFound()
    } catch (error) {
      const refusal = asRefusal(error)
      return json(refusal.status, refusal.body)
    }
  }

  /** The customer export (D35): every row under the filter and sort as CSV. */
  function exportCustomers(parameters: Record<string, string>): Response {
    if (parameters['format'] !== undefined && parameters['format'] !== 'csv') throw new Refusal('invalid_request', { format: 'must be csv' })
    const rows = select(tables.customers, fields.customers, filterOf('customers', parameters), parameters['sort'], resources.customers.defaultSort, Date.now())
    const columns = fields.customers.map((meta) => meta.name as keyof Customer)
    const cell = (value: unknown): string => {
      const text = Array.isArray(value) ? value.join(' ') : String(value ?? '')
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
    }
    const lines = [columns.join(','), ...rows.map((row) => columns.map((column) => cell(row[column])).join(','))]
    return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="customers.csv"' } })
  }

  for (const job of tables.jobs) handlers.runJob(job.id) // a seeded running job keeps moving

  return {
    fetch: fakeFetch as typeof fetch,
    WebSocket: ServerSocket,
    store: {
      tables, insert, update, remove, tick: handlers.tick,
      forgetFilters: () => {
        for (const [id, stored] of filters) if (stored.name === undefined) filters.delete(id)
      },
    },
  }
}

function isListTable(name: string): name is ListTable {
  return Object.hasOwn(resources, name)
}

function notFound(): never {
  throw new Refusal('not_found')
}

/** A refusal as it is; anything else is a bug of the fake, answered 500 like the real engine and logged. */
function asRefusal(error: unknown): Refusal {
  if (error instanceof Refusal) return error
  console.error('fake engine:', error)
  return new Refusal('internal')
}

/** The changes from one list answer to the next (the wire's diff); undefined when nothing changed. */
function diffLists(before: ListResponse<Row>, after: ListResponse<Row>): ListChange<Row> | undefined {
  const previous = new Map(before.items.map((item) => [item.id, JSON.stringify(item)]))
  const ids = new Set(after.items.map((item) => item.id))
  const change: ListChange<Row> = {
    upserts: after.items.filter((item) => previous.get(item.id) !== JSON.stringify(item)),
    removes: before.items.map((item) => item.id).filter((id) => !ids.has(id)),
  }
  const order = after.items.map((item) => item.id)
  if (order.join('\n') !== before.items.map((item) => item.id).join('\n')) change.order = order
  if (after.total !== before.total) change.total = after.total
  const unchanged = change.upserts.length === 0 && change.removes.length === 0 && change.order === undefined && change.total === undefined
  return unchanged ? undefined : change
}

function json(status: number, payload: unknown): Response {
  if (payload === undefined) return new Response(null, { status })
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
}

function bodyOf(request: RequestInit): unknown {
  if (typeof request.body !== 'string') return undefined
  try {
    return JSON.parse(request.body)
  } catch {
    throw new Refusal('invalid_request', { body: 'is not valid JSON' })
  }
}

function matchPath(pattern: string, path: string): Record<string, string> | undefined {
  const expected = pattern.split('/')
  const actual = path.split('/')
  if (expected.length !== actual.length) return undefined
  const parameters: Record<string, string> = {}
  for (const [index, part] of expected.entries()) {
    const value = actual[index] ?? ''
    if (part.startsWith('{')) parameters[part.slice(1, -1)] = decodeURIComponent(value)
    else if (part !== value) return undefined
  }
  return parameters
}
