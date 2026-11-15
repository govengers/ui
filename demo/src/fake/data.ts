// The fake engine's seeded demo data (D14): a typical business application's tables, the same
// rows on every load (seeded PRNG), plus each resource's field metadata in the shape the
// generated filters use (name, type, enum, filter, sort, search). engine.ts serves these rows;
// api.ts re-exports the row types for the demos.

import type { DistinctValue } from '../api/runtime'
import type { FieldMeta } from './query'

export type CustomerStatus = 'active' | 'onHold' | 'churned'
export type OrderStatus = 'draft' | 'open' | 'paid' | 'shipped' | 'cancelled'
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF'
export type UserRole = 'admin' | 'member'
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'
export type FileStatus = 'uploading' | 'ready'
export type MessageRole = 'user' | 'agent'

export interface Customer {
  id: string
  name: string
  email: string
  status: CustomerStatus
  tags: string[]
  country: string
  revenue: number
  createdAt: string
  /** The id of the user who owns the account. */
  owner: string
}

export interface Order {
  id: string
  customerId: string
  number: string
  status: OrderStatus
  total: number
  currency: Currency
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string | null
}

export interface Job {
  id: string
  kind: string
  status: JobStatus
  progress: number
  /** The route the result is shown on once the job succeeded (D29). */
  resultRoute: string | null
  createdAt: string
}

/** An attachment; `progress` counts while the server receives it. */
export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  status: FileStatus
  progress: number
  customerId: string | null
  createdAt: string
}

export interface Settings {
  id: 'settings'
  companyName: string
  supportEmail: string
  timezone: string
  language: 'en' | 'de'
  notifyByEmail: boolean
  weeklyDigest: boolean
}

/** One message of the agent conversation (D26). */
export interface Message {
  id: string
  role: MessageRole
  text: string
  createdAt: string
}

/** An API key as its owner sees it (ApiKeyManager): never the secret, only its leading part. */
export interface ApiKey {
  id: string
  name: string
  /** The non-secret start of the key ("demo_01JX..."), to recognise it. */
  prefix: string
  /** Permissions in text form, "customers:read". */
  scopes: string[]
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

/** The value counts of every customer facet, each under the filter without its own clauses (D31). */
export interface CustomerFacets {
  status: DistinctValue[]
  country: DistinctValue[]
  owner: DistinctValue[]
  tags: DistinctValue[]
}

/** Every table of the fake database; settings is a table of one row so the store edits it like any other. */
export interface Tables {
  customers: Customer[]
  orders: Order[]
  users: User[]
  jobs: Job[]
  files: FileItem[]
  conversation: Message[]
  apiKeys: ApiKey[]
  settings: Settings[]
}

/** The tables a list read serves (every one but settings). */
export type ListTable = Exclude<keyof Tables, 'settings'>

const customerStatuses = ['active', 'onHold', 'churned'] as const
const orderStatuses = ['draft', 'open', 'paid', 'shipped', 'cancelled'] as const
const currencies = ['EUR', 'USD', 'GBP', 'CHF'] as const

/** The fields of every list table, as the generated filters would declare them. */
export const fields: Record<ListTable, readonly FieldMeta[]> = {
  customers: [
    { name: 'id', type: 'string', filter: true, sort: true, search: false },
    { name: 'name', type: 'string', filter: true, sort: true, search: true },
    { name: 'email', type: 'string', filter: true, sort: true, search: true },
    { name: 'status', type: 'enum', enum: customerStatuses, filter: true, sort: true, search: false },
    { name: 'tags', type: 'stringArray', filter: true, sort: false, search: false },
    { name: 'country', type: 'string', filter: true, sort: true, search: false },
    { name: 'revenue', type: 'float', filter: true, sort: true, search: false },
    { name: 'createdAt', type: 'time', filter: true, sort: true, search: false },
    { name: 'owner', type: 'string', filter: true, sort: true, search: false },
  ],
  orders: [
    { name: 'id', type: 'string', filter: true, sort: true, search: false },
    { name: 'customerId', type: 'string', filter: true, sort: false, search: false },
    { name: 'number', type: 'string', filter: true, sort: true, search: true },
    { name: 'status', type: 'enum', enum: orderStatuses, filter: true, sort: true, search: false },
    { name: 'total', type: 'float', filter: true, sort: true, search: false },
    { name: 'currency', type: 'enum', enum: currencies, filter: true, sort: true, search: false },
    { name: 'createdAt', type: 'time', filter: true, sort: true, search: false },
  ],
  users: [
    { name: 'id', type: 'string', filter: true, sort: true, search: false },
    { name: 'name', type: 'string', filter: true, sort: true, search: true },
    { name: 'email', type: 'string', filter: true, sort: true, search: true },
    { name: 'role', type: 'enum', enum: ['admin', 'member'], filter: true, sort: true, search: false },
  ],
  jobs: [
    { name: 'id', type: 'string', filter: true, sort: true, search: false },
    { name: 'kind', type: 'string', filter: true, sort: true, search: false },
    { name: 'status', type: 'enum', enum: ['queued', 'running', 'succeeded', 'failed'], filter: true, sort: true, search: false },
    { name: 'progress', type: 'int', filter: true, sort: true, search: false },
    { name: 'createdAt', type: 'time', filter: true, sort: true, search: false },
  ],
  files: [
    { name: 'id', type: 'string', filter: true, sort: true, search: false },
    { name: 'name', type: 'string', filter: true, sort: true, search: true },
    { name: 'type', type: 'string', filter: true, sort: true, search: false },
    { name: 'size', type: 'int', filter: true, sort: true, search: false },
    { name: 'status', type: 'enum', enum: ['uploading', 'ready'], filter: true, sort: true, search: false },
    { name: 'customerId', type: 'string', filter: true, sort: false, search: false },
    { name: 'createdAt', type: 'time', filter: true, sort: true, search: false },
  ],
  conversation: [
    { name: 'id', type: 'string', filter: true, sort: true, search: false },
    { name: 'role', type: 'enum', enum: ['user', 'agent'], filter: true, sort: true, search: false },
    { name: 'text', type: 'text', filter: true, sort: false, search: true },
    { name: 'createdAt', type: 'time', filter: true, sort: true, search: false },
  ],
  apiKeys: [
    { name: 'id', type: 'string', filter: true, sort: true, search: false },
    { name: 'name', type: 'string', filter: true, sort: true, search: true },
    { name: 'createdAt', type: 'time', filter: true, sort: true, search: false },
  ],
}

/** A seeded PRNG (mulberry32): the same seed gives the same numbers in [0, 1). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), state | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

/** The instant the seeded data is "now"; every seeded date lies before it. */
const seededNow = Date.parse('2026-11-02T09:00:00Z')
const day = 86_400_000

const people: [string, UserRole][] = [
  ['Ada Lovelace', 'admin'], ['Grace Hopper', 'admin'], ['Alan Turing', 'member'], ['Katherine Johnson', 'member'],
  ['Linus Torvalds', 'member'], ['Margaret Hamilton', 'member'], ['Dennis Ritchie', 'member'], ['Barbara Liskov', 'member'],
]
const stems = [
  'Alder', 'Bluefin', 'Brightwater', 'Cobalt', 'Copperleaf', 'Driftwood', 'Elmstone', 'Fernhill', 'Foxglove', 'Granite',
  'Harbor', 'Highland', 'Ironbark', 'Juniper', 'Kestrel', 'Lakeshore', 'Löwenstein', 'Meridian', 'Northwind', 'Oakridge',
  'Pinecrest', 'Redwood', 'Riverbend', 'Saltmarsh', 'Silverline', 'Sonnenhof', 'Stonegate', 'Summit', 'Thistle', 'Weißdorn',
]
const forms = ['GmbH', 'AG', 'Labs', 'Logistics', 'Systems', 'Foods', 'Energy', 'Health', 'Media', 'Partners', 'Robotics', 'Studio']
const tagNames = ['enterprise', 'smb', 'partner', 'priority', 'trial', 'reseller', 'public-sector']
const countries = ['DE', 'DE', 'DE', 'DE', 'AT', 'CH', 'FR', 'NL', 'GB', 'GB', 'US', 'US', 'SE', 'ES', 'IT']
const customerStatusWeights: CustomerStatus[] = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'onHold', 'onHold', 'churned']
const orderStatusWeights: OrderStatus[] = ['draft', 'open', 'open', 'paid', 'paid', 'paid', 'shipped', 'shipped', 'shipped', 'cancelled']

/** The currency an order of a customer in the country is billed in. */
export function currencyOf(country: string): Currency {
  return country === 'CH' ? 'CHF' : country === 'GB' ? 'GBP' : country === 'US' ? 'USD' : 'EUR'
}

function slug(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '')
}

/** Fresh tables with the seeded rows: about 120 customers, 300 orders, 8 users and a few of the rest. */
export function seedTables(seed = 1): Tables {
  const random = createRandom(seed)
  const pick = <Value>(values: readonly Value[]): Value => values[Math.floor(random() * values.length)] as Value
  const isoBefore = (latest: number, span: number): string => new Date(Math.floor(latest - random() * span)).toISOString()

  const users: User[] = people.map(([name, role], index) => ({
    id: `usr-${index + 1}`, name, email: `${slug(name.split(' ')[0] ?? name)}@example.com`, role, avatar: null,
  }))

  const names = stems.flatMap((stem) => forms.map((form) => `${stem} ${form}`))
  for (let index = names.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[names[index], names[other]] = [names[other] as string, names[index] as string]
  }
  const customers: Customer[] = names.slice(0, 120).map((name, index) => {
    const country = pick(countries)
    return {
      id: `cus-${String(index + 1).padStart(3, '0')}`,
      name,
      email: `contact@${slug(name)}.example`,
      status: pick(customerStatusWeights),
      tags: tagNames.filter(() => random() < 0.2),
      country,
      revenue: Math.round(2000 + random() * random() * 480_000),
      createdAt: isoBefore(seededNow - 30 * day, 3 * 365 * day),
      owner: pick(users).id,
    }
  })

  const orders: Order[] = Array.from({ length: 300 }, () => {
    const customer = pick(customers)
    const since = Date.parse(customer.createdAt)
    return {
      id: '', number: '', customerId: customer.id, status: pick(orderStatusWeights),
      total: Math.round((50 + random() * random() * 25_000) * 100) / 100,
      currency: currencyOf(customer.country),
      createdAt: isoBefore(seededNow, seededNow - since),
    }
  })
  orders.sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  orders.forEach((order, index) => {
    order.id = `ord-${String(index + 1).padStart(4, '0')}`
    order.number = `SO-${10001 + index}`
  })

  const at = (daysAgo: number): string => new Date(seededNow - daysAgo * day).toISOString()
  const jobs: Job[] = [
    { id: 'job-1', kind: 'export', status: 'succeeded', progress: 100, resultRoute: '/files', createdAt: at(2) },
    { id: 'job-2', kind: 'import', status: 'failed', progress: 60, resultRoute: null, createdAt: at(1) },
    { id: 'job-3', kind: 'report', status: 'running', progress: 40, resultRoute: null, createdAt: at(0.01) },
  ]
  const files: FileItem[] = [
    ['contract-2026.pdf', 'application/pdf', 248_331],
    ['logo.png', 'image/png', 40_960],
    ['price-list.csv', 'text/csv', 8_214],
    ['meeting-notes.txt', 'text/plain', 2_301],
    ['site-photo.jpg', 'image/jpeg', 1_532_118],
  ].map(([name, type, size], index) => ({
    id: `fil-${index + 1}`, name: String(name), type: String(type), size: Number(size), status: 'ready' as const, progress: 100,
    customerId: customers[index * 7]?.id ?? null, createdAt: at(10 - index),
  }))
  const conversation: Message[] = [
    { id: 'msg-1', role: 'user', text: 'Which customers in Germany are on hold?', createdAt: at(0.02) },
    { id: 'msg-2', role: 'agent', text: 'I filtered the customer list to Germany and on hold. Open it to see them.', createdAt: at(0.019) },
  ]
  const settings: Settings[] = [{
    id: 'settings', companyName: 'Govengers Demo GmbH', supportEmail: 'support@demo.example', timezone: 'Europe/Berlin',
    language: 'en', notifyByEmail: true, weeklyDigest: false,
  }]
  const apiKeys: ApiKey[] = [
    { id: 'key-1', name: 'CI pipeline', prefix: 'demo_key-1', scopes: ['customers:read', 'orders:read'], expiresAt: new Date(seededNow + 60 * day).toISOString(), lastUsedAt: at(0.1), createdAt: at(40) },
    { id: 'key-2', name: 'Old import script', prefix: 'demo_key-2', scopes: ['customers:write'], expiresAt: at(3), lastUsedAt: null, createdAt: at(120) },
  ]
  return { customers, orders, users, jobs, files, conversation, apiKeys, settings }
}
