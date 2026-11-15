import { describe, expect, test } from 'bun:test'
import type { LiveConnection } from '@/api/runtime'
import { live } from '@/fake/api'
import type { BoundAction } from '../../agent/registry'
import { addRecent, humanize, matchActions, moveActive, readRecent, recentKey, searchGroup, writeRecent } from './palette'

const action = (name: string, description: string, params?: Record<string, string>): BoundAction =>
  ({ name, description, page: 'demo.page', run: () => undefined, ...(params ? { params } : {}) })

test('humanize', () => {
  expect(humanize('createCustomer')).toBe('Create customer')
  expect(humanize('export_csv')).toBe('Export csv')
})

test('matchActions needs every word and no params', () => {
  const actions = [action('createCustomer', 'Opens the new customer form.'), action('exportCustomers', 'Downloads the list as CSV.'), action('deleteCustomer', 'Deletes one.', { id: 'the customer' })]
  expect(matchActions(actions, '').map((found) => found.name)).toEqual(['createCustomer', 'exportCustomers'])
  expect(matchActions(actions, 'cust csv').map((found) => found.name)).toEqual(['exportCustomers'])
  expect(matchActions(actions, 'delete')).toEqual([])
})

describe('recent picks', () => {
  test('newest first, deduplicated per group, capped', () => {
    const one = { group: 'tasks', id: '1', label: 'One' }
    const list = addRecent(addRecent([], one), { group: 'customers', id: '1', label: 'Uno' })
    expect(addRecent(list, one).map((pick) => pick.group)).toEqual(['tasks', 'customers'])
    expect(addRecent(list, { group: 'x', id: 'y', label: 'z' }, 2)).toHaveLength(2)
  })
  test('unreadable storage counts as none', () => {
    expect(readRecent({ getItem: () => '{bad' }, 'k')).toEqual([])
    expect(readRecent({ getItem: () => '[{"group":"a","id":"1","label":"x"},{"id":2}]' }, 'k')).toEqual([{ group: 'a', id: '1', label: 'x' }])
    expect(readRecent(undefined, 'k')).toEqual([])
  })
  test('a refusing storage keeps the picks in memory, keys are per identity', () => {
    expect(() => writeRecent({ setItem: () => { throw new Error('QuotaExceededError') } }, 'k', [])).not.toThrow()
    expect(recentKey('ui.palette.recent', 'user:1')).toBe('ui.palette.recent:user:1')
    expect(recentKey('', 'user:1')).toBe('')
  })
})

test('moveActive wraps and starts from none', () => {
  expect(moveActive(-1, 3, 'ArrowDown')).toBe(0)
  expect(moveActive(-1, 3, 'ArrowUp')).toBe(2)
  expect(moveActive(2, 3, 'ArrowDown')).toBe(0)
  expect(moveActive(0, 3, 'ArrowUp')).toBe(2)
  expect(moveActive(1, 3, 'End')).toBe(2)
  expect(moveActive(1, 0, 'ArrowDown')).toBe(-1)
  expect(moveActive(1, 3, 'a')).toBeUndefined()
})

test('searchGroup sends the text as search beside the where', async () => {
  const sent: unknown[] = []
  const connection = { query: async (_target: unknown, parameters: unknown) => (sent.push(parameters), { limit: 5, offset: 0, total: 1, items: [{ id: 't1', title: 'Fix', status: 'todo' }] }) } as unknown as LiveConnection
  const group = searchGroup({ key: 'tasks', label: 'Tasks', target: live.tasks, where: { field: 'status', op: 'ne', value: 'done' }, result: (task) => ({ id: task.id, label: task.title, hint: task.status }) })
  expect(await group.search(connection, 'fix', new AbortController().signal)).toEqual([{ id: 't1', label: 'Fix', hint: 'todo' }])
  expect(sent).toEqual([{ filter: { where: { field: 'status', op: 'ne', value: 'done' }, search: 'fix' }, limit: 5 }])
})
