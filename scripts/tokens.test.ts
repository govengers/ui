// The touch floor of D84, checked on the text of ui/tokens.css: the cascade for a fine and a coarse
// pointer in both densities, with max() evaluated at 1rem = 16px. No browser needed.
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const css = readFileSync(join(root, 'ui', 'tokens.css'), 'utf8')

type Pointer = 'fine' | 'coarse'
type Density = 'comfortable' | 'compact'
interface Rule { selector: string; media: string | null; order: number; declarations: [string, string][] }

/** The rules of a stylesheet with the @media they sit in; nested blocks are walked by brace depth. */
function rules(source: string): Rule[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: Rule[] = []
  const preludes: string[] = []
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '{') {
      preludes.push(text.slice(start, index).trim())
      start = index + 1
    } else if (text[index] === '}') {
      const selector = preludes.pop()!
      const media = preludes.find(prelude => prelude.startsWith('@media'))?.slice(6).trim() ?? null
      const declarations = text.slice(start, index).split(';').map(part => /^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/s.exec(part)).filter(match => match !== null).map(match => [match[1]!, match[2]!] as [string, string])
      if (!selector.startsWith('@')) out.push({ selector, media, order: out.length, declarations })
      start = index + 1
    }
  }
  return out
}

/** The custom properties on <html> for one pointer and density: specificity first, then source order. */
function cascade(pointer: Pointer, density: Density): Map<string, string> {
  const compact = ':root[data-density="compact"]'
  const applies = (rule: Rule) =>
    (rule.media === null || (rule.media === '(pointer: coarse)' && pointer === 'coarse')) &&
    (rule.selector === ':root' || (rule.selector === compact && density === 'compact'))
  const specificity = (rule: Rule) => (rule.selector === compact ? 1 : 0)
  const out = new Map<string, string>()
  for (const rule of rules(css).filter(applies).sort((a, b) => specificity(a) - specificity(b) || a.order - b.order)) {
    for (const [name, value] of rule.declarations) out.set(name, value)
  }
  return out
}

/** A length in px: px, rem, var() and max() of those. */
function px(value: string, tokens: Map<string, string>): number {
  const reference = /^var\((--[\w-]+)\)$/.exec(value)
  if (reference) {
    const resolved = tokens.get(reference[1]!)
    if (resolved === undefined) throw new Error(`${reference[1]}: not declared`)
    return px(resolved, tokens)
  }
  const max = /^max\((.+)\)$/.exec(value)
  if (max) return Math.max(...max[1]!.split(/,(?![^(]*\))/).map(argument => px(argument.trim(), tokens)))
  const length = /^(-?\d*\.?\d+)(px|rem)$/.exec(value)
  if (length) return Number(length[1]) * (length[2] === 'rem' ? 16 : 1)
  throw new Error(`cannot evaluate "${value}"`)
}

const heights = ['--ui-control-h', '--ui-control-h-sm', '--ui-control-h-lg']
const fineHeights: Record<Density, number[]> = { comfortable: [40, 32, 48], compact: [32, 28, 40] }

describe('tokens.css touch floor (D84)', () => {
  for (const density of ['comfortable', 'compact'] as Density[]) {
    test(`${density}, fine pointer: the heights of D38 and no text floor`, () => {
      const tokens = cascade('fine', density)
      expect(heights.map(name => px(tokens.get(name)!, tokens))).toEqual(fineHeights[density])
      expect(px(tokens.get('--ui-field-text-min')!, tokens)).toBe(0)
    })

    test(`${density}, coarse pointer: every height reaches 44px and field text 16px`, () => {
      const tokens = cascade('coarse', density)
      for (const name of heights) expect(px(tokens.get(name)!, tokens)).toBeGreaterThanOrEqual(44)
      expect(px(tokens.get('--ui-field-text-min')!, tokens)).toBeGreaterThanOrEqual(16)
    })

    test(`${density}, coarse pointer: each max() starts with the fine value of the density`, () => {
      const coarse = cascade('coarse', density)
      const fine = cascade('fine', density)
      for (const [index, name] of heights.entries()) {
        const first = /^max\(([^,]+),/.exec(coarse.get(name)!)?.[1]
        expect(first, name).toBeDefined()
        expect(px(first!.trim(), fine)).toBe(fineHeights[density][index]!)
      }
    })
  }

  test('--ui-duration-slow is not declared (D86)', () => {
    expect(cascade('fine', 'comfortable').has('--ui-duration-slow')).toBe(false)
    expect(css).not.toContain('--ui-duration-slow')
  })

  test.each(['ui/Input/Input.vue', 'ui/Select/Select.vue', 'ui/Textarea/Textarea.vue'])('%s floors its text at --ui-field-text-min', file => {
    expect(readFileSync(join(root, file), 'utf8')).toContain('max(var(--ui-field-text-min)')
  })
})
