// Measures the contrast of every declared text and surface pair in tokens.css and each preset,
// light and dark (D16). A claim in a comment is not a measurement; this is.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

type Scheme = 'light' | 'dark'

interface Pair {
  fg: string
  bg: string
  /** 4.5 for text, 3 for non-text (borders, focus rings, icons). */
  min: number
}

/** Every pair a component may paint. Add a pair when a component paints a new combination. */
export const pairs: Pair[] = [
  { fg: '--ui-ink', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-ink', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-ink', bg: '--ui-surface-2', min: 4.5 },
  { fg: '--ui-ink', bg: '--ui-sunk', min: 4.5 },
  { fg: '--ui-ink-2', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-ink-2', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-muted', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-muted', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-muted', bg: '--ui-surface-2', min: 4.5 },
  { fg: '--ui-placeholder', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-accent', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-accent', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-on-accent', bg: '--ui-accent', min: 4.5 },
  { fg: '--ui-on-accent', bg: '--ui-accent-hover', min: 4.5 },
  { fg: '--ui-on-accent-soft', bg: '--ui-accent-soft', min: 4.5 },
  { fg: '--ui-danger', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-danger', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-on-danger', bg: '--ui-danger', min: 4.5 },
  { fg: '--ui-on-danger', bg: '--ui-danger-hover', min: 4.5 },
  { fg: '--ui-on-danger-soft', bg: '--ui-danger-soft', min: 4.5 },
  { fg: '--ui-on-success-soft', bg: '--ui-success-soft', min: 4.5 },
  { fg: '--ui-on-warning-soft', bg: '--ui-warning-soft', min: 4.5 },
  { fg: '--ui-on-chrome', bg: '--ui-chrome', min: 4.5 },
  { fg: '--ui-success', bg: '--ui-surface', min: 3 },
  { fg: '--ui-warning', bg: '--ui-surface', min: 3 },
  { fg: '--ui-border-strong', bg: '--ui-surface', min: 3 },
  { fg: '--ui-focus', bg: '--ui-bg', min: 3 },
  { fg: '--ui-focus', bg: '--ui-surface', min: 3 },
]

/** Reads `--name: value;` declarations of a stylesheet, later ones winning. */
export function readTokens(css: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const match of css.matchAll(/(--ui-[\w-]+)\s*:\s*([^;]+);/g)) out.set(match[1]!, match[2]!.trim())
  return out
}

/** Resolves a token to an sRGB triple for one scheme, following var() and light-dark(). */
export function resolve(tokens: Map<string, string>, name: string, scheme: Scheme, depth = 0): [number, number, number] {
  if (depth > 10) throw new Error(`${name}: var() loop`)
  const value = tokens.get(name)
  if (value === undefined) throw new Error(`${name}: not declared`)
  return parseColor(tokens, value, scheme, depth)
}

function parseColor(tokens: Map<string, string>, value: string, scheme: Scheme, depth: number): [number, number, number] {
  const lightDark = /^light-dark\((.+)\)$/.exec(value)
  if (lightDark) {
    const [light, dark] = splitTop(lightDark[1]!)
    return parseColor(tokens, (scheme === 'light' ? light : dark)!.trim(), scheme, depth)
  }
  const reference = /^var\((--[\w-]+)\)$/.exec(value)
  if (reference) return resolve(tokens, reference[1]!, scheme, depth + 1)
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const n = parseInt(hex[1]!, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  throw new Error(`cannot measure "${value}": use a hex colour or a var() of one`)
}

/** Splits "a, b" at the top-level comma (inside nested parentheses commas are kept). */
function splitTop(text: string): [string, string] {
  let level = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '(') level += 1
    else if (char === ')') level -= 1
    else if (char === ',' && level === 0) return [text.slice(0, index), text.slice(index + 1)]
  }
  throw new Error(`light-dark needs two values: ${text}`)
}

export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export interface Measurement { preset: string; scheme: Scheme; fg: string; bg: string; ratio: number; min: number; ok: boolean }

export function measure(root: string): Measurement[] {
  const base = readFileSync(join(root, 'ui', 'tokens.css'), 'utf8')
  const presetsDir = join(root, 'ui', 'presets')
  const out: Measurement[] = []
  for (const file of readdirSync(presetsDir).filter(name => name.endsWith('.css')).sort()) {
    const tokens = readTokens(base + '\n' + readFileSync(join(presetsDir, file), 'utf8'))
    for (const scheme of ['light', 'dark'] as Scheme[]) {
      for (const pair of pairs) {
        const ratio = contrast(resolve(tokens, pair.fg, scheme), resolve(tokens, pair.bg, scheme))
        out.push({ preset: file.replace(/\.css$/, ''), scheme, fg: pair.fg, bg: pair.bg, ratio, min: pair.min, ok: ratio >= pair.min })
      }
    }
  }
  return out
}

if (import.meta.main) {
  const results = measure(join(import.meta.dir, '..'))
  const failures = results.filter(result => !result.ok)
  for (const result of results) {
    if (!result.ok || process.argv.includes('--all')) {
      console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${result.preset.padEnd(8)} ${result.scheme.padEnd(5)} ${result.fg.padEnd(22)} on ${result.bg.padEnd(18)} ${result.ratio.toFixed(2)} (min ${result.min})`)
    }
  }
  console.log(`${results.length - failures.length}/${results.length} pairs pass`)
  if (failures.length > 0) process.exit(1)
}
