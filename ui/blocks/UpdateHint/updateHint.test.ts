import { describe, expect, test } from 'bun:test'
import { createVersionCheck, outdated } from './updateHint'

describe('outdated', () => {
  test('a different known version, also older', () => {
    expect(outdated('2.4.1', '2.4.2')).toBe(true)
    expect(outdated('2.4.1', '2.4.0')).toBe(true)
    expect(outdated('2.4.1', 'v2.4.1')).toBe(false)
    expect(outdated('2.4.1', ' 2.4.1 ')).toBe(false)
  })

  test('an unversioned side or no answer never asks', () => {
    expect(outdated('development', '2.4.1')).toBe(false)
    expect(outdated('2.4.1', 'dev')).toBe(false)
    expect(outdated('2.4.1', undefined)).toBe(false)
    expect(outdated('2.4.1', '')).toBe(false)
  })
})

describe('createVersionCheck', () => {
  test('at most one start per gap, one call while in flight, failures answer undefined', async () => {
    let clock = 0
    let calls = 0
    let fail = false
    const check = createVersionCheck(async () => {
      calls += 1
      if (fail) throw new Error('offline')
      return '2.5.0'
    }, 1000, () => clock, () => () => undefined)

    const first = check.run()
    expect(check.run()).toBe(first)
    expect(await first).toBe('2.5.0')
    void check.run() // inside the gap: scheduled, not started
    expect(calls).toBe(1)
    check.stop()

    clock = 1000
    fail = true
    expect(await check.run()).toBeUndefined()
    expect(calls).toBe(2)

    clock = 2000
    fail = false
    expect(await check.run()).toBe('2.5.0')
    expect(calls).toBe(3)
  })

  test('a trigger inside the gap runs once at its end, not dropped; stop drops it', async () => {
    let clock = 0
    let calls = 0
    const scheduled: { run: () => void; ms: number }[] = []
    const check = createVersionCheck(async () => { calls += 1; return `2.5.${calls}` }, 15_000, () => clock, (run, ms) => {
      scheduled.push({ run, ms })
      return () => { scheduled.length = 0 }
    })
    expect(await check.run()).toBe('2.5.1')
    clock = 10_000 // a reconnect 10 s after the poll, the deploy 5 s ago
    const reconnect = check.run()
    expect(check.run()).toBe(reconnect)
    expect(scheduled).toEqual([{ run: expect.any(Function), ms: 5000 }])
    clock = 15_000
    scheduled[0]!.run()
    expect(await reconnect).toBe('2.5.2')
    expect(calls).toBe(2)

    clock = 20_000
    void check.run()
    check.stop()
    expect(scheduled).toEqual([])
    expect(calls).toBe(2)
  })
})
