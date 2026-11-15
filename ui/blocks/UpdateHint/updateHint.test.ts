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
  test('at most once per gap, one call while in flight, failures answer undefined', async () => {
    let clock = 0
    let calls = 0
    let fail = false
    const check = createVersionCheck(async () => {
      calls += 1
      if (fail) throw new Error('offline')
      return '2.5.0'
    }, 1000, () => clock)

    const first = check.run()
    expect(check.run()).toBe(first)
    expect(await first).toBe('2.5.0')
    expect(await check.run()).toBeUndefined()
    expect(calls).toBe(1)

    clock = 1000
    fail = true
    expect(await check.run()).toBeUndefined()
    expect(calls).toBe(2)

    clock = 2000
    fail = false
    expect(await check.run()).toBe('2.5.0')
    expect(calls).toBe(3)
  })
})
