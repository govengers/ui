// The renderer behind MarkdownView (D56): marked turns GitHub-flavoured markdown into HTML, a
// private DOMPurify instance sanitises it. Raw HTML in the source is shown as text, never parsed;
// a link that leaves the page's origin opens in a new tab without access to its opener.
import createPurifier, { type WindowLike } from 'dompurify'
import { Marked } from 'marked'

const escapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => escapes[char] ?? char)
}

// A dedicated instance: the module singleton can answer a Promise once an async extension is
// registered anywhere in the app, and v-html then shows "[object Promise]".
const parser = new Marked({ async: false, gfm: true, breaks: true })
parser.use({ renderer: { html: ({ text }) => escapeHtml(text) } })

/** An image source: relative, http(s), blob (a fresh paste) or a raster data URL; never SVG or HTML data. */
function safeImage(src: string): boolean {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(src)?.[1]?.toLowerCase()
  if (scheme === undefined || scheme === 'http' || scheme === 'https' || scheme === 'blob') return true
  return /^data:image\/(png|jpeg|gif|webp);/i.test(src)
}

/** A render function bound to one window: the browser's in an app, a test DOM's in a test. */
export function createMarkdownRenderer(window: WindowLike & { location?: { origin: string } }): (source: string) => string {
  const purify = createPurifier(window)
  // Without a working DOM, DOMPurify would hand the HTML back unsanitised: show the text instead.
  if (!purify.isSupported) return (source) => `<p>${escapeHtml(source)}</p>`
  const origin = window.location?.origin ?? ''
  // DOMPurify's URL rule has no blob: (a pasted image before its upload answers); keep it on images only.
  purify.addHook('uponSanitizeAttribute', (node, data) => {
    if (node.nodeName === 'IMG' && data.attrName === 'src' && /^blob:https?:/i.test(data.attrValue)) data.forceKeepAttr = true
  })
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName === 'IMG' && !safeImage((node as Element).getAttribute('src') ?? '')) (node as Element).removeAttribute('src')
    if (node.nodeName !== 'A' || !(node as Element).hasAttribute('href')) return
    const link = node as Element
    let external = true
    try {
      external = new URL(link.getAttribute('href') ?? '', origin || undefined).origin !== origin
    } catch {
      external = true // an unparsable href is treated as foreign
    }
    if (!external) return
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer nofollow')
  })
  return (source) => purify.sanitize(parser.parse(source) as string)
}
