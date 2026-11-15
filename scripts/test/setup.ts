// bun test preload (bunfig.toml, D59): a jsdom document as the global DOM and a loader that
// compiles .vue files, so a test can mount a piece and drive it like a user (scripts/test/mount.ts).
// Styles are not compiled: layout, scrolling and CSS states stay with the browser probes.
import { plugin } from 'bun'
import { JSDOM } from 'jsdom'
import { compileScript, parse } from 'vue/compiler-sfc'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.example/', pretendToBeVisual: true })
const view = dom.window as unknown as Record<string, unknown>
const globals = globalThis as Record<string, unknown>
// The DOM names the pieces and tests use; bun's own Event classes cannot be dispatched on jsdom nodes.
for (const name of [
  'window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'Node', 'Element', 'HTMLElement', 'SVGElement', 'MathMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLDialogElement', 'Text', 'Comment', 'DocumentFragment', 'ShadowRoot', 'MutationObserver', 'Storage', 'DOMException',
  'Event', 'CustomEvent', 'UIEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'FocusEvent', 'InputEvent', 'ClipboardEvent',
]) {
  if (view[name] !== undefined) globals[name] = view[name]
}
// What jsdom lacks and the pieces call: CSS.escape, the popover API, element scrolling.
globals['CSS'] = { escape: (value: string) => value.replace(/["\\]/g, '\\$&'), supports: () => false }
const proto = dom.window.HTMLElement.prototype as unknown as Record<string, unknown>
for (const name of ['showPopover', 'hidePopover', 'togglePopover', 'scrollIntoView']) proto[name] ??= () => undefined
dom.window.document.execCommand = () => false

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
