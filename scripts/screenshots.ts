// Renders every piece that has a demo in the default preset, light and dark, into screenshots/
// (D15). `--check` only verifies that every such screenshot exists (D46). Uses the system Chrome
// through Playwright, falling back to Playwright's Chromium, against the Vite dev server.
// The demo server, the browser and the demo routes are shared with scripts/touch-probe.ts (D87).

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Browser } from '@playwright/test'
import { readCards, type Card } from './cards'

const root = join(import.meta.dir, '..')
const out = join(root, 'screenshots')

/** The demo next to the card, if any; a composable has a card and a demo but no .vue. */
export function demoPath(card: Card): string | null {
  const demo = join(root, card.path.replace(/\.md$/, '.demo.vue'))
  return existsSync(demo) ? demo : null
}

export function route(card: Card): string {
  const dir = card.path.split('/').slice(0, -2).join('/')
  return `/${dir}/${card.name}`
}

/** The cards that have a demo, narrowed to one name by `--only=<Name>`; a name without a demo is an error, not an empty run. */
export function demoCards(argv: string[]): Card[] {
  const only = argv.find(argument => argument.startsWith('--only='))?.slice(7)
  const cards = readCards(root).filter(card => demoPath(card) && (only === undefined || card.name === only))
  if (cards.length === 0) throw new Error(`no demo named "${only}"`)
  return cards
}

export function expectedFiles(cards: Card[]): string[] {
  return cards.filter(demoPath).flatMap(card => ['light', 'dark'].map(scheme => join(out, `${card.name}.${scheme}.png`)))
}

async function waitFor(url: string, tries = 50): Promise<void> {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try { await fetch(url); return } catch { await new Promise(resolve => setTimeout(resolve, 200)) }
  }
  throw new Error(`${url} did not come up`)
}

/** Starts the demo's Vite dev server, hands its base URL to `use` and stops it again. */
export async function withDemoServer<T>(use: (base: string) => Promise<T>): Promise<T> {
  // A random port so several runs (parallel maintainers) do not collide; the dev server needs no build.
  const port = 5200 + Math.floor(Math.random() * 500)
  const server = spawn('bunx', ['vite', '--config', 'demo/vite.config.ts', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
  try {
    await waitFor(`http://localhost:${port}/`)
    return await use(`http://localhost:${port}`)
  } finally {
    server.kill()
  }
}

export async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import('@playwright/test')
  return chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
}

async function render(cards: Card[]): Promise<void> {
  mkdirSync(out, { recursive: true })
  await withDemoServer(async base => {
    const browser = await launchBrowser()
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    for (const card of cards) {
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.goto(`${base}${route(card)}`, { waitUntil: 'networkidle' })
        await page.locator('article.demo').waitFor()
        // No loading delay, so skeletons and spinners are in the picture (D86). Their appear
        // animations stop too: the element capture restarts them in cells hidden on phones and
        // would catch those placeholders still hidden.
        await page.addStyleTag({ content: 'header.top { position: static !important; } :root { --ui-loading-delay: 0ms; } .ui-skeleton, .ui-skeleton__line, .ui-table__loading, .ui-table__loading td { animation: none !important; }' })
        await page.locator('article.demo').screenshot({ path: join(out, `${card.name}.${scheme}.png`) })
        console.log(`${card.name}.${scheme}.png`)
      }
    }
    await browser.close()
  })
}

if (import.meta.main) {
  if (process.argv.includes('--check')) {
    const missing = expectedFiles(readCards(root)).filter(file => !existsSync(file))
    if (missing.length > 0) {
      console.error(`missing screenshots (run \`just screenshots\`):\n${missing.map(file => '  ' + file.replace(root + '/', '')).join('\n')}`)
      process.exit(1)
    }
    console.log('every demo has its light and dark screenshot')
  } else {
    await render(demoCards(process.argv))
  }
}
