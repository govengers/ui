// Touch probe (D87): opens every demo in a touch context (390 by 844 CSS px, coarse pointer), in
// both densities, and lists every control under 44 by 44 CSS px (WCAG 2.2 SC 2.5.5). `exempt`
// names the exceptions the criterion allows, `known` the targets that were too small when the probe
// was written, with their measured size. The run fails on any other offender, on a known target
// that shrank below its recorded size, and, over every demo, on an entry that matches nothing.
// Local only, like the screenshots (D46, D69). `--only=<Name>` probes one demo, `--all` lists the
// known and exempt targets too.

import type { Page } from '@playwright/test'
import { demoCards, launchBrowser, route, withDemoServer } from './screenshots'

type Density = 'comfortable' | 'compact'
/** Width and height in CSS px. */
type Size = [number, number]

export interface Exempt { route?: string | undefined; selector: string; why: string }
/** `size` is the measured box; `compact` where the compact density measures otherwise. */
export interface Known { route: string; selector: string; size: Size; compact?: Size | undefined; why: string }

/** The exceptions of WCAG 2.2 SC 2.5.5 (a link in a sentence) and boxes that take no pointer action. */
export const exempt: Exempt[] = [
  { selector: '.ui-markdown p a', why: 'inline: a link in a sentence of rendered markdown' },
  { selector: '.ui-markdown li > input[type="checkbox"]:disabled', why: 'not a target: the task box of rendered markdown is disabled, it takes no pointer action' },
  { selector: '.ui-empty-state__description a', why: 'inline: a link in the sentence of the description' },
  { selector: '.ui-checkbox__label a', why: 'inline: a link in the sentence of a checkbox label' },
]

/** Too small when the probe was written (18.11.2026) and not fixed yet; each piece has a line in TODO.md. */
// The sizes hold for the system font of the machine that measured them; on another operating system
// or font they are measured again, never lowered to make a run pass.
export const known: Known[] = [
  { route: '/ui/blocks/FacetFilter', selector: '.ui-facet-filter__op[aria-pressed="false"]', size: [18.5, 44], why: 'the is / is not toggle of a chip is as wide as its word' },
  { route: '/ui/blocks/FacetFilter', selector: '.ui-facet-filter__op[aria-pressed="true"]', size: [44.2, 36], why: 'the pressed toggle of a chip is shorter than the chip' },
  { route: '/ui/blocks/FacetFilter', selector: '.ui-facet-filter__remove', size: [30, 44], why: 'the remove button of a chip is an icon button 30 px wide' },
  { route: '/ui/blocks/FacetFilter', selector: '.ui-facet-filter__values', size: [32.4, 44], why: 'the values button of a chip is as wide as a short value' },
  { route: '/pages/ListPage', selector: '.ui-facet-filter__op', size: [18.5, 44], why: 'FacetFilter, as above' },
  { route: '/pages/ListPage', selector: '.ui-facet-filter__remove', size: [30, 44], why: 'FacetFilter, as above' },
  { route: '/ui/blocks/AgentDock', selector: '.ui-agent-dock__composer .ui-textarea', size: [255, 42], compact: [271, 42], why: 'the composer is a one-row Textarea' },
  { route: '/ui/blocks/LoginForm', selector: '.ui-login-form__footer a', size: [115.2, 21], why: 'text links in the footer slot get no target size from LoginForm' },
  { route: '/pages/LoginPage', selector: '.ui-login-form__footer a', size: [115.2, 21], why: 'LoginForm footer, as above' },
  { route: '/pages/LoginPage', selector: '.login-page__footer a', size: [51, 24], compact: [48.2, 22.5], why: 'the imprint link in the page footer is a text link' },
  { route: '/pages/Changelog', selector: '.changelog__version a', size: [40.6, 20], compact: [38.3, 18.8], why: 'the version permalink in a release heading is a text link' },
]

const targets = 'button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=menuitem], label:has(input)'
const densities: Density[] = ['comfortable', 'compact']
/** WCAG 2.2 SC 2.5.5 in CSS px, and how far a known target may measure under its record (layout rounding). */
const floor = 44
const tolerance = 0.5

/** A visible target under 44 by 44; `exempt` and `known` are the index of the entry that matched it. */
export interface Offender { route: string; density: Density; selector: string; width: number; height: number; exempt?: number | undefined; known?: number | undefined }

export interface Verdict {
  /** In neither list. */
  failing: Offender[]
  /** Known, but smaller than recorded on a side that is under 44 px. */
  shrunk: Offender[]
  waived: Offender[]
  exempted: Offender[]
  /** Entries that matched no offender; only judged when every demo ran. */
  stale: string[]
}

/** Sorts what the probe found. A known target fails only on a side under 44 px, so a wider composer or a taller link is no regression. */
export function judge(found: Offender[], lists: { known: Known[]; exempt: Exempt[] }, everyDemo: boolean): Verdict {
  const exempted = found.filter(offender => offender.exempt !== undefined)
  const listed = found.filter(offender => offender.exempt === undefined && offender.known !== undefined)
  const shrunk = listed.filter(offender => {
    const entry = lists.known[offender.known!]!
    const [width, height] = offender.density === 'compact' && entry.compact ? entry.compact : entry.size
    return offender.width + tolerance < Math.min(floor, width) || offender.height + tolerance < Math.min(floor, height)
  })
  const stale = everyDemo
    ? [
        ...lists.known.flatMap((entry, index) => (found.some(offender => offender.known === index) ? [] : [`known ${entry.route} ${entry.selector}`])),
        ...lists.exempt.flatMap((entry, index) => (found.some(offender => offender.exempt === index) ? [] : [`exempt ${entry.route ?? '*'} ${entry.selector}`])),
      ]
    : []
  return {
    failing: found.filter(offender => offender.exempt === undefined && offender.known === undefined),
    shrunk,
    waived: listed.filter(offender => !shrunk.includes(offender)),
    exempted,
    stale,
  }
}

/** The visible targets in the demo whose box, and for an input whose label's box, is under 44 by 44. */
function offenders(page: Page, path: string, density: Density): Promise<Offender[]> {
  const entries = (list: { route?: string | undefined; selector: string }[]) =>
    list.flatMap((entry, index) => (entry.route === undefined || entry.route === path ? [{ index, selector: entry.selector }] : []))
  return page.evaluate(({ targets, floor, exempt, known, path, density }) => {
    const fits = (box: DOMRect) => box.width + 0.01 >= floor && box.height + 0.01 >= floor
    const describe = (element: Element) => {
      const classes = [...element.classList].filter(name => name.startsWith('ui-')).map(name => `.${name}`).join('')
      const name = element.getAttribute('aria-label') ?? element.getAttribute('name') ?? element.textContent?.trim().slice(0, 24) ?? ''
      return `${element.localName}${classes}${name ? ` "${name}"` : ''}`
    }
    // Not a target for a finger: placed off the page (a skip link before focus), cut off by an
    // ancestor that hides its overflow, or inside the visually hidden pattern (clip: rect(0 0 0 0)).
    const unseen = (element: Element, box: DOMRect) => {
      if (box.right + scrollX <= 0 || box.bottom + scrollY <= 0) return true
      const cut = (overflow: string) => overflow === 'hidden' || overflow === 'clip'
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.clip === 'rect(0px, 0px, 0px, 0px)') return true
        const outer = parent.getBoundingClientRect()
        if (cut(style.overflowX) && (box.right <= outer.left || box.left >= outer.right)) return true
        if (cut(style.overflowY) && (box.bottom <= outer.top || box.top >= outer.bottom)) return true
      }
      return false
    }
    const out: Offender[] = []
    for (const element of document.querySelectorAll(`article.demo :is(${targets})`)) {
      // The demonstrator's own heading and card link are not part of the piece.
      if (element.closest('article.demo > header')) continue
      if (!element.checkVisibility({ checkVisibilityCSS: true })) continue
      const box = element.getBoundingClientRect()
      if (box.width === 0 || box.height === 0 || unseen(element, box)) continue
      // A tap on a label reaches its own input only; a link or button inside the label is its own target.
      const label = element instanceof HTMLInputElement ? element.closest('label') : null
      if (fits(box) || (label?.control === element && fits(label.getBoundingClientRect()))) continue
      out.push({
        route: path,
        density,
        selector: describe(element),
        width: Math.round(box.width * 10) / 10,
        height: Math.round(box.height * 10) / 10,
        exempt: exempt.find(entry => element.matches(entry.selector))?.index,
        known: known.find(entry => element.matches(entry.selector))?.index,
      })
    }
    return out
  }, { targets, floor, exempt: entries(exempt), known: entries(known), path, density })
}

if (import.meta.main) {
  const cards = demoCards(process.argv)
  const everyDemo = !process.argv.some(argument => argument.startsWith('--only='))
  const found = await withDemoServer(async base => {
    const browser = await launchBrowser()
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    const page = await context.newPage()
    const all: Offender[] = []
    try {
      for (const card of cards) {
        const path = route(card)
        await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
        await page.locator('article.demo').waitFor()
        if (!(await page.evaluate(() => matchMedia('(pointer: coarse)').matches))) throw new Error('the context does not match (pointer: coarse); the probe would measure the fine-pointer sizes')
        for (const density of densities) {
          await page.evaluate(value => {
            if (value === 'compact') document.documentElement.dataset['density'] = value
            else delete document.documentElement.dataset['density']
          }, density)
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          all.push(...await offenders(page, path, density))
        }
      }
    } finally {
      await browser.close()
    }
    return all
  })
  const verdict = judge(found, { known, exempt }, everyDemo)
  const line = (offender: Offender) => `${offender.route} ${offender.density} ${offender.selector} ${offender.width} x ${offender.height}`
  const recorded = (offender: Offender) => {
    const entry = known[offender.known!]!
    const [width, height] = offender.density === 'compact' && entry.compact ? entry.compact : entry.size
    return `${width} x ${height}`
  }
  for (const offender of verdict.failing) console.log(line(offender))
  for (const offender of verdict.shrunk) console.log(`smaller than known ${line(offender)} (recorded ${recorded(offender)})`)
  for (const entry of verdict.stale) console.log(`stale ${entry}: matched nothing, remove it`)
  if (process.argv.includes('--all')) {
    for (const offender of verdict.waived) console.log(`known ${line(offender)}`)
    for (const offender of verdict.exempted) console.log(`exempt ${line(offender)}: ${exempt[offender.exempt!]!.why}`)
  }
  console.log(`${cards.length} demos, 2 densities: ${verdict.failing.length} offenders, ${verdict.shrunk.length} smaller than known, ${verdict.stale.length} stale entries, ${verdict.waived.length} known, ${verdict.exempted.length} exempt`)
  if (verdict.failing.length + verdict.shrunk.length + verdict.stale.length > 0) process.exit(1)
}
