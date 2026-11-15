// The demo application's side of the fake, as a livewire app declares it: the mutations with
// their body validation, the upload, the job runner and the random live changes (in a real app
// the Handle functions of NewMutation and NewUpload and a govengers/jobs worker). engine.ts runs
// them; every change goes through the store functions, which push it to the subscribers.

import { uuidv7 } from '../api/runtime'
import { uploads } from './api'
import { currencyOf, fields, type ApiKey, type Customer, type CustomerFacets, type FileItem, type ListTable, type Order, type OrderStatus, type Settings, type Tables, type User } from './data'
import type { FakeStore } from './engine'
import { Refusal, parseFilter, withoutField } from './query'

/** A mutation's answer: its success status and the body, none for 204. */
export interface Answer {
  status: number
  payload?: unknown
}

export type Mutation = (parameters: Record<string, string>, body: unknown) => Answer

export interface HandlerContext extends Pick<FakeStore, 'insert' | 'update' | 'remove'> {
  tables: Tables
  random: () => number
  /** The engine's latency: jobs and uploads step in multiples of it. */
  latency: number
}

export interface Handlers {
  mutations: Record<string, Mutation>
  /** Runs a queued or running job to its end in steps (D29). */
  runJob(id: string): void
  tick(): void
  receiveUpload(parameters: Record<string, string>, body: unknown, contentType: string | null): Promise<Answer>
  customerFacets(document: unknown): CustomerFacets
}

const facetFields = ['status', 'country', 'owner', 'tags'] as const
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { draft: 'open', open: 'paid', paid: 'shipped' }
const maximumUploadBytes = 10 * 1024 * 1024

export function createHandlers(context: HandlerContext): Handlers {
  const { tables, insert, update, remove, random, latency } = context
  const actingUser = tables.users[0] as User // the demo identity demo:ada
  const now = (): string => new Date().toISOString()

  function pick<Item>(items: readonly Item[]): Item | undefined {
    return items[Math.floor(random() * items.length)]
  }

  function customerOf(id: unknown): Customer | undefined {
    return tables.customers.find((customer) => customer.id === id)
  }

  function newOrder(customer: Customer, total: number): Order {
    return {
      id: uuidv7(), customerId: customer.id, number: `SO-${10001 + tables.orders.length}`, status: 'draft', total,
      currency: currencyOf(customer.country), createdAt: now(),
    }
  }

  const customerRules: Record<string, Rule> = {
    name: nonEmpty, email, status: oneOf(enumOf('customers', 'status')), tags: stringList, country: nonEmpty, revenue: amount,
    owner: (value) => (tables.users.some((user) => user.id === value) ? undefined : 'unknown user'),
  }
  const orderRules: Record<string, Rule> = {
    id: nonEmpty, total: amount, status: oneOf(enumOf('orders', 'status')), currency: oneOf(enumOf('orders', 'currency')),
    customerId: (value) => (customerOf(value) === undefined ? 'unknown customer' : undefined),
  }
  const settingsRules: Record<string, Rule> = {
    companyName: nonEmpty, supportEmail: email, timezone: nonEmpty, language: oneOf(['en', 'de']), notifyByEmail: flag, weeklyDigest: flag,
  }

  const mutations: Record<string, Mutation> = {
    createCustomer: (_, body) => {
      const input = objectBody(body)
      validate(input, { ...customerRules, id: nonEmpty }, ['name', 'email'])
      const id = typeof input['id'] === 'string' ? input['id'] : uuidv7()
      if (customerOf(id) !== undefined) throw new Refusal('conflict')
      const customer: Customer = {
        name: '', email: '', status: 'active', tags: [], country: 'DE', revenue: 0, owner: actingUser.id, createdAt: now(),
        ...(input as Partial<Customer>), id,
      }
      return { status: 201, payload: insert('customers', customer) }
    },
    updateCustomer: ({ id }, body) => {
      const input = objectBody(body)
      validate(input, customerRules, [])
      const updated = update('customers', id ?? '', input as Partial<Customer>)
      if (updated === undefined) throw new Refusal('not_found')
      return { status: 200, payload: updated }
    },
    deleteCustomer: ({ id }) => {
      if (!remove('customers', id ?? '')) throw new Refusal('not_found')
      return { status: 204 }
    },
    createOrder: (_, body) => {
      const input = objectBody(body)
      validate(input, orderRules, ['customerId', 'total'])
      const order: Order = { ...newOrder(customerOf(input['customerId']) as Customer, 0), ...(input as Partial<Order>) }
      if (tables.orders.some((existing) => existing.id === order.id)) throw new Refusal('conflict')
      return { status: 201, payload: insert('orders', order) }
    },
    updateSettings: (_, body) => {
      const input = objectBody(body)
      validate(input, settingsRules, [])
      return { status: 200, payload: update('settings', 'settings', input as Partial<Settings>) }
    },
    startJob: (_, body) => {
      const input = objectBody(body)
      validate(input, { kind: nonEmpty }, ['kind'])
      const job = insert('jobs', { id: uuidv7(), kind: String(input['kind']), status: 'queued', progress: 0, resultRoute: null, createdAt: now() })
      runJob(job.id)
      return { status: 201, payload: job }
    },
    createApiKey: (_, body) => {
      const input = objectBody(body)
      const expiresAt: Rule = (value) => (value === null || (typeof value === 'string' && !Number.isNaN(Date.parse(value))) ? undefined : 'must be a time or null')
      validate(input, { name: nonEmpty, scopes: stringList, expiresAt }, ['name', 'scopes'])
      const id = uuidv7()
      const key: ApiKey = {
        id, name: String(input['name']), prefix: `demo_${id.slice(0, 8)}`, scopes: input['scopes'] as string[],
        expiresAt: (input['expiresAt'] as string | null | undefined) ?? null, lastUsedAt: null, createdAt: now(),
      }
      const secret = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16)).join('')
      return { status: 201, payload: { ...insert('apiKeys', key), secret: `${key.prefix}.${secret}` } }
    },
    revokeApiKey: ({ id }) => {
      if (!remove('apiKeys', id ?? '')) throw new Refusal('not_found')
      return { status: 204 }
    },
    createFeedback: (_, body) => {
      const input = objectBody(body)
      validate(input, {
        type: oneOf(['bug', 'idea', 'question']), text: nonEmpty,
        severity: (value) => (value === null ? undefined : oneOf(['low', 'medium', 'high', 'critical'])(value)),
        environment: (value) => (value === null || (typeof value === 'object' && !Array.isArray(value)) ? undefined : 'must be an object or null'),
        entries: (value) => (Array.isArray(value) ? undefined : 'must be a list'),
        screenshot: (value) => (value === null || (typeof value === 'string' && value.startsWith('data:image/')) ? undefined : 'must be an image data URL or null'),
      }, ['type', 'text'])
      return { status: 201, payload: { id: uuidv7(), createdAt: now() } } // the demo keeps no feedback table
    },
    markNotificationRead: ({ id }) => {
      const notification = tables.notifications.find((candidate) => candidate.id === id)
      if (notification === undefined) throw new Refusal('not_found')
      return { status: 200, payload: notification.readAt === null ? update('notifications', notification.id, { readAt: now() }) : notification }
    },
    markAllNotificationsRead: () => {
      const unread = tables.notifications.filter((notification) => notification.readAt === null)
      const at = now()
      for (const notification of unread) update('notifications', notification.id, { readAt: at })
      return { status: 200, payload: { unread: 0 } }
    },
    sendMessage: (_, body) => {
      const input = objectBody(body)
      validate(input, { id: nonEmpty, text: nonEmpty, mode: oneOf(['chat', 'guide', 'drive']) }, ['text']) // mode steers the agent, the row does not keep it
      const id = typeof input['id'] === 'string' ? input['id'] : uuidv7()
      if (tables.conversation.some((message) => message.id === id)) throw new Refusal('conflict')
      return { status: 201, payload: insert('conversation', { id, role: 'user', text: String(input['text']), createdAt: now() }) }
    },
  }

  function runJob(id: string): void {
    setTimeout(function step() {
      const job = tables.jobs.find((candidate) => candidate.id === id)
      if (job === undefined || job.status === 'succeeded' || job.status === 'failed') return
      const progress = job.status === 'queued' ? 0 : Math.min(100, job.progress + 10 + Math.floor(random() * 20))
      if (progress === 100) {
        update('jobs', id, { status: 'succeeded', progress, resultRoute: `/jobs/${id}` })
        return
      }
      update('jobs', id, { status: 'running', progress })
      setTimeout(step, latency * 4)
    }, latency * 4)
  }

  /** One random, realistic change: a revenue moves, an order advances, an order arrives, a customer changes status. */
  function tick(): void {
    const roll = random()
    if (roll < 0.4) {
      const customer = pick(tables.customers)
      if (customer !== undefined) update('customers', customer.id, { revenue: Math.round(customer.revenue * (0.9 + random() * 0.25)) })
    } else if (roll < 0.7) {
      const order = pick(tables.orders.filter((candidate) => nextStatus[candidate.status] !== undefined))
      const status = order === undefined ? undefined : nextStatus[order.status]
      if (order !== undefined && status !== undefined) update('orders', order.id, { status })
    } else if (roll < 0.85) {
      const customer = pick(tables.customers.filter((candidate) => candidate.status === 'active'))
      if (customer !== undefined) insert('orders', newOrder(customer, Math.round((50 + random() * 5000) * 100) / 100))
    } else {
      const customer = pick(tables.customers)
      if (customer !== undefined) update('customers', customer.id, { status: pick(['active', 'onHold', 'churned'] as const) ?? 'active' })
    }
  }

  /**
   * An upload (D17), REST only. fetch reports no upload progress, so the fake reports it the way a
   * server can: the file's row in `files` counts its progress live while the body "arrives", and
   * the answer is the finished row.
   */
  async function receiveUpload(parameters: Record<string, string>, body: unknown, contentType: string | null): Promise<Answer> {
    let file: Blob
    let name = parameters['name']
    if (body instanceof FormData) {
      const part = body.get('file')
      if (!(part instanceof Blob)) throw new Refusal('invalid_request', { file: 'required' })
      file = part
      name ??= part instanceof File ? part.name : undefined
    } else if (body instanceof Blob) {
      file = body
    } else {
      throw new Refusal('invalid_request', { body: 'must be a file' })
    }
    const type = body instanceof FormData ? file.type : (contentType ?? file.type)
    const accepted: readonly string[] = uploads.uploadFile.contentTypes
    if (!accepted.includes(type)) throw new Refusal('invalid_request', { file: `must be one of ${accepted.join(', ')}` })
    if (file.size > maximumUploadBytes) throw new Refusal('invalid_request', { file: `at most ${maximumUploadBytes} bytes` })
    const customerId = parameters['customerId']
    if (customerId !== undefined && customerOf(customerId) === undefined) throw new Refusal('invalid_request', { customerId: 'unknown customer' })
    const { id } = insert('files', { id: uuidv7(), name: name ?? 'file', size: file.size, type, status: 'uploading', progress: 0, customerId: customerId ?? null, createdAt: now() })
    let row: FileItem | undefined
    for (const progress of [25, 50, 75, 100]) {
      await new Promise((resolve) => setTimeout(resolve, latency * 2))
      row = update('files', id, progress === 100 ? { status: 'ready', progress } : { progress })
    }
    return { status: 201, payload: row }
  }

  /**
   * The customer facets (D31), a custom object read as an application declares one: every value
   * of each facet field in a fixed order, zero counts included, each counted under the filter
   * without that field's own clauses, so a count shows what ticking the value would yield.
   */
  function customerFacets(document: unknown): CustomerFacets {
    const instant = Date.now()
    parseFilter(fields.customers, document, instant) // a bad document is refused as a whole, not per facet
    const facets: CustomerFacets = { status: [], country: [], owner: [], tags: [] }
    for (const name of facetFields) {
      const rows = tables.customers.filter(parseFilter(fields.customers, withoutField(document, name), instant))
      const carries = (customer: Customer, value: string): boolean => {
        const field = customer[name]
        return Array.isArray(field) ? field.includes(value) : field === value
      }
      const values = name === 'status' ? enumOf('customers', name) : [...new Set(tables.customers.flatMap((customer) => customer[name]))].sort((left, right) => left.localeCompare(right, 'en'))
      facets[name] = values.map((value) => ({ value, count: rows.filter((row) => carries(row, value)).length }))
    }
    return facets
  }

  return { mutations, runJob, tick, receiveUpload, customerFacets }
}

/** The values of an enum field, in their declared order. */
export function enumOf(table: ListTable, name: string): readonly string[] {
  return fields[table].find((meta) => meta.name === name)?.enum ?? []
}

// Body validation: each rule answers what is wrong with a value, or undefined.

type Rule = (value: unknown) => string | undefined

const nonEmpty: Rule = (value) => (typeof value === 'string' && value.trim() !== '' ? undefined : 'must not be empty')
const email: Rule = (value) => (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'must be an email address')
const amount: Rule = (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? undefined : 'must be a number of at least 0')
const flag: Rule = (value) => (typeof value === 'boolean' ? undefined : 'must be true or false')
const stringList: Rule = (value) => (Array.isArray(value) && value.every((item) => typeof item === 'string') ? undefined : 'must be a list of strings')
const oneOf = (values: readonly string[]): Rule => (value) => (typeof value === 'string' && values.includes(value) ? undefined : `must be one of ${values.join(', ')}`)

export function objectBody(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new Refusal('invalid_request', { body: 'must be an object' })
  return body as Record<string, unknown>
}

/** Refuses the body with every field that is missing, unknown (livewire D40) or breaks its rule. */
function validate(body: Record<string, unknown>, rules: Record<string, Rule>, required: readonly string[]): void {
  const problems: Record<string, string> = {}
  for (const name of required) if (body[name] === undefined) problems[name] = 'required'
  for (const [name, value] of Object.entries(body)) {
    const problem = Object.hasOwn(rules, name) ? rules[name]?.(value) : 'unknown field'
    if (problem !== undefined) problems[name] = problem
  }
  if (Object.keys(problems).length > 0) throw new Refusal('invalid_request', problems)
}
