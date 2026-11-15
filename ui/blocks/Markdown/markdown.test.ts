import { describe, expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import type { WindowLike } from 'dompurify'
import { createMarkdownRenderer, escapeHtml } from './markdown'

// jsdom, not happy-dom: DOMPurify supports jsdom, and happy-dom let javascript: URLs through.
const { window } = new JSDOM('', { url: 'https://app.example/board' })
const render = createMarkdownRenderer(window as unknown as WindowLike & { location: { origin: string } })

describe('createMarkdownRenderer', () => {
  test('renders headings, task lists, tables and code', () => {
    const html = render('# Plan\n\n- [ ] open\n- [x] done\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```js\nx < 1\n```')
    expect(html).toContain('<h1>Plan</h1>')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('checked')
    expect(html).toContain('<table>')
    expect(html).toContain('<code class="language-js">x &lt; 1')
  })

  test('drops script URLs and event handlers', () => {
    const html = render('[x](javascript:alert(1)) [y](JaVaScRiPt:alert(1)) ![i](data:text/html,x "t") [z](data:text/html;base64,PHNjcmlwdD4=)')
    const dom = new JSDOM(html).window.document
    expect(html).not.toMatch(/javascript:/i)
    expect(dom.querySelector('[href^="data:"], [src^="data:text"]')).toBeNull()
    expect(dom.querySelectorAll('a')).toHaveLength(3)
  })

  test('shows raw HTML as text', () => {
    const html = render('<script>alert(1)</script>\n\nhi <img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  test('opens foreign links in a new tab without opener, keeps own links', () => {
    const html = render('[ext](https://other.example/a) [own](/tasks/1)')
    expect(html).toContain('<a href="https://other.example/a" target="_blank" rel="noopener noreferrer nofollow">ext</a>')
    expect(html).toContain('<a href="/tasks/1">own</a>')
  })

  test('keeps images with safe sources only', () => {
    expect(render('![chart](https://img.example/a.png)')).toContain('<img src="https://img.example/a.png" alt="chart">')
    expect(render('![p](data:image/png;base64,iVBO)')).toContain('src="data:image/png;base64,iVBO"')
    expect(render('![s](data:image/svg+xml;base64,PHN2Zz4=)')).not.toContain('src=')
    expect(render('![b](blob:https://app.example/1f2e)')).toContain('src="blob:https://app.example/1f2e"')
    expect(render('[b](blob:https://app.example/1f2e)')).not.toContain('blob:')
  })

  test('without a DOM it shows the text, never unsanitised HTML', () => {
    const bare = createMarkdownRenderer({} as WindowLike)
    expect(bare('<b>x</b> **y**')).toBe('<p>&lt;b&gt;x&lt;/b&gt; **y**</p>')
  })
})

test('escapeHtml', () => {
  expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
})
