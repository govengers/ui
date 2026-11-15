import { describe, expect, test } from 'bun:test'
import { readSeen, resetWhatsNew, writeSeen } from './whatsNew'

function memory() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  }
}

describe('whatsNew memory', () => {
  test('stores and forgets the line', () => {
    const storage = memory()
    expect(readSeen('notes', storage)).toBeUndefined()
    writeSeen('2.4', 'notes', storage)
    expect(readSeen('notes', storage)).toBe('2.4')
    resetWhatsNew('notes', storage)
    expect(readSeen('notes', storage)).toBeUndefined()
  })

  test('a blocked storage reads as nothing stored and never throws', () => {
    const blocked = { ...memory(), getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('full') } }
    expect(readSeen('notes', blocked)).toBeUndefined()
    expect(() => writeSeen('2.4', 'notes', blocked)).not.toThrow()
  })
})
