// The demo's API, in the shape livewire's generator writes api.ts and filters.ts (D14, D40):
// typed descriptors (reads, live, calls, uploads, downloads), the filter types and the thin
// REST functions, served by the fake engine. Block demos import from here the way a page
// imports `@/api/api`; blocks themselves import only `@/api/runtime` and `@/api/vue` and take
// these descriptors as props (D5).

import * as runtime from '../api/runtime'
import type { Currency, Customer, CustomerFacets, CustomerStatus, FileItem, FileStatus, Job, JobStatus, Message, MessageRole, Order, OrderStatus, Settings, User, UserRole } from './data'

export type { Currency, Customer, CustomerFacets, CustomerStatus, FileItem, FileStatus, Job, JobStatus, Message, MessageRole, Order, OrderStatus, Settings, User, UserRole } from './data'
export { fields } from './data'

/** A node of a filter document (D12): a condition, or and, or or not over nodes. */
export type FilterNode<Condition> =
  | Condition
  | { and: readonly FilterNode<Condition>[] }
  | { or: readonly FilterNode<Condition>[] }
  | { not: FilterNode<Condition> }

/** A filter document: its conditions under where; the empty document matches every row. */
export interface FilterDocument<Condition> {
  where?: FilterNode<Condition>
}

/** A filter document of a resource with a searchable field. */
export interface SearchableFilterDocument<Condition> extends FilterDocument<Condition> {
  search?: string
}

/** One sort term: the field, or "-field" for descending. */
export type SortTerm<Field extends string> = Field | `-${Field}`

/** A time in a condition: RFC 3339, or relative to the clock of the read. */
export type TimeValue = string | runtime.RelativeTime

type TextCondition<Field extends string> =
  | { field: Field; op: 'eq' | 'ne' | 'contains' | 'startsWith'; value: string }
  | { field: Field; op: 'in' | 'notIn'; value: readonly string[] }
  | { field: Field; op: 'isNull'; value: boolean }
type EnumCondition<Field extends string, Value extends string> =
  | { field: Field; op: 'eq' | 'ne'; value: Value }
  | { field: Field; op: 'in' | 'notIn'; value: readonly Value[] }
  | { field: Field; op: 'isNull'; value: boolean }
type NumberCondition<Field extends string> =
  | { field: Field; op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'; value: number }
  | { field: Field; op: 'in' | 'notIn'; value: readonly number[] }
  | { field: Field; op: 'isNull'; value: boolean }
type TimeCondition<Field extends string> =
  | { field: Field; op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'; value: TimeValue }
  | { field: Field; op: 'in' | 'notIn'; value: readonly TimeValue[] }
  | { field: Field; op: 'isNull'; value: boolean }
type TagsCondition<Field extends string> =
  | { field: Field; op: 'has'; value: string }
  | { field: Field; op: 'hasAny' | 'hasAll'; value: readonly string[] }
  | { field: Field; op: 'isEmpty'; value: boolean }

export type CustomersCondition =
  | TextCondition<'id' | 'name' | 'email' | 'country' | 'owner'>
  | EnumCondition<'status', CustomerStatus>
  | TagsCondition<'tags'>
  | NumberCondition<'revenue'>
  | TimeCondition<'createdAt'>
export type CustomersFilter = SearchableFilterDocument<CustomersCondition>
export type CustomersSortTerm = SortTerm<'id' | 'name' | 'email' | 'status' | 'country' | 'revenue' | 'createdAt' | 'owner'>
export type CustomersDistinctField = 'id' | 'name' | 'email' | 'status' | 'country' | 'revenue' | 'createdAt' | 'owner'

export type OrdersCondition =
  | TextCondition<'id' | 'customerId' | 'number'>
  | EnumCondition<'status', OrderStatus>
  | EnumCondition<'currency', Currency>
  | NumberCondition<'total'>
  | TimeCondition<'createdAt'>
export type OrdersFilter = SearchableFilterDocument<OrdersCondition>
export type OrdersSortTerm = SortTerm<'id' | 'number' | 'status' | 'total' | 'currency' | 'createdAt'>

export type UsersCondition = TextCondition<'id' | 'name' | 'email'> | EnumCondition<'role', UserRole>
export type UsersFilter = SearchableFilterDocument<UsersCondition>
export type UsersSortTerm = SortTerm<'id' | 'name' | 'email' | 'role'>

export type JobsCondition = TextCondition<'id' | 'kind'> | EnumCondition<'status', JobStatus> | NumberCondition<'progress'> | TimeCondition<'createdAt'>
export type JobsFilter = FilterDocument<JobsCondition>
export type JobsSortTerm = SortTerm<'id' | 'kind' | 'status' | 'progress' | 'createdAt'>

export type FilesCondition =
  | TextCondition<'id' | 'name' | 'type' | 'customerId'>
  | EnumCondition<'status', FileStatus>
  | NumberCondition<'size'>
  | TimeCondition<'createdAt'>
export type FilesFilter = SearchableFilterDocument<FilesCondition>
export type FilesSortTerm = SortTerm<'id' | 'name' | 'type' | 'size' | 'status' | 'createdAt'>

export type ConversationCondition = TextCondition<'id' | 'text'> | EnumCondition<'role', MessageRole> | TimeCondition<'createdAt'>
export type ConversationFilter = SearchableFilterDocument<ConversationCondition>
export type ConversationSortTerm = SortTerm<'id' | 'role' | 'createdAt'>

/** The filter document of every target a stored filter may name (D13). */
export interface FilterDocuments {
  customers: CustomersFilter
  orders: OrdersFilter
  users: UsersFilter
  jobs: JobsFilter
  files: FilesFilter
  conversation: ConversationFilter
}

/** The reserved parameters of a filterable list read. */
interface ListQuery<Filter, Sort> {
  filter?: Filter
  filterId?: string
  sort?: readonly Sort[]
  limit?: number
  offset?: number
}

export type CustomersListQuery = ListQuery<CustomersFilter, CustomersSortTerm>
/** Orders page by cursor (D38): `after` is the `next` of the page before. */
export interface OrdersListQuery extends ListQuery<OrdersFilter, OrdersSortTerm> {
  after?: string
}
export type UsersListQuery = ListQuery<UsersFilter, UsersSortTerm>
export type JobsListQuery = ListQuery<JobsFilter, JobsSortTerm>
export type FilesListQuery = ListQuery<FilesFilter, FilesSortTerm>
export type ConversationListQuery = ListQuery<ConversationFilter, ConversationSortTerm>

export interface ItemParameters {
  id: string
}

export interface CustomersDistinctQuery {
  filter?: CustomersFilter
  filterId?: string
  field: CustomersDistinctField
}

/** The parameters of a presence read: the record, by its id (D37). */
export interface PresenceParameters {
  key: string
}

export interface CustomerFacetsParameters {
  filter?: CustomersFilter
  filterId?: string
}

/** The billing details: only the finance team may read them, so the demo always answers 403 forbidden. */
export interface Billing {
  plan: string
  seats: number
}

/** Every read: its socket target (D46), REST route and kind. */
export const reads = {
  customers: runtime.liveRead<CustomersListQuery, runtime.ListResponse<Customer>>({ target: 'customers', path: '/customers', pathParameters: [], list: true }),
  'customers.item': runtime.liveRead<ItemParameters, Customer>({ target: 'customers.item', path: '/customers/{id}', pathParameters: ['id'], list: false }),
  'customers.distinct': runtime.liveRead<CustomersDistinctQuery, runtime.DistinctValue[]>({ target: 'customers.distinct', path: '/customers/distinct', pathParameters: [], list: false }),
  'customers.presence': runtime.liveRead<PresenceParameters, runtime.ListResponse<runtime.PresenceItem>>({ target: 'customers.presence', path: '/customers/presence', pathParameters: [], list: true }),
  customerFacets: runtime.liveRead<CustomerFacetsParameters, CustomerFacets>({ target: 'customerFacets', path: '/customers/facets', pathParameters: [], list: false }),
  orders: runtime.liveRead<OrdersListQuery, runtime.ListResponse<Order>>({ target: 'orders', path: '/orders', pathParameters: [], list: true }),
  'orders.item': runtime.liveRead<ItemParameters, Order>({ target: 'orders.item', path: '/orders/{id}', pathParameters: ['id'], list: false }),
  users: runtime.liveRead<UsersListQuery, runtime.ListResponse<User>>({ target: 'users', path: '/users', pathParameters: [], list: true }),
  'users.item': runtime.liveRead<ItemParameters, User>({ target: 'users.item', path: '/users/{id}', pathParameters: ['id'], list: false }),
  jobs: runtime.liveRead<JobsListQuery, runtime.ListResponse<Job>>({ target: 'jobs', path: '/jobs', pathParameters: [], list: true }),
  'jobs.item': runtime.liveRead<ItemParameters, Job>({ target: 'jobs.item', path: '/jobs/{id}', pathParameters: ['id'], list: false }),
  files: runtime.liveRead<FilesListQuery, runtime.ListResponse<FileItem>>({ target: 'files', path: '/files', pathParameters: [], list: true }),
  conversation: runtime.liveRead<ConversationListQuery, runtime.ListResponse<Message>>({ target: 'conversation', path: '/conversation', pathParameters: [], list: true }),
  settings: runtime.liveRead<runtime.NoParameters, Settings>({ target: 'settings', path: '/settings', pathParameters: [], list: false }),
  billing: runtime.liveRead<runtime.NoParameters, Billing>({ target: 'billing', path: '/billing', pathParameters: [], list: false }),
} as const

/** The reads a socket can subscribe to: every read here is live. */
export const live = reads

export interface CreateCustomer {
  id?: string
  name: string
  email: string
  status?: CustomerStatus
  tags?: string[]
  country?: string
  revenue?: number
  owner?: string
}
export type UpdateCustomer = Partial<Omit<CreateCustomer, 'id'>>

export interface CreateOrder {
  id?: string
  customerId: string
  total: number
  currency?: Currency
  status?: OrderStatus
}

export type UpdateSettings = Partial<Omit<Settings, 'id'>>

export interface StartJob {
  kind: string
}

/** The dock mode a message is sent in (D25); background runs server side and sends none. */
export type AgentMode = 'chat' | 'guide' | 'drive'

export interface SendMessage {
  id?: string
  text: string
  mode?: AgentMode
}

/** Every mutation, for LiveConnection.call (the socket, with its optimistic effect, D36) and Client.call. */
export const calls = {
  createCustomer: runtime.mutation<runtime.NoParameters, CreateCustomer, Customer>({ name: 'createCustomer', method: 'POST', path: '/customers', pathParameters: [], body: true, content: true, effect: { kind: 'upserts', target: 'customers' }, clientID: 7 }),
  updateCustomer: runtime.mutation<ItemParameters, UpdateCustomer, Customer>({ name: 'updateCustomer', method: 'PATCH', path: '/customers/{id}', pathParameters: ['id'], body: true, content: true, effect: { kind: 'upserts', target: 'customers' } }),
  deleteCustomer: runtime.mutation<ItemParameters, undefined, void>({ name: 'deleteCustomer', method: 'DELETE', path: '/customers/{id}', pathParameters: ['id'], body: false, content: false, effect: { kind: 'removes', target: 'customers' } }),
  createOrder: runtime.mutation<runtime.NoParameters, CreateOrder, Order>({ name: 'createOrder', method: 'POST', path: '/orders', pathParameters: [], body: true, content: true, effect: { kind: 'upserts', target: 'orders' }, clientID: 7 }),
  updateSettings: runtime.mutation<runtime.NoParameters, UpdateSettings, Settings>({ name: 'updateSettings', method: 'PATCH', path: '/settings', pathParameters: [], body: true, content: true }),
  startJob: runtime.mutation<runtime.NoParameters, StartJob, Job>({ name: 'startJob', method: 'POST', path: '/jobs', pathParameters: [], body: true, content: true, effect: { kind: 'upserts', target: 'jobs' } }),
  sendMessage: runtime.mutation<runtime.NoParameters, SendMessage, Message>({ name: 'sendMessage', method: 'POST', path: '/conversation', pathParameters: [], body: true, content: true, effect: { kind: 'upserts', target: 'conversation' }, clientID: 7 }),
} as const

export type UploadContentType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'text/plain' | 'text/csv'

export interface UploadFileParameters {
  /** The file name of a raw body; a multipart body names its part. */
  name?: string
  customerId?: string
}

/** Every upload (D17), REST only. */
export const uploads = {
  uploadFile: runtime.upload<UploadFileParameters, FileItem, UploadContentType>({ name: 'uploadFile', path: '/files', pathParameters: [], contentTypes: ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv'] }),
} as const

export interface CustomersExportQuery {
  filter?: CustomersFilter
  filterId?: string
  sort?: readonly CustomersSortTerm[]
  format?: 'csv'
}

/** Every export (D35), REST only. */
export const downloads = {
  customers: runtime.exportTarget<CustomersExportQuery>({ target: 'customers', path: '/customers/export' }),
} as const

/** GET /api/v1/customers (socket target 'customers'). */
export function getCustomers(client: runtime.Client, parameters: CustomersListQuery = {}, options?: runtime.RequestOptions): Promise<runtime.ListResponse<Customer>> {
  return client.read(reads.customers, parameters, options)
}

/** GET /api/v1/customers/{id} (socket target 'customers.item'). */
export function getCustomersItem(client: runtime.Client, parameters: ItemParameters, options?: runtime.RequestOptions): Promise<Customer> {
  return client.read(reads['customers.item'], parameters, options)
}

/** GET /api/v1/customers/distinct (socket target 'customers.distinct'). */
export function getCustomersDistinct(client: runtime.Client, parameters: CustomersDistinctQuery, options?: runtime.RequestOptions): Promise<runtime.DistinctValue[]> {
  return client.read(reads['customers.distinct'], parameters, options)
}

/** GET /api/v1/customers/presence (socket target 'customers.presence'). */
export function getCustomersPresence(client: runtime.Client, parameters: PresenceParameters, options?: runtime.RequestOptions): Promise<runtime.ListResponse<runtime.PresenceItem>> {
  return client.read(reads['customers.presence'], parameters, options)
}

/** GET /api/v1/customers/facets (socket target 'customerFacets'). */
export function getCustomerFacets(client: runtime.Client, parameters: CustomerFacetsParameters = {}, options?: runtime.RequestOptions): Promise<CustomerFacets> {
  return client.read(reads.customerFacets, parameters, options)
}

/** GET /api/v1/orders (socket target 'orders'). */
export function getOrders(client: runtime.Client, parameters: OrdersListQuery = {}, options?: runtime.RequestOptions): Promise<runtime.ListResponse<Order>> {
  return client.read(reads.orders, parameters, options)
}

/** GET /api/v1/orders/{id} (socket target 'orders.item'). */
export function getOrdersItem(client: runtime.Client, parameters: ItemParameters, options?: runtime.RequestOptions): Promise<Order> {
  return client.read(reads['orders.item'], parameters, options)
}

/** GET /api/v1/users (socket target 'users'). */
export function getUsers(client: runtime.Client, parameters: UsersListQuery = {}, options?: runtime.RequestOptions): Promise<runtime.ListResponse<User>> {
  return client.read(reads.users, parameters, options)
}

/** GET /api/v1/users/{id} (socket target 'users.item'). */
export function getUsersItem(client: runtime.Client, parameters: ItemParameters, options?: runtime.RequestOptions): Promise<User> {
  return client.read(reads['users.item'], parameters, options)
}

/** GET /api/v1/jobs (socket target 'jobs'). */
export function getJobs(client: runtime.Client, parameters: JobsListQuery = {}, options?: runtime.RequestOptions): Promise<runtime.ListResponse<Job>> {
  return client.read(reads.jobs, parameters, options)
}

/** GET /api/v1/jobs/{id} (socket target 'jobs.item'). */
export function getJobsItem(client: runtime.Client, parameters: ItemParameters, options?: runtime.RequestOptions): Promise<Job> {
  return client.read(reads['jobs.item'], parameters, options)
}

/** GET /api/v1/files (socket target 'files'). */
export function getFiles(client: runtime.Client, parameters: FilesListQuery = {}, options?: runtime.RequestOptions): Promise<runtime.ListResponse<FileItem>> {
  return client.read(reads.files, parameters, options)
}

/** GET /api/v1/conversation (socket target 'conversation'). */
export function getConversation(client: runtime.Client, parameters: ConversationListQuery = {}, options?: runtime.RequestOptions): Promise<runtime.ListResponse<Message>> {
  return client.read(reads.conversation, parameters, options)
}

/** GET /api/v1/settings (socket target 'settings'). */
export function getSettings(client: runtime.Client, options?: runtime.RequestOptions): Promise<Settings> {
  return client.read(reads.settings, {}, options)
}

/** GET /api/v1/billing (socket target 'billing'): always 403 forbidden in the demo. */
export function getBilling(client: runtime.Client, options?: runtime.RequestOptions): Promise<Billing> {
  return client.read(reads.billing, {}, options)
}

/** POST /api/v1/customers, answering 201. */
export function createCustomer(client: runtime.Client, body: CreateCustomer, options?: runtime.CallOptions): Promise<Customer> {
  return client.call(calls.createCustomer, {}, body, options)
}

/** PATCH /api/v1/customers/{id}, answering 200. */
export function updateCustomer(client: runtime.Client, parameters: ItemParameters, body: UpdateCustomer, options?: runtime.CallOptions): Promise<Customer> {
  return client.call(calls.updateCustomer, parameters, body, options)
}

/** DELETE /api/v1/customers/{id}, answering 204. */
export function deleteCustomer(client: runtime.Client, parameters: ItemParameters, options?: runtime.CallOptions): Promise<void> {
  return client.call(calls.deleteCustomer, parameters, undefined, options)
}

/** POST /api/v1/orders, answering 201. */
export function createOrder(client: runtime.Client, body: CreateOrder, options?: runtime.CallOptions): Promise<Order> {
  return client.call(calls.createOrder, {}, body, options)
}

/** PATCH /api/v1/settings, answering 200. */
export function updateSettings(client: runtime.Client, body: UpdateSettings, options?: runtime.CallOptions): Promise<Settings> {
  return client.call(calls.updateSettings, {}, body, options)
}

/** POST /api/v1/jobs, answering 201; the job then runs and its progress arrives live (D29). */
export function startJob(client: runtime.Client, body: StartJob, options?: runtime.CallOptions): Promise<Job> {
  return client.call(calls.startJob, {}, body, options)
}

/** POST /api/v1/conversation, answering 201 (D26). */
export function sendMessage(client: runtime.Client, body: SendMessage, options?: runtime.CallOptions): Promise<Message> {
  return client.call(calls.sendMessage, {}, body, options)
}

/** POST /api/v1/files: a raw body, or multipart with the part "file"; at most 10 MiB, answering 201 once received. */
export function uploadFile(client: runtime.Client, parameters: UploadFileParameters, file: Blob, options?: runtime.UploadOptions<UploadContentType>): Promise<FileItem> {
  return client.upload(uploads.uploadFile, parameters, file, options)
}

/** The URL of GET /api/v1/customers/export, for a link the browser downloads (D35). */
export function customersExportURL(client: runtime.Client, parameters: CustomersExportQuery = {}): string {
  return client.exportURL(downloads.customers, parameters)
}

/** GET /api/v1/customers/export as a blob (D35). */
export function downloadCustomersExport(client: runtime.Client, parameters: CustomersExportQuery = {}, options?: runtime.RequestOptions): Promise<runtime.ExportDownload> {
  return client.download(downloads.customers, parameters, options)
}

/** POST /api/v1/filters: stores a filter (D13); an unnamed one is a registration the client remembers (D54). */
export function saveFilter<Target extends keyof FilterDocuments>(
  client: runtime.Client,
  request: runtime.FilterRequest<FilterDocuments[Target]> & { resource: Target },
  options?: runtime.RequestOptions,
): Promise<runtime.FilterItem<FilterDocuments[Target]>> {
  return client.saveFilter(request, options)
}

/** GET /api/v1/filters: the caller's named filters, of one target or of every one. */
export function listFilters(client: runtime.Client, resource?: keyof FilterDocuments, options?: runtime.RequestOptions): Promise<runtime.ListResponse<runtime.FilterItem>> {
  return client.listFilters(resource, options)
}

/** DELETE /api/v1/filters/{id}: removes one of the caller's filters. */
export function deleteFilter(client: runtime.Client, id: string, options?: runtime.RequestOptions): Promise<void> {
  return client.deleteFilter(id, options)
}
