// The mechanical anti-creep rules (D12, D89), run here on ui/ and pages/ and in a target project on
// src/ui/ and src/pages/. The file is copied into a target as is (D47); `scripts/template-check.ts`
// copies it into its scaffold the same way. Output is `path:line: RULE message`, exit 1 on any finding.
//
// Rules on every <style> block of a .vue file and every component .css file (comments and quoted strings are not read):
//   UL-001 no hex colour: use a var(--ui-*) token
//   UL-002 no px length except 0, 1px, 2px hairlines (also negative): use a token (rem, --ui-space-*, --ui-radius-*)
//   UL-003 no font-family: the token --ui-font-sans or --ui-font-mono carries it
//   UL-004 no colour function (rgb, hsl, hwb, lab, lch, oklab, oklch, color()): use a token; color-mix() of tokens passes
//   UL-005 no font-size or font shorthand with a px, rem, pt or vw number: use var(--ui-text-*) (em, %, inherit pass)
//   UL-006 no vh: use dvh, or svh for a fixed height (a phone's browser bar makes 100vh taller than the screen)
//   UL-007 no :hover outside @media (hover: hover): a touch screen keeps :hover on the last element tapped;
//          a query with `not`, or a comma or `or` branch without the feature, is no guard
// Rules on the template of every .vue file, demos included (HTML comments are not read):
//   UL-013 an icon-only Button (content only its icon slot) carries label; aria-label shows no tooltip
// Rules on a page (the <Name>/<Name>.vue file under a pages directory):
//   UL-010 the root carries data-page
//   UL-011 the page uses Page and PageHeader
//   UL-012 a submit or danger Button carries data-action
// With --strict: UL-020 no <style> block outside the ui directory (D47).
// tokens.css, base.css and the presets declare the values and are exempt.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export interface Finding { file: string; line: number; rule: string; message: string }

export function lintSource(file: string, source: string, options: { page: boolean; strict: boolean; insideUi: boolean }): Finding[] {
  const findings: Finding[] = []
  for (const [start, , content] of blocks(source, 'style')) {
    if (options.strict && !options.insideUi) findings.push({ file, line: start + 1, rule: 'UL-020', message: 'no <style> outside the ui directory (--strict)' })
    // A comment or a quoted string is prose ("16 px on touch", content: "{"), not a value: blank it, keep the line numbers.
    const css = content.replace(/\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, prose => prose.startsWith('/*') ? blank(prose) : prose[0] + ' '.repeat(prose.length - 2) + prose[0])
    css.split('\n').forEach((text, offset) => {
      const line = start + offset + 1
      if (/#[0-9a-f]{3,8}\b/i.test(text)) findings.push({ file, line, rule: 'UL-001', message: 'hex colour: use a var(--ui-*) token' })
      const px = [...text.matchAll(/(-?\d*\.?\d+)px\b/g)].map(match => match[1]).filter(value => !['0', '1', '2', '-1', '-2'].includes(value!))
      if (px.length > 0) findings.push({ file, line, rule: 'UL-002', message: `${px.join('px, ')}px: use a token or rem` })
      if (/font-family\s*:/.test(text)) findings.push({ file, line, rule: 'UL-003', message: 'font-family: use --ui-font-sans or --ui-font-mono' })
      if (/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(text)) findings.push({ file, line, rule: 'UL-004', message: 'colour literal: use a var(--ui-*) token' })
      if (/\dvh\b/.test(text)) findings.push({ file, line, rule: 'UL-006', message: 'vh: use dvh (svh for a fixed height)' })
    })
    // Per declaration, so a value broken over lines counts; the font shorthand carries a size too.
    for (const match of css.matchAll(/(?<![\w-])font(-size)?\s*:([^;{}]*)/g)) {
      if (/\d(px|rem|pt|vw)\b/i.test(match[2]!)) findings.push({ file, line: start + lineOf(css, match.index!), rule: 'UL-005', message: 'literal font size: use var(--ui-text-*)' })
    }
    for (const offset of unguardedHover(css)) findings.push({ file, line: start + lineOf(css, offset), rule: 'UL-007', message: 'unguarded :hover: wrap the rule in @media (hover: hover)' })
  }
  const template = blocks(source, 'template')[0]
  // A commented-out Button is not a Button: blank HTML comments, keep the line numbers.
  const [start, , body] = template ? [template[0], template[1], template[2].replace(/<!--[\s\S]*?-->/g, blank)] : [0, 0, '']
  for (const match of body.matchAll(/<Button\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
    const close = body.indexOf('</Button>', match.index!)
    const rest = close < 0 ? null : withoutIconSlot(body.slice(match.index! + match[0].length, close))
    const named = /\s(:|v-bind:)?label\s*=/.test(match[1]!.replace(/"[^"]*"|'[^']*'/g, '""'))
    if (rest?.trim() === '' && !named) findings.push({ file, line: start + lineOf(body, match.index!), rule: 'UL-013', message: 'an icon-only Button carries label' })
  }
  if (options.page) {
    if (!/data-page=/.test(body)) findings.push({ file, line: 1, rule: 'UL-010', message: 'a page root carries data-page="<area>.<page>"' })
    if (!/<Page\b/.test(body) || !/<PageHeader\b/.test(body)) findings.push({ file, line: 1, rule: 'UL-011', message: 'a page uses Page and PageHeader' })
    for (const match of body.matchAll(/<Button\b[^>]*>/g)) {
      const tag = match[0]
      if ((/type="submit"/.test(tag) || /variant="danger"/.test(tag)) && !/data-action=/.test(tag)) {
        findings.push({ file, line: start + lineOf(body, match.index!), rule: 'UL-012', message: 'a submit or danger Button carries data-action' })
      }
    }
  }
  return findings
}

/**
 * Offsets of every selector holding :hover that no enclosing @media with `hover: hover` guards.
 * Reads the block by brace depth, so nested at-rules (@container, @supports) and nested rules count.
 */
function unguardedHover(css: string): number[] {
  const found: number[] = []
  const stack: string[] = []
  let from = 0
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index]
    if (char === '{') {
      const prelude = css.slice(from, index)
      const hover = prelude.search(/:hover\b/)
      const guarded = stack.some(guards)
      if (hover >= 0 && !prelude.trim().startsWith('@') && !guarded) found.push(from + hover)
      stack.push(prelude.trim())
      from = index + 1
    } else if (char === '}' || char === ';') {
      if (char === '}') stack.pop()
      from = index + 1
    }
  }
  return found
}

/** An @media that never matches a touch screen: every branch (comma or `or`) holds `hover: hover`, none is negated. */
function guards(head: string): boolean {
  return /^@media\b/.test(head) && head.slice(6).split(/,|\bor\b/).every(branch => /(?<![\w-])hover\s*:\s*hover\b/.test(branch) && !/\bnot\b/.test(branch))
}

/** The content of a Button without its icon slot (`#icon` or `v-slot:icon`, to its balanced closing tag); null without one. */
function withoutIconSlot(content: string): string | null {
  const slot = /<template\s+(#|v-slot:)icon\b[^>]*>/.exec(content)
  if (!slot) return null
  const tags = /<template\b[^>]*>|<\/template>/g
  tags.lastIndex = slot.index + slot[0].length
  let depth = 1
  for (let tag = tags.exec(content); tag; tag = tags.exec(content)) {
    depth += tag[0].startsWith('</') ? -1 : 1
    if (depth === 0) return content.slice(0, slot.index) + content.slice(tag.index + tag[0].length)
  }
  return null
}

/** Spaces for every character but line breaks, so offsets and line numbers stay. */
function blank(text: string): string {
  return text.replace(/[^\n]/g, ' ')
}

/** [start, end, content] of every <tag> block: start is the 0-based line of the opening tag's `>`, where content begins; end is exclusive. The root template runs to the last closing tag at column 0 (nested templates inside). */
function blocks(source: string, tag: string): [number, number, string][] {
  const out: [number, number, string][] = []
  const pattern = tag === 'template'
    ? new RegExp(`^<${tag}\\b[^>]*>([\\s\\S]*)^</${tag}>`, 'gm')
    : new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g')
  for (const match of source.matchAll(pattern)) {
    const start = lineOf(source, match.index! + match[0].indexOf('>') + 1) - 1
    out.push([start, start + match[1]!.split('\n').length, match[1]!])
  }
  return out
}

function lineOf(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length
}

export function lintDirectories(root: string, directories: string[], options: { strict: boolean; uiDirectory: string }): Finding[] {
  return directories.flatMap(directory => walk(join(root, directory)).filter(file => file.endsWith('.vue') || file.endsWith('.css')).flatMap(file => {
    const path = relative(root, file)
    const parts = path.split(sep)
    // Only <Name>/<Name>.vue is the page; a recipe may split sub-components next to it (D22).
    const page = file.endsWith('.vue') && parts.includes('pages') && parts.at(-1) === `${parts.at(-2)}.vue`
    const insideUi = path.startsWith(options.uiDirectory + sep)
    const source = readFileSync(file, 'utf8')
    // A .css file next to a component (<style scoped src>) is one style block; tokens.css and presets declare the values and are exempt.
    // No newline after <style>: a finding's line is the line in the .css file.
    const wrapped = file.endsWith('.css') ? `<style>${source}</style>` : source
    if (file.endsWith('.css') && (parts.includes('presets') || file.endsWith('tokens.css') || file.endsWith('base.css'))) return []
    return lintSource(path, wrapped, { page, strict: options.strict, insideUi })
  }))
}

function walk(dir: string): string[] {
  try { statSync(dir) } catch { return [] }
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

if (import.meta.main) {
  const strict = process.argv.includes('--strict')
  const directories = process.argv.slice(2).filter(argument => !argument.startsWith('--'))
  if (directories.length === 0) {
    console.error('usage: bun ui-lint.ts [--strict] <dir> [<dir>...]   e.g. ui pages  or  src/ui src/pages')
    process.exit(2)
  }
  const uiDirectory = directories.find(directory => directory === 'ui' || directory.endsWith('/ui')) ?? 'ui'
  const findings = lintDirectories(process.cwd(), directories, { strict, uiDirectory })
  for (const finding of findings) console.log(`${finding.file}:${finding.line}: ${finding.rule} ${finding.message}`)
  console.log(findings.length === 0 ? 'ui-lint: clean' : `ui-lint: ${findings.length} finding(s)`)
  if (findings.length > 0) process.exit(1)
}
