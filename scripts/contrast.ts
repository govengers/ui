// Measures the contrast of every declared text and surface pair in tokens.css and each preset,
// light and dark (D16). A claim in a comment is not a measurement; this is.
// It also scans the style blocks of ui/ and pages/ (demos excluded) for a rule that paints
// `color: var(--ui-X)` on `background: var(--ui-Y)` where the pair is neither in `pairs` nor in
// `exemptPairs` (D85). It reads the declarations a rule holds itself, nested rules and at-rules
// included, `var()` with spaces or a fallback, and a background shorthand that starts with the
// token. It does not see: a colour set in one rule on a ground set in another (a hover row, a
// parent's background), a ground that is not the first value of `background` (a gradient,
// `color-mix()`, a colour after an image), inline `style` attributes.

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

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
  { fg: '--ui-ink', bg: '--ui-surface-3', min: 4.5 },
  { fg: '--ui-ink', bg: '--ui-sunk', min: 4.5 },
  { fg: '--ui-ink-2', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-ink-2', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-ink-2', bg: '--ui-surface-2', min: 4.5 },
  { fg: '--ui-muted', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-muted', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-muted', bg: '--ui-surface-2', min: 4.5 },
  { fg: '--ui-placeholder', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-accent', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-accent', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-on-accent', bg: '--ui-accent', min: 4.5 },
  { fg: '--ui-on-accent', bg: '--ui-accent-hover', min: 4.5 },
  { fg: '--ui-on-accent', bg: '--ui-accent-active', min: 4.5 },
  { fg: '--ui-on-accent-soft', bg: '--ui-accent-soft', min: 4.5 },
  { fg: '--ui-danger', bg: '--ui-surface', min: 4.5 },
  { fg: '--ui-danger', bg: '--ui-bg', min: 4.5 },
  { fg: '--ui-on-danger', bg: '--ui-danger', min: 4.5 },
  { fg: '--ui-on-danger', bg: '--ui-danger-hover', min: 4.5 },
  { fg: '--ui-on-danger', bg: '--ui-danger-active', min: 4.5 },
  { fg: '--ui-on-danger-soft', bg: '--ui-danger-soft', min: 4.5 },
  { fg: '--ui-on-success-soft', bg: '--ui-success-soft', min: 4.5 },
  { fg: '--ui-on-warning-soft', bg: '--ui-warning-soft', min: 4.5 },
  { fg: '--ui-on-chrome', bg: '--ui-chrome', min: 4.5 },
  { fg: '--ui-surface', bg: '--ui-ink', min: 4.5 },
  { fg: '--ui-success', bg: '--ui-surface', min: 3 },
  { fg: '--ui-warning', bg: '--ui-surface', min: 3 },
  { fg: '--ui-border-strong', bg: '--ui-bg', min: 3 },
  { fg: '--ui-border-strong', bg: '--ui-surface', min: 3 },
  { fg: '--ui-border-strong', bg: '--ui-surface-2', min: 3 },
  { fg: '--ui-focus', bg: '--ui-bg', min: 3 },
  { fg: '--ui-focus', bg: '--ui-surface', min: 3 },
  { fg: '--ui-focus', bg: '--ui-surface-2', min: 3 },
]

/** Pairs a component paints that are not measured, and why. */
export const exemptPairs: { fg: string; bg: string; why: string }[] = [
  { fg: '--ui-disabled-ink', bg: '--ui-sunk', why: 'disabled controls: inactive components are outside WCAG 2.2 SC 1.4.3' },
  { fg: '--ui-accent', bg: '--ui-border', why: 'JobProgress bar on its track: 2.84:1 in neutral dark, a line in TODO.md' },
  { fg: '--ui-border-strong', bg: '--ui-surface-3', why: "a secondary Button's border on its own pressed ground: 2.46 to 2.75:1, 3:1 against the page outside kept; a press lasts as long as the finger (D104)" },
]

/** The `color` and `background` token pairs of each rule in the style blocks of a .vue or .css source that nobody declared. */
export function undeclaredPairs(source: string): { fg: string; bg: string; selector: string }[] {
  const styles = /<style\b/.test(source) ? [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]!).join('\n') : source
  const known = [...pairs, ...exemptPairs]
  const out: { fg: string; bg: string; selector: string }[] = []
  for (const rule of styleRules(styles.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    let fg: string | undefined
    let bg: string | undefined
    // The last declaration of a property wins, as in the cascade; a value that does not start with a token is no pair.
    for (const declaration of rule.body.split(';')) {
      const match = /^\s*([\w-]+)\s*:\s*(.*?)\s*$/s.exec(declaration)
      if (!match) continue
      const token = /^var\(\s*(--ui-[\w-]+)\s*[,)]/.exec(match[2]!)?.[1]
      if (match[1] === 'color') fg = token
      else if (match[1] === 'background' || match[1] === 'background-color') bg = token
    }
    if (fg && bg && !known.some(pair => pair.fg === fg && pair.bg === bg)) out.push({ fg, bg, selector: rule.selector })
  }
  return out
}

/** Every style rule with the declarations it holds itself: nested rules are split out with `&` resolved, an at-rule's declarations belong to the rule around it. */
function styleRules(css: string): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = []
  const open: { selector: string; body: string }[] = []
  /** The innermost open style rule, skipping at-rules. */
  const outerSelector = () => [...open].reverse().find(rule => !rule.selector.startsWith('@'))?.selector
  let text = ''
  for (const char of css) {
    if (char === '{') {
      const end = text.lastIndexOf(';') + 1
      if (open.length > 0) open.at(-1)!.body += text.slice(0, end)
      const prelude = text.slice(end).trim().replace(/\s+/g, ' ')
      const outer = outerSelector()
      const selector = prelude.startsWith('@') || !outer ? prelude : prelude.includes('&') ? prelude.replaceAll('&', outer) : `${outer} ${prelude}`
      open.push({ selector, body: '' })
      text = ''
    } else if (char === '}') {
      const rule = open.pop()
      if (rule) {
        rule.body += text
        const outer = outerSelector()
        if (!rule.selector.startsWith('@')) out.push(rule)
        else if (outer) out.push({ selector: outer, body: rule.body })
      }
      text = ''
    } else {
      text += char
    }
  }
  return out
}

/** Every .vue and component .css under ui/ and pages/; demos, tokens, base styles and presets are left out. */
function styleSources(root: string): string[] {
  return ['ui', 'pages'].flatMap(directory => readdirSync(join(root, directory), { recursive: true, encoding: 'utf8' }).map(path => join(root, directory, path)))
    .filter(path => (path.endsWith('.vue') && !path.endsWith('.demo.vue')) || (path.endsWith('.css') && !path.includes('/presets/') && !path.endsWith('/tokens.css') && !path.endsWith('/base.css')))
    .sort()
}

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
  const mix = /^color-mix\(\s*in srgb\s*,(.+)\)$/.exec(value)
  if (mix) return mixColors(tokens, value, mix[1]!, scheme, depth)
  throw new Error(`cannot measure "${value}": use a hex colour, a var() of one or color-mix(in srgb, ...) of two`)
}

/**
 * color-mix(in srgb, A p%, B q%) as CSS Color 5 computes it: channel by channel in gamma-encoded
 * sRGB. A missing percentage is the rest of 100, none is half each, a sum over 100 is scaled down;
 * a sum under 100 makes the colour translucent, which no ratio measures. A percentage over 100 is
 * invalid CSS: the browser drops the declaration, so the script refuses it rather than measure it.
 */
function mixColors(tokens: Map<string, string>, value: string, args: string, scheme: Scheme, depth: number): [number, number, number] {
  const [first, second] = splitTop(args).map(part => /^(.*?)(?:\s+(\d*\.?\d+)%)?$/s.exec(part.trim())!)
  const p1 = first![2] === undefined ? undefined : Number(first![2]) / 100
  const p2 = second![2] === undefined ? undefined : Number(second![2]) / 100
  if ((p1 ?? 0) > 1 || (p2 ?? 0) > 1) throw new Error(`cannot measure "${value}": a percentage over 100% is invalid`)
  const [w1, w2] = [p1 ?? (p2 === undefined ? 0.5 : 1 - p2), p2 ?? (p1 === undefined ? 0.5 : 1 - p1)]
  if (w1 + w2 < 1 - 1e-9) throw new Error(`cannot measure "${value}": percentages under 100% in sum make it translucent`)
  const a = parseColor(tokens, first![1]!, scheme, depth)
  const b = parseColor(tokens, second![1]!, scheme, depth)
  return a.map((channel, index) => (channel * w1 + b[index]! * w2) / (w1 + w2)) as [number, number, number]
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
  const root = join(import.meta.dir, '..')
  const results = measure(root)
  const failures = results.filter(result => !result.ok)
  for (const result of results) {
    if (!result.ok || process.argv.includes('--all')) {
      console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${result.preset.padEnd(8)} ${result.scheme.padEnd(5)} ${result.fg.padEnd(22)} on ${result.bg.padEnd(18)} ${result.ratio.toFixed(2)} (min ${result.min})`)
    }
  }
  console.log(`${results.length - failures.length}/${results.length} pairs pass`)
  const sources = styleSources(root)
  const undeclared = sources.flatMap(path => undeclaredPairs(readFileSync(path, 'utf8')).map(pair => ({ ...pair, path: relative(root, path) })))
  for (const pair of undeclared) console.log(`${pair.path}: ${pair.selector} ${pair.fg} on ${pair.bg}`)
  console.log(`${undeclared.length} undeclared pairs in ${sources.length} style sources (add the pair to \`pairs\` or, with a reason, to \`exemptPairs\`)`)
  if (failures.length > 0 || undeclared.length > 0) process.exit(1)
}
