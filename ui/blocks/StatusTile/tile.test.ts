import { describe, expect, test } from 'bun:test'
import { deltaTone } from './tile'

describe('deltaTone', () => {
  test('up is good, down is bad, zero is neutral', () => {
    expect(deltaTone(12.5)).toBe('success')
    expect(deltaTone(-3)).toBe('danger')
    expect(deltaTone(0)).toBe('neutral')
    expect(deltaTone(Number.NaN)).toBe('neutral')
  })

  test('invert: up is bad', () => {
    expect(deltaTone(4, true)).toBe('danger')
    expect(deltaTone(-4, true)).toBe('success')
    expect(deltaTone(0, true)).toBe('neutral')
  })
})
