// The mechanical anti-creep rules (D12), run here on ui/ and pages/ and in a target project on
// src/ui/ and src/pages/ (templates/project/ui-lint.ts is a copy of this file). Output is
// `path:line: RULE message`, exit 1 on any finding.
//
// Rules on every <style> block of a .vue file:
//   UL-001 no hex colour: use a var(--ui-*) token
//   UL-002 no px length except 0, 1px, 2px hairlines (also negative): use a token (rem, --ui-space-*, --ui-radius-*)
//   UL-003 no font-family: the token --ui-font-sans or --ui-font-mono carries it
// Rules on a page (the <Name>/<Name>.vue file under a pages directory):
//   UL-010 the root carries data-page
//   UL-011 the page uses Page and PageHeader
//   UL-012 a submit or danger Button carries data-action
// With --strict: UL-020 no <style> block outside the ui directory (D47).

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export interface Finding { file: string; line: number; rule: string; message: string }

export function lintSource(file: string, source: string, options: { page: boolean; strict: boolean; insideUi: boolean }): Finding[] {
  const findings: Finding[] = []
  const lines = source.split('\n')
  const styleRanges = blocks(source, 'style')
  for (const [start, end] of styleRanges) {
    if (options.strict && !options.insideUi) findings.push({ file, line: start + 1, rule: 'UL-020', message: 'no <style> outside the ui directory (--strict)' })
    for (let index = start; index < end; index += 1) {
      const text = lines[index] ?? ''
      if (/#[0-9a-f]{3,8}\b/i.test(text)) findings.push({ file, line: index + 1, rule: 'UL-001', message: 'hex colour: use a var(--ui-*) token' })
      const px = [...text.matchAll(/(-?\d*\.?\d+)px\b/g)].map(match => match[1]).filter(value => !['0', '1', '2', '-1', '-2'].includes(value!))
      if (px.length > 0) findings.push({ file, line: index + 1, rule: 'UL-002', message: `${px.join('px, ')}px: use a token or rem` })
      if (/font-family\s*:/.test(text)) findings.push({ file, line: index + 1, rule: 'UL-003', message: 'font-family: use --ui-font-sans or --ui-font-mono' })
    }
  }
  if (options.page) {
    const template = blocks(source, 'template')[0]
    const body = template ? lines.slice(template[0], template[1]).join('\n') : ''
    if (!/data-page=/.test(body)) findings.push({ file, line: 1, rule: 'UL-010', message: 'a page root carries data-page="<area>.<page>"' })
    if (!/<Page\b/.test(body) || !/<PageHeader\b/.test(body)) findings.push({ file, line: 1, rule: 'UL-011', message: 'a page uses Page and PageHeader' })
    for (const match of body.matchAll(/<Button\b[^>]*>/g)) {
      const tag = match[0]
      if ((/type="submit"/.test(tag) || /variant="danger"/.test(tag)) && !/data-action=/.test(tag)) {
        findings.push({ file, line: lineOf(source, match.index!), rule: 'UL-012', message: 'a submit or danger Button carries data-action' })
      }
    }
  }
  return findings
}

/** [start, end) line ranges of the content of every <tag> block; the root template runs to the last closing tag at column 0 (nested templates inside). */
function blocks(source: string, tag: string): [number, number][] {
  const out: [number, number][] = []
  const pattern = tag === 'template'
    ? new RegExp(`^<${tag}\\b[^>]*>([\\s\\S]*)^</${tag}>`, 'gm')
    : new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g')
  for (const match of source.matchAll(pattern)) {
    const start = lineOf(source, match.index! + match[0].indexOf('>') + 1) - 1
    out.push([start, start + match[1]!.split('\n').length])
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
    const wrapped = file.endsWith('.css') ? `<style>\n${source}\n</style>` : source
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
