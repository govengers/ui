// Renders every piece that has a demo in the default preset, light and dark, into screenshots/
// (D15). `--check` only verifies that every such screenshot exists (D46). Uses the system Chrome
// through Playwright, falling back to Playwright's Chromium, against the Vite dev server.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { readCards, type Card } from './cards'

const root = join(import.meta.dir, '..')
const out = join(root, 'screenshots')
// A random port so several runs (parallel maintainers) do not collide; the dev server needs no build.
const port = 5200 + Math.floor(Math.random() * 500)

function demoPath(card: Card): string | null {
  if (!card.component) return null
  const demo = join(root, card.component.replace(/\.vue$/, '.demo.vue'))
  return existsSync(demo) ? demo : null
}

function route(card: Card): string {
  const dir = card.component!.split('/').slice(0, -2).join('/')
  return `/${dir}/${card.name}`
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

async function render(cards: Card[]): Promise<void> {
  const { chromium } = await import('@playwright/test')
  mkdirSync(out, { recursive: true })
  const preview = spawn('bunx', ['vite', '--config', 'demo/vite.config.ts', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
  try {
    await waitFor(`http://localhost:${port}/`)
    const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    for (const card of cards.filter(demoPath)) {
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.goto(`http://localhost:${port}${route(card)}`, { waitUntil: 'networkidle' })
        await page.locator('article.demo').waitFor()
        await page.locator('article.demo').screenshot({ path: join(out, `${card.name}.${scheme}.png`) })
        console.log(`${card.name}.${scheme}.png`)
      }
    }
    await browser.close()
  } finally {
    preview.kill()
  }
}

if (import.meta.main) {
  const cards = readCards(root)
  if (process.argv.includes('--check')) {
    const missing = expectedFiles(cards).filter(file => !existsSync(file))
    if (missing.length > 0) {
      console.error(`missing screenshots (run \`just screenshots\`):\n${missing.map(file => '  ' + file.replace(root + '/', '')).join('\n')}`)
      process.exit(1)
    }
    console.log('every demo has its light and dark screenshot')
  } else {
    const only = process.argv.find(argument => argument.startsWith('--only='))?.slice(7)
    await render(only ? cards.filter(card => card.name === only) : cards)
  }
}
