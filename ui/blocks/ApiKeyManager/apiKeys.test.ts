import { describe, expect, test } from 'bun:test'
import { computed, effectScope, nextTick, shallowRef } from 'vue'
import type { LiveConnection, LiveStatus } from '@/api/runtime'
import { attempts, expiresAtFor, forgetWhenGone, keyState, newestFirst } from './apiKeys'

/** The status half of a LiveConnection: `onStatus` calls with the status now and on every change. */
function fakeConnection(): { connection: LiveConnection; end(): void } {
  let status: LiveStatus = 'open'
  const listeners = new Set<(status: LiveStatus) => void>()
  const connection = {
    get status() { return status },
    onStatus: (listener: (status: LiveStatus) => void) => { listeners.add(listener); listener(status); return () => listeners.delete(listener) },
  } as unknown as LiveConnection
  return { connection, end: () => { status = 'ended'; for (const listener of listeners) listener(status) } }
}

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

  test('attempts: a create answering after forget is stale', () => {
    const tries = attempts()
    const early = tries.begin()
    expect(early()).toBe(true)
    tries.forget() // the dialog closed or the identity changed while the create ran
    expect(early()).toBe(false)
    expect(tries.begin()()).toBe(true)
  })

  test('forgetWhenGone: another connection and the end of the current one forget', async () => {
    const first = fakeConnection()
    const current = shallowRef(first.connection)
    let forgotten = 0
    const scope = effectScope()
    scope.run(() => forgetWhenGone(computed(() => current.value), () => { forgotten += 1 }))
    await nextTick()
    expect(forgotten).toBe(0)
    first.end() // a 4401 while /auth/me cannot be read: the ended pair stays the pair
    await nextTick()
    expect(forgotten).toBe(1)
    current.value = fakeConnection().connection // the next identity's pair
    await nextTick()
    expect(forgotten).toBe(2)
    scope.stop()
  })
})
