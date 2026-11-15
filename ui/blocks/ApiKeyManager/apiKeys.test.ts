import { describe, expect, test } from 'bun:test'
import { expiresAtFor, keyState, newestFirst } from './apiKeys'

const now = Date.parse('2026-11-16T12:00:00Z')
const inDays = (days: number): string => new Date(now + days * 86_400_000).toISOString()

describe('apiKeys', () => {
  test.each([
    [null, 'active'],
    [inDays(30), 'active'],
    [inDays(7), 'expiring'],
    [inDays(0.5), 'expiring'],
    [inDays(0), 'expired'],
    [inDays(-1), 'expired'],
  ])('keyState(%p) is %p', (expiresAt, state) => {
    expect(keyState({ expiresAt }, now)).toBe(state as ReturnType<typeof keyState>)
  })

  test('expiresAtFor', () => {
    expect(expiresAtFor(0, now)).toBeNull()
    expect(expiresAtFor(30, now)).toBe('2026-12-16T12:00:00.000Z')
  })

  test('newestFirst keeps the input', () => {
    const keys = [{ createdAt: '2026-01-01T00:00:00Z' }, { createdAt: '2026-03-01T00:00:00Z' }]
    expect(newestFirst(keys).map((key) => key.createdAt)).toEqual(['2026-03-01T00:00:00Z', '2026-01-01T00:00:00Z'])
    expect(keys[0]?.createdAt).toBe('2026-01-01T00:00:00Z')
  })
})
