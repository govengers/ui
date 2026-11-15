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

export interface MarkdownRendererOptions {
  /** Origins images may load from besides the page's own, e.g. `https://files.example` for a storage host. */
  imageHosts?: readonly string[] | undefined
}

/**
 * An image source: the page's origin (relative or absolute), an origin of `hosts`, blob (a fresh
 * paste) or a raster data URL; never SVG or HTML data. Markdown written by someone else must not
 * make the reader's browser call a foreign host (tracking, exfiltration through the URL).
 */
function safeImage(src: string, origin: string, hosts: readonly string[]): boolean {
  if (/^data:/i.test(src)) return /^data:image\/(png|jpeg|gif|webp);/i.test(src)
  if (/^blob:https?:/i.test(src)) return true
  if (!/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return true // relative to the page
  try {
    const url = new URL(src)
    return (url.protocol === 'https:' || url.protocol === 'http:') && (url.origin === origin || hosts.includes(url.origin))
  } catch {
    return false
  }
}

/**
 * A render function bound to one window: the browser's in an app, a test DOM's in a test.
 * Without a window (SSR) or a DOM DOMPurify can work on, it shows the escaped text.
 */
export function createMarkdownRenderer(window: (WindowLike & { location?: { origin: string } }) | undefined, options: MarkdownRendererOptions = {}): (source: string) => string {
  const escaped = (source: string): string => `<p>${escapeHtml(source)}</p>`
  if (window === undefined) return escaped
  const purify = createPurifier(window)
  // Without a working DOM, DOMPurify would hand the HTML back unsanitised: show the text instead.
  if (!purify.isSupported) return escaped
  const origin = window.location?.origin ?? ''
  const hosts = options.imageHosts ?? []
  // DOMPurify's URL rule has no blob: (a pasted image before its upload answers); keep it on images only.
  purify.addHook('uponSanitizeAttribute', (node, data) => {
    if (node.nodeName === 'IMG' && data.attrName === 'src' && /^blob:https?:/i.test(data.attrValue)) data.forceKeepAttr = true
  })
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName === 'IMG' && !safeImage((node as Element).getAttribute('src') ?? '', origin, hosts)) (node as Element).removeAttribute('src')
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
