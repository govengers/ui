import { describe, expect, test } from 'bun:test'
import { contrast, readTokens, resolve } from './contrast'

describe('contrast', () => {
  test('black on white is 21, white on white is 1', () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0)
    expect(contrast([255, 255, 255], [255, 255, 255])).toBe(1)
  })

  test('resolves var() through light-dark() per scheme', () => {
    const tokens = readTokens(`
      :root {
        --ui-gray-0: #ffffff;
        --ui-gray-900: #111111;
        --ui-bg: light-dark(var(--ui-gray-0), var(--ui-gray-900));
      }
    `)
    expect(resolve(tokens, '--ui-bg', 'light')).toEqual([255, 255, 255])
    expect(resolve(tokens, '--ui-bg', 'dark')).toEqual([17, 17, 17])
  })

  test('a later declaration wins, as in the cascade', () => {
    const tokens = readTokens(':root { --ui-bg: #000000; } :root { --ui-bg: #ffffff; }')
    expect(resolve(tokens, '--ui-bg', 'light')).toEqual([255, 255, 255])
  })

  test('refuses what it cannot measure', () => {
    const tokens = readTokens(':root { --ui-scrim: rgb(0 0 0 / 0.5); }')
    expect(() => resolve(tokens, '--ui-scrim', 'light')).toThrow('cannot measure')
    expect(() => resolve(tokens, '--ui-nope', 'light')).toThrow('not declared')
  })
})
