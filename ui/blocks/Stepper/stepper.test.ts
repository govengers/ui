import { describe, expect, test } from 'bun:test'
import { canJump, stepState } from './stepper'

describe('stepper', () => {
  test('stepState: done below the furthest step reached, current wins', () => {
    expect(stepState(0, 1, 1)).toBe('done')
    expect(stepState(1, 1, 1)).toBe('current')
    expect(stepState(2, 1, 1)).toBe('upcoming')
    // went back from step 3 to step 1: step 2 was left with Continue, step 3 was not
    expect(stepState(1, 0, 2)).toBe('done')
    expect(stepState(2, 0, 2)).toBe('upcoming')
  })

  test('canJump: back always, never to itself', () => {
    expect(canJump(0, 2, 2, false, true)).toBe(true)
    expect(canJump(0, 2, 2, true, false)).toBe(true)
    expect(canJump(2, 2, 2, false, true)).toBe(false)
    expect(canJump(-1, 2, 2, false, true)).toBe(false)
  })

  test('canJump: forward only to a reached step, not linear, current step valid', () => {
    expect(canJump(2, 0, 2, false, true)).toBe(true)
    expect(canJump(3, 0, 2, false, true)).toBe(false)
    expect(canJump(2, 0, 2, true, true)).toBe(false)
    expect(canJump(2, 0, 2, false, false)).toBe(false)
  })
})
