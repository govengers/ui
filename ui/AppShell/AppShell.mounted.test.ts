// AppShell mounted (D69, D92): the More tab on phones (when it shows, what its sheet lists, that a
// navigation closes it, that a current page behind it marks it, one footer node), the guards that
// make a double tap or a held Enter on More act once and end with that press, crossing 48rem, the
// rail's tooltips following the media query, and the names from ui.* keys. Layout is a browser check.
// The layout fake below writes three of the shell's CSS rules out by hand and sees no other rule, so
// where focus lands after a real resize (a browser that blurs first, a hidden popover) is proven by
// the browser probes of the run report; these cases pin the shell's own decisions.
import { afterAll, afterEach, beforeAll, expect, test } from 'bun:test'
import { defineComponent, h, reactive, type Component, type WritableComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, type NavigationHookAfter, type Router } from 'vue-router'
import { key, mount, settle, type Mounted } from '../../scripts/test/mount'
import { messages } from '../messages'
import AppShell, { type NavItem } from './AppShell.vue'

const phoneQuery = '(max-width: 48rem)'
const railQuery = '(min-width: 48.0625rem) and (max-width: 64rem)'
const matchMedia = window.matchMedia
const getClientRects = Element.prototype.getClientRects
const { querySelectorAll, matches } = Element.prototype
const { showPopover, hidePopover } = HTMLElement.prototype
/** The queries the viewport matches now; the layout fake below reads it too. */
let matching = new Set<string>()

// jsdom lays nothing out. Faked for this file only (the harness gives the modal dialog): an element
// has a box unless it is detached, an item past the fourth or `data-hide-on-phone` on a phone, or
// More elsewhere (the CSS). A closed dialog keeps its box, as it does in a browser while it slides out. jsdom parses
// `:popover-open` but matches nothing: here a popover is open while `showPopover()` has set
// `data-popover-open`.
const popoverOpen = (selectors: string) => selectors.replaceAll(':popover-open', '[data-popover-open]')
beforeAll(() => {
  Element.prototype.querySelectorAll = function (this: Element, selectors: string) { return querySelectorAll.call(this, popoverOpen(selectors)) } as typeof querySelectorAll
  Element.prototype.matches = function (this: Element, selectors: string) { return matches.call(this, popoverOpen(selectors)) }
  HTMLElement.prototype.showPopover = function (this: HTMLElement) { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function (this: HTMLElement) { this.removeAttribute('data-popover-open') }
  Element.prototype.getClientRects = function (this: Element) {
    const hidden = !this.isConnected || !!this.closest(matching.has(phoneQuery) ? '[data-overflow], [data-hide-on-phone]' : '.ui-app-shell__more')
    return { length: hidden ? 0 : 1 } as DOMRectList
  }
})
afterAll(() => {
  Element.prototype.getClientRects = getClientRects
  Object.assign(Element.prototype, { querySelectorAll, matches })
  Object.assign(HTMLElement.prototype, { showPopover, hidePopover })
})

/** Answers the queries given with a match; `flip` changes one and tells its listeners. */
function viewport(...queries: string[]) {
  matching = new Set(queries)
  const listeners = new Map<string, Set<() => void>>()
  window.matchMedia = (query: string) => ({
    media: query,
    get matches() { return matching.has(query) },
    addEventListener: (_: string, listener: () => void) => { listeners.set(query, (listeners.get(query) ?? new Set()).add(listener)) },
    removeEventListener: (_: string, listener: () => void) => { listeners.get(query)?.delete(listener) },
  }) as unknown as MediaQueryList
  return {
    flip(query: string) {
      if (matching.has(query)) matching.delete(query)
      else matching.add(query)
      for (const listener of listeners.get(query) ?? []) listener()
    },
    listening: (query: string) => listeners.get(query)?.size ?? 0,
  }
}

let view: Mounted | undefined
let router: Router
let locale: WritableComputedRef<string>
/** What the shell renders; a test changes it in place. */
let state: { nav: NavItem[]; footer: boolean }
let pressed = 0
/** The router's afterEach hooks that are still registered. */
const hooks = new Set<NavigationHookAfter>()
afterEach(() => {
  view?.unmount()
  view = undefined
  window.matchMedia = matchMedia
  matching = new Set()
  pressed = 0
  hooks.clear()
})

const items = (n: number): NavItem[] => Array.from({ length: n }, (_, index) => ({ label: `Area ${index + 1}`, icon: 'home', to: `/area-${index + 1}`, ...(index === 5 ? { count: 3 } : {}) }))

/** The footer: a link, a button that counts its clicks, an uncontrolled field, a popover and a dialog of its own. */
const footer = () => [
  h('a', { href: '/version', class: 'version' }, 'v1.4.0'),
  h('button', { type: 'button', class: 'press', onClick: () => { pressed++ } }, 'Press'),
  h('input', { class: 'note', name: 'note' }),
  h('div', { popover: '', class: 'tip' }, 'Tip'),
  h('dialog', { class: 'about' }, 'About'),
]

/** Mounts the shell at `path` with `n` items, a footer when asked; the router is the harness's. */
async function shell(n: number, options: { footer?: boolean; path?: string } = {}): Promise<HTMLElement> {
  state = reactive({ nav: items(n), footer: !!options.footer })
  const Host = defineComponent({
    setup() {
      router = useRouter()
      locale = useI18n().locale
      const afterEach = router.afterEach.bind(router)
      router.afterEach = (hook: NavigationHookAfter) => {
        const remove = afterEach(hook)
        hooks.add(hook)
        return () => { hooks.delete(hook); remove() }
      }
      return () => h(AppShell as Component, { title: 'Acme', nav: state.nav }, state.footer ? { navFooter: footer } : {})
    },
  })
  view = mount(Host)
  await router.push(options.path ?? '/area-1')
  await settle()
  return view.root
}

const more = (root: HTMLElement) => root.querySelector<HTMLButtonElement>('.ui-app-shell__more')
const sheet = (root: HTMLElement) => root.querySelector<HTMLDialogElement>('dialog.ui-sheet')!
const sheetLinks = (root: HTMLElement) => [...sheet(root).querySelectorAll<HTMLAnchorElement>('.ui-app-shell__more-list a')]
const navLink = (root: HTMLElement, n: number) => root.querySelectorAll<HTMLAnchorElement>('.ui-app-shell__nav > a')[n - 1]!
const click = (target: Element, detail = 1) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, detail })
  target.dispatchEvent(event)
  return event
}
async function openMore(root: HTMLElement): Promise<HTMLDialogElement> {
  click(more(root)!)
  await settle()
  return sheet(root)
}

test('More shows past five items or with a footer; items from the fifth on carry data-overflow', async () => {
  for (const [n, withFooter, shows] of [[4, false, false], [5, false, false], [6, false, true], [9, false, true], [4, true, true], [5, true, true]] as const) {
    const root = await shell(n, { footer: withFooter })
    expect(more(root) !== null, `${n} items, footer ${withFooter}`).toBe(shows)
    const overflow = [...root.querySelectorAll('.ui-app-shell__nav > a')].map(link => link.hasAttribute('data-overflow'))
    expect(overflow, `${n} items, footer ${withFooter}`).toEqual(Array.from({ length: n }, (_, index) => shows && index >= 4))
    view?.unmount()
    view = undefined
  }
})

test('a click on More opens the sheet with items five to seven, their counts and the footer; a link click closes it', async () => {
  viewport(phoneQuery)
  const root = await shell(7, { footer: true })
  const tab = more(root)!
  expect(tab.getAttribute('aria-haspopup')).toBe('dialog')
  expect(tab.getAttribute('aria-expanded')).toBe('false')
  expect(tab.textContent?.trim()).toBe(messages.en.ui.more)
  const panel = await openMore(root)
  expect(panel.hasAttribute('open')).toBe(true)
  expect(tab.getAttribute('aria-expanded')).toBe('true')
  expect(sheetLinks(root).map(link => link.querySelector('.ui-app-shell__label')?.textContent)).toEqual(['Area 5', 'Area 6', 'Area 7'])
  expect(sheetLinks(root)[1]!.querySelector('.ui-app-shell__count')?.textContent).toBe('3')
  expect(panel.querySelector('.version')?.textContent).toBe('v1.4.0')
  click(sheetLinks(root)[0]!)
  await settle()
  expect(router.currentRoute.value.path).toBe('/area-5')
  expect(panel.hasAttribute('open')).toBe(false)
  expect(tab.getAttribute('aria-expanded')).toBe('false')
})

test('the sheet closed by itself (Escape, X, backdrop) says so on More, which opens it again', async () => {
  const root = await shell(7)
  const panel = await openMore(root)
  panel.close()
  await settle()
  expect(more(root)!.getAttribute('aria-expanded')).toBe('false')
  await openMore(root)
  expect(panel.hasAttribute('open')).toBe(true)
})

test('a tap on the page it is on closes the sheet too; a navigation from elsewhere does as well', async () => {
  const root = await shell(7, { path: '/area-6' })
  await openMore(root)
  click(sheetLinks(root)[1]!)
  await settle()
  expect(router.currentRoute.value.path).toBe('/area-6')
  expect(sheet(root).hasAttribute('open')).toBe(false)
  await openMore(root)
  await router.push('/elsewhere')
  await settle()
  expect(sheet(root).hasAttribute('open')).toBe(false)
})

test('the router hook that closes the sheet goes with the shell', async () => {
  await shell(7)
  expect(hooks.size).toBe(1)
  view?.unmount()
  view = undefined
  expect(hooks.size).toBe(0)
})

test('the clicks of the double tap that opened the sheet do nothing in it, the whole burst', async () => {
  const root = await shell(7)
  await openMore(root)
  for (const detail of [2, 3]) expect(click(sheetLinks(root)[0]!, detail).defaultPrevented).toBe(true)
  await settle()
  expect(router.currentRoute.value.path).toBe('/area-1')
  expect(sheet(root).hasAttribute('open')).toBe(true)
})

test('a fresh click in the sheet ends the guard: a double click on a footer button counts twice', async () => {
  const root = await shell(7, { footer: true })
  const panel = await openMore(root)
  const button = root.querySelector('.press')!
  expect(click(button).defaultPrevented).toBe(false)
  expect(click(button, 2).defaultPrevented).toBe(false)
  expect(pressed).toBe(2)
  expect(panel.hasAttribute('open')).toBe(true)
})

test('a key coming up or a fresh key ends the guard; More arms it again on every open', async () => {
  const root = await shell(7)
  let panel = await openMore(root)
  const close = panel.querySelector('.ui-sheet__header button')!
  close.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  expect(key(close, 'Enter', { repeat: true }).defaultPrevented).toBe(false)
  panel.close()
  await settle()
  panel = await openMore(root)
  expect(key(close, 'Tab').defaultPrevented).toBe(false)
  expect(key(close, 'Enter', { repeat: true }).defaultPrevented).toBe(false)
  panel.close()
  await settle()
  panel = await openMore(root)
  expect(click(panel, 2).defaultPrevented).toBe(true)
})

test('Shift coming up while Enter is still held does not end the guard; Enter coming up does', async () => {
  const root = await shell(7)
  const close = (await openMore(root)).querySelector('.ui-sheet__header button')!
  const shift = new KeyboardEvent('keyup', { key: 'Shift', bubbles: true, cancelable: true })
  close.dispatchEvent(shift)
  expect(shift.defaultPrevented).toBe(false)
  expect(key(close, 'Enter', { repeat: true, shiftKey: true }).defaultPrevented).toBe(true)
  close.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  expect(key(close, 'Enter', { repeat: true }).defaultPrevented).toBe(false)
})

test('a held Enter acts once: its repeats are dropped in the sheet it opened and never reopen it from More', async () => {
  const root = await shell(7)
  const tab = more(root)!
  expect(key(tab, 'Enter', { repeat: true }).defaultPrevented).toBe(true)
  expect(key(tab, 'Enter').defaultPrevented).toBe(false)
  expect(key(tab, ' ', { repeat: true }).defaultPrevented).toBe(false)
  const panel = await openMore(root)
  expect(key(panel.querySelector('.ui-sheet__header button')!, 'Enter', { repeat: true }).defaultPrevented).toBe(true)
})

test('the second click of a double tap on the backdrop does not reach Sheet\'s own backdrop close (browsers without closedby); a single click does', async () => {
  const root = await shell(7)
  const panel = await openMore(root)
  panel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  click(panel, 2)
  await settle()
  expect(panel.hasAttribute('open')).toBe(true)
  panel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  click(panel)
  await settle()
  expect(panel.hasAttribute('open')).toBe(false)
})

test('a current page behind More marks More; one in the bar does not', async () => {
  const root = await shell(7, { path: '/area-6' })
  expect(more(root)!.getAttribute('aria-current')).toBe('true')
  expect(sheetLinks(root)[1]!.getAttribute('aria-current')).toBe('page')
  await router.push('/area-2')
  await settle()
  expect(more(root)!.hasAttribute('aria-current')).toBe(false)
})

test('a footer that appears, or an item added in place, marks More at once when the current page goes behind it', async () => {
  let root = await shell(5, { path: '/area-5' })
  expect(more(root)).toBeNull()
  state.footer = true
  await settle()
  expect(more(root)!.getAttribute('aria-current')).toBe('true')
  view?.unmount()
  root = await shell(5, { path: '/area-6' })
  state.nav.push({ label: 'Area 6', icon: 'home', to: '/area-6' })
  await settle()
  expect(more(root)!.getAttribute('aria-current')).toBe('true')
})

test('the footer is one node: in the sheet on phones, in the nav elsewhere', async () => {
  viewport(phoneQuery)
  let root = await shell(5, { footer: true })
  expect(root.querySelectorAll('.version').length).toBe(1)
  expect(sheet(root).querySelector('.version')).not.toBeNull()
  view?.unmount()
  viewport()
  root = await shell(5, { footer: true })
  expect(root.querySelectorAll('.version').length).toBe(1)
  expect(root.querySelector('.ui-app-shell__nav-footer .version')?.closest('dialog')).toBeNull()
})

test('crossing 48rem with the sheet open closes it; a focused footer field moves with its text and keeps focus', async () => {
  const media = viewport(phoneQuery)
  const root = await shell(7, { footer: true })
  const panel = await openMore(root)
  const field = panel.querySelector<HTMLInputElement>('.note')!
  field.value = 'typed'
  field.focus()
  media.flip(phoneQuery)
  await settle()
  expect(panel.hasAttribute('open')).toBe(false)
  expect(more(root)!.getAttribute('aria-expanded')).toBe('false')
  expect(root.querySelector('.note')).toBe(field)
  expect(field.closest('dialog')).toBeNull()
  expect(field.value).toBe('typed')
  expect(document.activeElement).toBe(field)
  media.flip(phoneQuery)
  await settle()
  expect(field.closest('dialog')).toBe(panel)
  expect(field.value).toBe('typed')
  expect(document.activeElement).toBe(more(root))
})

test('crossing 48rem up with focus on a sheet link sends it to the current link', async () => {
  const media = viewport(phoneQuery)
  const root = await shell(7, { path: '/area-6' })
  await openMore(root)
  sheetLinks(root)[0]!.focus()
  media.flip(phoneQuery)
  await settle()
  expect(document.activeElement).toBe(navLink(root, 6))
})

test('crossing 48rem up with focus on More on a page no item leads to sends it to the first link', async () => {
  const media = viewport(phoneQuery)
  const root = await shell(7, { path: '/elsewhere' })
  more(root)!.focus()
  media.flip(phoneQuery)
  await settle()
  expect(document.activeElement).toBe(navLink(root, 1))
})

test('crossing 48rem closes a popover and a dialog open in the footer before the footer moves', async () => {
  const media = viewport()
  const root = await shell(7, { footer: true })
  const tip = root.querySelector<HTMLElement>('.tip')!
  const about = root.querySelector<HTMLDialogElement>('.about')!
  for (const step of ['down', 'up']) {
    if (step === 'up') await openMore(root)
    tip.showPopover()
    about.showModal()
    media.flip(phoneQuery)
    await settle()
    expect(tip.matches(':popover-open'), step).toBe(false)
    expect(about.hasAttribute('open'), step).toBe(false)
  }
})

test('crossing 48rem down with focus on an item past the fourth sends it to More', async () => {
  const media = viewport()
  const root = await shell(7, { path: '/area-2' })
  navLink(root, 7).focus()
  media.flip(phoneQuery)
  await settle()
  expect(document.activeElement).toBe(more(root))
})

test('crossing 48rem leaves focus outside the nav to the page, also when the page hides its element', async () => {
  const media = viewport()
  const root = await shell(7, { footer: true })
  const outside = document.createElement('button')
  outside.dataset['hideOnPhone'] = ''
  document.body.append(outside)
  outside.focus()
  media.flip(phoneQuery)
  await settle()
  expect(document.activeElement).toBe(outside)
  expect(more(root)).not.toBeNull()
})

test('focus the browser drops from a tab hidden by a resize goes to its door; a blur of a shown tab stays a blur', async () => {
  const media = viewport(phoneQuery)
  const root = await shell(7, { path: '/area-6' })
  more(root)!.focus()
  more(root)!.blur()
  expect(document.activeElement).toBe(document.body)
  more(root)!.focus()
  matching.delete(phoneQuery)
  more(root)!.blur()
  expect(document.activeElement).toBe(navLink(root, 6))
  matching.add(phoneQuery)
  media.flip(phoneQuery)
  await settle()
  expect(document.activeElement).toBe(navLink(root, 6))
  // Focus that leaves a hidden tab for a place of the user's choosing stays there.
  const outside = document.createElement('button')
  document.body.append(outside)
  matching.add(phoneQuery)
  more(root)!.focus()
  matching.delete(phoneQuery)
  outside.focus()
  expect(document.activeElement).toBe(outside)
})

test('the rail shows each name in a label tooltip at its end while its query matches and stops listening on unmount; no title attribute', async () => {
  const media = viewport(railQuery)
  const root = await shell(3)
  const links = [...root.querySelectorAll<HTMLElement>('.ui-app-shell__nav > a')]
  expect(links.every(link => link.querySelector('.ui-tooltip') !== null)).toBe(true)
  expect(links.some(link => link.hasAttribute('title'))).toBe(false)
  links[1]!.focus()
  await settle()
  const panel = links[1]!.querySelector<HTMLElement>('[role="tooltip"]')!
  expect(panel.textContent).toBe('Area 2')
  expect(panel.dataset['placement']).toBe('end')
  expect(links[1]!.hasAttribute('aria-describedby')).toBe(false)
  links[1]!.blur()
  media.flip(railQuery)
  await settle()
  expect(root.querySelectorAll('.ui-tooltip').length).toBe(0)
  expect(media.listening(railQuery)).toBe(1)
  view?.unmount()
  view = undefined
  expect(media.listening(railQuery)).toBe(0)
  expect(media.listening(phoneQuery)).toBe(0)
})

test('the skip link, the nav and More are named by ui.* keys in the current locale', async () => {
  const root = await shell(7)
  locale.value = 'de'
  await settle()
  expect(root.querySelector('.ui-app-shell__skip')?.textContent).toBe(messages.de.ui.skipToContent)
  expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe(messages.de.ui.mainNav)
  expect(more(root)!.textContent?.trim()).toBe(messages.de.ui.more)
  expect(sheet(root).getAttribute('aria-label') ?? sheet(root).querySelector('h2')?.textContent).toBe(messages.de.ui.more)
})
