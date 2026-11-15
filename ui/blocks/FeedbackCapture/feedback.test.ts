import { describe, expect, test } from 'bun:test'
import { buildReport, collectEnvironment, installFeedbackBuffer, previewText, type EnvironmentHost, type FeedbackHost, type FeedbackSnapshot } from './feedback'

function fakeHost(answer: (url: string) => Promise<Response>) {
  const printed: unknown[][] = []
  const listeners = new Map<string, (event: never) => void>()
  const host: FeedbackHost = {
    console: { error: (...values: unknown[]) => void printed.push(values), warn: (...values: unknown[]) => void printed.push(values), info: () => undefined, log: () => undefined },
    fetch: (input) => answer(String(input)),
    addEventListener: (type, listener) => void listeners.set(type, listener),
    removeEventListener: (type) => void listeners.delete(type),
  }
  return { host, printed, listeners }
}

const clock = () => Date.parse('2026-11-02T10:00:00Z')

describe('installFeedbackBuffer', () => {
  test('records redacted console lines and still prints them; a ring of size n', () => {
    const { host, printed } = fakeHost(async () => new Response())
    const buffer = installFeedbackBuffer({ host, size: 2, now: clock })
    host.console.error('login failed', { email: 'ada@example.com', password: 'hunter 2' })
    host.console.warn('token=abc123')
    host.console.error(new Error('boom'))
    expect(printed).toHaveLength(3)
    const entries = buffer.entries()
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({ kind: 'console', level: 'warn', at: '2026-11-02T10:00:00.000Z', text: 'token=[redacted]' })
    expect(entries[1]?.kind === 'console' && entries[1].text.startsWith('Error: boom')).toBe(true)
    buffer.clear()
    host.console.error('x', { password: 'p' })
    expect(buffer.entries()[0]).toMatchObject({ text: 'x {"password":"[redacted]"}' })
  })

  test('records failed requests with a redacted URL, not successful or aborted ones', async () => {
    const { host } = fakeHost(async (url) => {
      if (url.includes('offline')) throw new TypeError('Failed to fetch')
      if (url.includes('abort')) throw new DOMException('aborted', 'AbortError')
      return new Response(null, { status: url.includes('missing') ? 404 : 200 })
    })
    const buffer = installFeedbackBuffer({ host, now: clock })
    await host.fetch!('/api/ok')
    await host.fetch!('/api/missing?token=abc', { method: 'post' })
    await expect(host.fetch!('/api/offline')).rejects.toThrow('Failed to fetch')
    await expect(host.fetch!('/api/abort')).rejects.toThrow('aborted')
    expect(buffer.entries()).toEqual([
      { kind: 'request', at: '2026-11-02T10:00:00.000Z', method: 'POST', url: '/api/missing?token=[redacted]', status: 404, error: null, ms: 0 },
      { kind: 'request', at: '2026-11-02T10:00:00.000Z', method: 'GET', url: '/api/offline', status: null, error: 'Failed to fetch', ms: 0 },
    ])
  })

  test('uncaught errors and rejections; uninstall restores everything', () => {
    const { host, listeners } = fakeHost(async () => new Response())
    const original = host.console.error
    const buffer = installFeedbackBuffer({ host, now: clock })
    listeners.get('error')?.({ message: 'x is undefined', filename: 'app.js', lineno: 3 } as never)
    listeners.get('unhandledrejection')?.({ reason: { secret: 's' } } as never)
    expect(buffer.entries().map((entry) => entry.kind === 'console' && entry.text)).toEqual(['x is undefined at app.js:3', 'Unhandled rejection: {"secret":"[redacted]"}'])
    buffer.uninstall()
    expect(host.console.error).toBe(original)
    expect(listeners.size).toBe(0)
  })
})

describe('report', () => {
  const environment = collectEnvironment('2.4.1', {
    location: { href: 'https://app.example/customers?session=abc' },
    navigator: { userAgent: 'Test', language: 'en', onLine: true },
    innerWidth: 1280, innerHeight: 720, screen: { width: 1920, height: 1080 }, devicePixelRatio: 2,
    matchMedia: () => ({ matches: true }),
  } as unknown as EnvironmentHost, clock)
  const snapshot: FeedbackSnapshot = { environment, entries: [{ kind: 'console', level: 'error', at: 'now', text: 'boom' }], screenshot: 'data:image/png;base64,AAAA' }

  test('the environment is redacted', () => {
    expect(environment).toMatchObject({ url: 'https://app.example/customers?session=[redacted]', viewport: '1280x720', screen: '1920x1080', colorScheme: 'dark', version: '2.4.1' })
  })

  test('what is left out is not sent; severity only for bugs; frozen', () => {
    const bug = buildReport({ type: 'bug', text: '  It broke  ', severity: 'high' }, snapshot, { technical: true, screenshot: false })
    expect(bug).toMatchObject({ type: 'bug', text: 'It broke', severity: 'high', screenshot: null })
    expect(bug.entries).toHaveLength(1)
    expect(Object.isFrozen(bug.entries[0])).toBe(true)
    const idea = buildReport({ type: 'idea', text: 'More', severity: 'high' }, snapshot, { technical: false, screenshot: true })
    expect(idea).toMatchObject({ severity: null, environment: null, entries: [], screenshot: 'data:image/png;base64,AAAA' })
    expect(previewText(idea)).toContain('"screenshot": "[image, 1 KB, shown below]"')
  })
})
