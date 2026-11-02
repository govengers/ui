import { describe, expect, test } from 'bun:test'
import { placeBubble } from './spotlight'

const viewport = { width: 1000, height: 800 }
const bubble = { width: 300, height: 120 }

describe('placeBubble', () => {
  test('below the target, on its left edge', () => {
    expect(placeBubble({ top: 100, left: 400, width: 200, height: 40 }, bubble, viewport)).toEqual({ top: 152, left: 400 })
  })

  test('above when there is no room below', () => {
    expect(placeBubble({ top: 700, left: 400, width: 200, height: 40 }, bubble, viewport)).toEqual({ top: 568, left: 400 })
  })

  test('kept inside the viewport at the edges', () => {
    expect(placeBubble({ top: 100, left: 4, width: 40, height: 40 }, bubble, viewport).left).toBe(12)
    expect(placeBubble({ top: 100, left: 980, width: 20, height: 40 }, bubble, viewport).left).toBe(688)
  })

  test('a target taller than the viewport keeps the bubble on screen', () => {
    expect(placeBubble({ top: -200, left: 0, width: 1000, height: 1400 }, bubble, viewport).top).toBe(12)
  })

  test('centred without a target', () => {
    expect(placeBubble(null, bubble, viewport)).toEqual({ top: 340, left: 350 })
  })
})
