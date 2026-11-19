// bun test preload (bunfig.toml, D69): a jsdom document as the global DOM and a loader that
// compiles .vue files, so a test can mount a piece and drive it like a user (scripts/test/mount.ts).
// Styles are not compiled: layout, scrolling and CSS states stay with the browser probes.
import { plugin } from 'bun'
import { afterEach, jest } from 'bun:test'
import { JSDOM } from 'jsdom'
import { compileScript, parse } from 'vue/compiler-sfc'
import { TestResizeObserver } from './resize'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example/', pretendToBeVisual: true })
const view = dom.window as unknown as Record<string, unknown>
const globals = globalThis as Record<string, unknown>
// The DOM names the pieces and tests use; bun's own Event classes cannot be dispatched on jsdom nodes.
for (const name of [
  'window', 'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'Node', 'Document', 'Element', 'HTMLElement', 'SVGElement', 'MathMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLDialogElement', 'Text', 'Comment', 'DocumentFragment', 'ShadowRoot', 'MutationObserver', 'Storage', 'DOMException',
  'HTMLAnchorElement', 'HTMLButtonElement', 'HTMLFormElement', 'HTMLSelectElement',
  'Event', 'CustomEvent', 'UIEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'FocusEvent', 'InputEvent', 'ClipboardEvent',
]) {
  if (view[name] !== undefined) globals[name] = view[name]
}
// What jsdom lacks and the pieces call: CSS.escape, the popover API, element scrolling, hit testing,
// media queries (matchMedia answers "no match" to every query).
globals['CSS'] = { escape: (value: string) => value.replace(/["\\]/g, '\\$&'), supports: () => false }
const proto = dom.window.HTMLElement.prototype as unknown as Record<string, unknown>
for (const name of ['showPopover', 'hidePopover', 'togglePopover', 'scrollIntoView']) proto[name] ??= () => undefined
const elementProto = dom.window.Element.prototype as unknown as Record<string, unknown>
elementProto['scrollTo'] ??= () => undefined
view['matchMedia'] ??= (media: string) => ({ media, matches: false, onchange: null, addEventListener: () => undefined, removeEventListener: () => undefined })
globals['matchMedia'] = view['matchMedia']
dom.window.document.execCommand = () => false
dom.window.document.elementFromPoint = () => null
// No modal dialog either: showModal() and close() work by the attribute and close fires at once (no
// top layer, no inert page, no focus moved). No ResizeObserver: the stand-in of resize.ts.
const dialogProto = dom.window.HTMLDialogElement.prototype as unknown as Record<string, unknown>
dialogProto['showModal'] ??= function (this: HTMLDialogElement) { this.setAttribute('open', '') }
dialogProto['close'] ??= function (this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return
  this.removeAttribute('open')
  this.dispatchEvent(new dom.window.Event('close'))
}
globals['ResizeObserver'] = TestResizeObserver
// Animation frames are one timeout each, on whatever clock the test runs. jsdom runs its frames on
// one Node interval that it starts on demand and keeps while work is pending: started under a
// test's fake timers, it dies with them, and no frame runs again for the rest of the run.
view['requestAnimationFrame'] = globals['requestAnimationFrame'] = (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16)
view['cancelAnimationFrame'] = globals['cancelAnimationFrame'] = (handle: number) => clearTimeout(handle)

// Every test ends in the same state, whatever it or its file left behind (runs after the file's own
// afterEach): timers are real, nothing holds focus, views it did not unmount are unmounted (their
// timers and document listeners end with them), and the body, the storage and the toast queue
// (module-wide) are empty. Timers and focus first: removing a focused node makes jsdom start its
// focus fixup on whatever clock runs, and a fake one would leave it dead. Imported here, not at
// the top: a static import would load Vue before the globals above exist.
afterEach(async () => {
  jest.useRealTimers()
  const active = dom.window.document.activeElement
  if (active instanceof dom.window.HTMLElement && active !== dom.window.document.body) active.blur()
  const [{ unmountAll }, { toasts }] = await Promise.all([import('./mount'), import('../../ui/Toast/toast')])
  unmountAll()
  dom.window.document.body.replaceChildren()
  toasts.splice(0)
  dom.window.localStorage.clear()
  dom.window.sessionStorage.clear()
})

let next = 0
plugin({
  name: 'vue-sfc',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor, errors } = parse(await Bun.file(path).text(), { filename: path })
      if (errors.length > 0) throw errors[0]
      const script = compileScript(descriptor, { id: `t${next++}`, inlineTemplate: true })
      return { contents: script.content, loader: descriptor.scriptSetup?.lang === 'ts' || descriptor.script?.lang === 'ts' ? 'ts' : 'js' }
    })
  },
})
