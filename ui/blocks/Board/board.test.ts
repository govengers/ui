import { describe, expect, test } from 'bun:test'
import { entries, group, indexAt, place, rankBetween, rankStep, sameSpot, step, type Lift } from './board'

interface Task { id: string; status: string; rank: number }
const task = (id: string, status: string, rank: number): Task => ({ id, status, rank })
const columns = [{ key: 'todo', label: 'To do' }, { key: 'doing', label: 'Doing' }, { key: 'done', label: 'Done' }]
const rankOf = (item: Task) => item.rank

describe('group', () => {
  test('sorts by rank, ties by id, drops unknown columns, keeps empty ones', () => {
    const grouped = group([task('b', 'todo', 2), task('a', 'todo', 2), task('c', 'todo', 1), task('x', 'archived', 0)], columns, (item) => item.status, rankOf)
    expect(grouped.get('todo')?.map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(grouped.get('done')).toEqual([])
    expect([...grouped.keys()]).toEqual(['todo', 'doing', 'done'])
  })
})

describe('rankBetween and place', () => {
  test('ranks between, above, below and alone', () => {
    expect(rankBetween(undefined, undefined)).toBe(rankStep)
    expect(rankBetween(10, undefined)).toBe(10 + rankStep)
    expect(rankBetween(undefined, 10)).toBe(10 - rankStep)
    expect(rankBetween(1, 2)).toBe(1.5)
  })

  const todo = [task('a', 'todo', 1), task('b', 'todo', 2), task('c', 'todo', 3)]
  test('a move down in its own column skips itself', () => {
    expect(place(todo, 'a', { column: 'todo', index: 1 }, rankOf)).toEqual({ column: 'todo', index: 1, before: 'b', after: 'c', rank: 2.5 })
  })
  test('to the end and to the top', () => {
    expect(place(todo, 'x', { column: 'todo', index: 3 }, rankOf)).toMatchObject({ before: 'c', after: undefined, rank: 3 + rankStep })
    expect(place(todo, 'x', { column: 'todo', index: 0 }, rankOf)).toMatchObject({ before: undefined, after: 'a', rank: 1 - rankStep })
  })
  test('clamps an index past the end', () => {
    expect(place(todo, 'a', { column: 'todo', index: 9 }, rankOf).index).toBe(2)
  })
})

describe('step', () => {
  const counts = new Map([['todo', 2], ['doing', 0], ['done', 5]])
  const lift = (column: string, index: number): Lift => ({ id: 'a', from: { column: 'todo', index: 0 }, to: { column, index }, mode: 'keyboard' })
  const keys = ['todo', 'doing', 'done']
  test('up and down stay in the column and clamp', () => {
    expect(step(keys, counts, lift('todo', 0), 'ArrowUp')).toEqual({ column: 'todo', index: 0 })
    expect(step(keys, counts, lift('todo', 2), 'ArrowDown')).toEqual({ column: 'todo', index: 2 })
    expect(step(keys, counts, lift('done', 1), 'End')).toEqual({ column: 'done', index: 5 })
  })
  test('left and right change column and clamp the index', () => {
    expect(step(keys, counts, lift('todo', 2), 'ArrowRight')).toEqual({ column: 'doing', index: 0 })
    expect(step(keys, counts, lift('todo', 1), 'ArrowLeft')).toEqual({ column: 'todo', index: 1 })
  })
  test('other keys do not move', () => {
    expect(step(keys, counts, lift('todo', 0), 'x')).toBeUndefined()
    expect(sameSpot({ column: 'a', index: 1 }, { column: 'a', index: 1 })).toBe(true)
  })
})

test('indexAt counts the middles above the pointer', () => {
  expect(indexAt([10, 30, 50], 5)).toBe(0)
  expect(indexAt([10, 30, 50], 31)).toBe(2)
  expect(indexAt([10, 30, 50], 99)).toBe(3)
  expect(indexAt([], 99)).toBe(0)
})

describe('entries', () => {
  const cards = [task('a', 'todo', 1), task('b', 'todo', 2), task('c', 'todo', 3)]
  const shape = (list: ReturnType<typeof entries<Task>>) => list.map((entry) => (entry.kind === 'placeholder' ? '_' : entry.origin ? `(${entry.item.id})` : entry.item.id)).join('')
  const lift = (mode: Lift['mode'], column: string, index: number): Lift => ({ id: 'b', from: { column: 'todo', index: 1 }, to: { column, index }, mode })

  test('no lift renders the cards', () => {
    expect(shape(entries(cards, 'todo', null, undefined))).toBe('abc')
  })
  test('keyboard moves the card itself', () => {
    expect(shape(entries(cards, 'todo', lift('keyboard', 'todo', 2), cards[1]))).toBe('acb')
    expect(shape(entries(cards, 'todo', lift('keyboard', 'doing', 0), cards[1]))).toBe('ac')
    expect(shape(entries([], 'doing', lift('keyboard', 'doing', 0), cards[1]))).toBe('b')
  })
  test('pointer keeps the origin in place and adds the placeholder', () => {
    expect(shape(entries(cards, 'todo', lift('pointer', 'todo', 2), cards[1]))).toBe('a(b)c_')
    expect(shape(entries(cards, 'todo', lift('pointer', 'todo', 0), cards[1]))).toBe('_a(b)c')
    expect(shape(entries(cards, 'todo', lift('pointer', 'doing', 0), cards[1]))).toBe('a(b)c')
    expect(shape(entries([], 'doing', lift('pointer', 'doing', 0), cards[1]))).toBe('_')
  })
})
