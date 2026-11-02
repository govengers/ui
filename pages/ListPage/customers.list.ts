// The per-entity part of the customers list (D32): columns, facets, tabs, row and bulk actions.
// The ONE file a project edits per entity; ListPage.vue composes the blocks around it. Labels are
// keys of this folder's messages.ts, translated through the `t` the page hands in.
import type { RouteLocationRaw } from 'vue-router'
// In a project: import type { Customer, CustomerStatus } from '@/api/api'
import type { Customer, CustomerStatus } from '@/fake/api'
import type { ColumnOption } from '../../ui/blocks/ColumnsPicker/columns'
import type { FacetDefinition } from '../../ui/blocks/FacetFilter/facets'
import type { IconName } from '../../ui/Icon/icons'
import type { MenuItem } from '../../ui/Menu/Menu.vue'
import type { TableColumn, TableKey, TableSort } from '../../ui/Table/Table.vue'

export type Translate = (key: string) => string

/** The detail route of one row: the router names routes like their page (`customers.detail`). */
export const detailRoute = (id: string): RouteLocationRaw => ({ name: 'customers.detail', params: { id } })

export const statuses: readonly CustomerStatus[] = ['active', 'onHold', 'churned']
export const statusKeys: Record<CustomerStatus, string> = {
  active: 'customers.list.status.active',
  onHold: 'customers.list.status.onHold',
  churned: 'customers.list.status.churned',
}
export const statusTone: Record<CustomerStatus, 'success' | 'warning' | 'neutral'> = { active: 'success', onHold: 'warning', churned: 'neutral' }

/** The application's tag vocabulary: a list field gets no distinct read, so its values are given. */
export const tags = ['enterprise', 'smb', 'partner', 'priority', 'trial', 'reseller', 'public-sector'] as const

export type CustomerColumn = TableColumn & ColumnOption

export function columns(t: Translate): CustomerColumn[] {
  return [
    { key: 'name', label: t('customers.list.fields.name'), sortable: true, required: true },
    { key: 'email', label: t('customers.list.fields.email'), sortable: true, hideOnPhone: true },
    { key: 'status', label: t('customers.list.fields.status'), sortable: true, width: '9rem' },
    { key: 'country', label: t('customers.list.fields.country'), sortable: true, hideOnPhone: true },
    { key: 'owner', label: t('customers.list.fields.owner'), sortable: true, hideOnPhone: true },
    { key: 'revenue', label: t('customers.list.fields.revenue'), sortable: true, align: 'end' },
    { key: 'createdAt', label: t('customers.list.fields.createdAt'), sortable: true, hideOnPhone: true },
  ]
}

/** What the table shows until the user picks other columns (ColumnsPicker remembers the choice). */
export const defaultColumns = ['name', 'status', 'country', 'revenue', 'createdAt']
export const defaultSort: TableSort = { key: 'createdAt', direction: 'desc' }

/** Names for ids and codes: the page builds them from its reads and the locale. */
export interface Names {
  owner: (id: string) => string
  country: (code: string) => string
}

/** The facets (D31). No facet may be keyed search, sort, page, item, t or tab: those URL keys are taken. */
export function facets(t: Translate, names: Names): FacetDefinition[] {
  return [
    { key: 'status', label: t('customers.list.fields.status'), short: true, values: statuses.map(value => ({ value, label: t(statusKeys[value]) })) },
    { key: 'country', label: t('customers.list.fields.country'), labelOf: names.country },
    { key: 'owner', label: t('customers.list.fields.owner'), labelOf: names.owner },
    { key: 'tags', label: t('customers.list.fields.tags'), array: true, values: tags.map(tag => ({ value: tag, label: tag })) },
  ]
}

export interface ListTab {
  value: string
  label: string
  /** The tab's fixed clause on status; none is every row. */
  status?: CustomerStatus | undefined
}

/** The counted views (D32): each a fixed clause, never a chip; `?tab=<value>` in the URL. */
export function tabs(t: Translate): ListTab[] {
  return [{ value: 'all', label: t('customers.list.tabs.all') }, ...statuses.map(status => ({ value: status, label: t(statusKeys[status]), status }))]
}

export interface RowHandlers {
  open: (row: Customer) => void
  remove: (row: Customer) => void
}

/** The row menu: items carry the livewire call name as `action` (D23). */
export function rowActions(t: Translate, on: RowHandlers): (row: Customer) => MenuItem[] {
  return row => [
    { label: t('customers.list.actions.open'), icon: 'eye', run: () => on.open(row) },
    { label: t('customers.list.actions.edit'), icon: 'pencil', to: detailRoute(row.id) },
    { label: '-' },
    { label: t('customers.list.actions.delete'), icon: 'trash', danger: true, action: 'deleteCustomer', run: () => on.remove(row) },
  ]
}

export interface BulkAction {
  label: string
  icon: IconName
  /** The livewire call name of a mutating action (D23). */
  action?: string | undefined
  danger?: boolean | undefined
  run: (keys: TableKey[]) => void
}

export function bulkActions(t: Translate, on: { export: (keys: TableKey[]) => void; remove: (keys: TableKey[]) => void }): BulkAction[] {
  return [
    { label: t('customers.list.actions.exportSelected'), icon: 'download', run: on.export },
    { label: t('customers.list.actions.deleteSelected'), icon: 'trash', action: 'deleteCustomer', danger: true, run: on.remove },
  ]
}
