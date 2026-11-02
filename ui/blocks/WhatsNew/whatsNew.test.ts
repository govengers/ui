import { describe, expect, test } from 'bun:test'
import { markSeen, resetWhatsNew, unseen } from './whatsNew'

function memory() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  }
}

describe('whatsNew', () => {
  test('unseen until closed, again for the next version', () => {
    const storage = memory()
    expect(unseen('2.4.0', 'notes', storage)).toBe(true)
    markSeen('2.4.0', 'notes', storage)
    expect(unseen('2.4.0', 'notes', storage)).toBe(false)
    expect(unseen('2.5.0', 'notes', storage)).toBe(true)
  })

  test('reset forgets the version', () => {
    const storage = memory()
    markSeen('2.4.0', 'notes', storage)
    resetWhatsNew('notes', storage)
    expect(unseen('2.4.0', 'notes', storage)).toBe(true)
  })

  test('a blocked storage counts as seen', () => {
    const blocked = { ...memory(), getItem: () => { throw new Error('blocked') } }
    expect(unseen('2.4.0', 'notes', blocked)).toBe(false)
  })
})
