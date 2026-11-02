import { describe, expect, test } from 'bun:test'
import { normalize, readStored, writeStored, type ColumnOption, type ColumnStorage } from './columns'

const columns: ColumnOption[] = [{ key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email' }, { key: 'status', label: 'Status' }]

function memory(): ColumnStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) }, removeItem: (key) => { data.delete(key) } }
}

describe('normalize', () => {
  test('column order, required in, unknown out', () => {
    expect(normalize(['status', 'gone', 'email'], columns)).toEqual(['name', 'email', 'status'])
    expect(normalize([], columns)).toEqual(['name'])
  })
})

describe('storage', () => {
  test('round-trips, normalizes on read, forgets on null', () => {
    const storage = memory()
    expect(readStored(storage, 'cols', columns)).toBeUndefined()
    writeStored(storage, 'cols', ['status'])
    expect(readStored(storage, 'cols', columns)).toEqual(['name', 'status'])
    writeStored(storage, 'cols', null)
    expect(storage.data.size).toBe(0)
  })

  test('garbage and a throwing storage are no choice', () => {
    const storage = memory()
    storage.data.set('cols', '{"not":"a list"}')
    expect(readStored(storage, 'cols', columns)).toBeUndefined()
    storage.data.set('cols', 'not json')
    expect(readStored(storage, 'cols', columns)).toBeUndefined()
    const broken: ColumnStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('full') }, removeItem: () => {} }
    expect(readStored(broken, 'cols', columns)).toBeUndefined()
    expect(() => writeStored(broken, 'cols', ['name'])).not.toThrow()
    expect(readStored(undefined, 'cols', columns)).toBeUndefined()
  })
})
