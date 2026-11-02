// Reads the front matter of every component, block, page and pattern card (D10). Shared by the
// index generator, the screenshot runner and the presence check.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export type Tier = 'primitive' | 'layout' | 'block' | 'page' | 'pattern'

export interface Card {
  name: string
  tier: Tier
  intent: string[]
  uses: string[]
  livewire: boolean
  status: 'draft' | 'ready'
  /** Path of the card relative to the repository root. */
  path: string
  /** Path of the .vue file next to the card, if there is one. */
  component?: string
  /** First paragraph after the heading: the one-line summary shown in the index. */
  summary: string
}

const tiers: Tier[] = ['primitive', 'layout', 'block', 'page', 'pattern']

export function readCards(root: string): Card[] {
  const files = [...walk(join(root, 'ui')), ...walk(join(root, 'pages')), ...walk(join(root, 'patterns'))]
    .filter(file => file.endsWith('.md') && !file.endsWith('README.md'))
  return files.map(file => parseCard(root, file)).sort(byTierThenName)
}

export function parseCard(root: string, file: string): Card {
  const text = readFileSync(file, 'utf8')
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text)
  if (!match) throw new Error(`${file}: no front matter`)
  const front = parseFrontMatter(match[1] ?? '')
  const body = match[2] ?? ''
  const tier = front['tier']
  if (!tiers.includes(tier as Tier)) throw new Error(`${file}: tier must be one of ${tiers.join(', ')}`)
  const status = front['status'] ?? 'draft'
  if (status !== 'draft' && status !== 'ready') throw new Error(`${file}: status must be draft or ready`)
  const name = front['name']
  if (!name) throw new Error(`${file}: name missing`)
  const vue = file.replace(/\.md$/, '.vue')
  return {
    name,
    tier: tier as Tier,
    intent: list(front['intent']),
    uses: list(front['uses']),
    livewire: front['livewire'] === 'true',
    status,
    path: relative(root, file),
    ...(exists(vue) ? { component: relative(root, vue) } : {}),
    summary: firstParagraph(body),
  }
}

function parseFrontMatter(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const colon = line.indexOf(':')
    if (colon < 0) continue
    out[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }
  return out
}

/** `[a, b, c]` or `a, b, c` to a list; empty for `[]` or nothing. */
function list(value: string | undefined): string[] {
  if (!value) return []
  return value.replace(/^\[|\]$/g, '').split(',').map(item => item.trim()).filter(Boolean)
}

function firstParagraph(body: string): string {
  const lines = body.split('\n')
  const start = lines.findIndex((line, index) => line.trim() !== '' && !line.startsWith('#') && index > 0)
  if (start < 0) return ''
  const paragraph: string[] = []
  for (const line of lines.slice(start)) {
    if (line.trim() === '') break
    paragraph.push(line.trim())
  }
  return paragraph.join(' ')
}

function walk(dir: string): string[] {
  if (!exists(dir)) return []
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function exists(path: string): boolean {
  try { statSync(path); return true } catch { return false }
}

function byTierThenName(a: Card, b: Card): number {
  return tiers.indexOf(a.tier) - tiers.indexOf(b.tier) || a.name.localeCompare(b.name)
}
