// FeedbackCapture's data: a ring buffer of recent console output, uncaught errors and failed
// requests (installed once in main.ts), the environment, and the report exactly as it is sent.
// Everything is redacted when it enters the buffer (redact.ts), so a secret never sits in memory
// longer than the console line that printed it.
import { redactText, redactUrl, redactValue } from './redact'

export type ConsoleLevel = 'error' | 'warn' | 'info' | 'log'

export interface ConsoleEntry {
  kind: 'console'
  level: ConsoleLevel | 'uncaught'
  at: string
  text: string
}

export interface RequestEntry {
  kind: 'request'
  at: string
  method: string
  url: string
  /** The answer's status, null when the request failed without one (offline, CORS). */
  status: number | null
  error: string | null
  ms: number
}

export type FeedbackEntry = ConsoleEntry | RequestEntry

export interface FeedbackBuffer {
  /** A copy of the entries, oldest first. */
  entries(): FeedbackEntry[]
  /** Adds an entry (a failed socket call, say), redacted and clipped like the recorded ones. */
  push(entry: FeedbackEntry): void
  clear(): void
  /** Puts console and fetch back as they were. */
  uninstall(): void
}

/** What the buffer patches: window in the browser, a fake in tests. */
export interface FeedbackHost {
  console: Pick<Console, ConsoleLevel>
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  addEventListener?: (type: string, listener: (event: never) => void) => void
  removeEventListener?: (type: string, listener: (event: never) => void) => void
}

export interface FeedbackBufferOptions {
  /** Entries kept; the oldest drops out (default 50). */
  size?: number
  /** Console levels recorded (default error and warn). */
  levels?: ConsoleLevel[]
  /** Default globalThis; a host given here gets its own buffer, not the shared one. */
  host?: FeedbackHost
  now?: () => number
}

const maxText = 2000
let shared: FeedbackBuffer | undefined

function clip(text: string): string {
  return text.length > maxText ? `${text.slice(0, maxText)}... [${text.length - maxText} more]` : text
}

// Cut before scrubbing so one huge console line costs little; a value the cut splits is still
// masked (an open quote or bracket runs to the end).
function scrub(text: string): string {
  return redactText(text.length > 4 * maxText ? text.slice(0, 4 * maxText) : text)
}

function describe(value: unknown): string {
  if (typeof value === 'string') return scrub(value)
  if (value instanceof Error) return scrub(`${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`)
  try {
    return JSON.stringify(redactValue(value)) ?? String(value)
  } catch {
    return '[unserializable]'
  }
}

/**
 * Starts recording. Called again without a host (hot reload), it answers the buffer already
 * installed instead of wrapping console twice.
 */
export function installFeedbackBuffer(options: FeedbackBufferOptions = {}): FeedbackBuffer {
  if (options.host === undefined && shared !== undefined) return shared
  const host = options.host ?? (globalThis as unknown as FeedbackHost)
  const size = options.size ?? 50
  const now = options.now ?? Date.now
  const stamp = (): string => new Date(now()).toISOString()
  const ring: FeedbackEntry[] = []
  const push = (entry: FeedbackEntry): void => {
    ring.push(entry)
    if (ring.length > size) ring.splice(0, ring.length - size)
  }
  const record = (level: ConsoleEntry['level'], values: unknown[]): void => {
    try {
      push({ kind: 'console', level, at: stamp(), text: clip(values.map(describe).join(' ')) })
    } catch {
      // recording must never break the code that logged
    }
  }

  const originals = new Map<ConsoleLevel, (...values: unknown[]) => void>()
  for (const level of options.levels ?? ['error', 'warn']) {
    const original = host.console[level]
    originals.set(level, original)
    host.console[level] = (...values: unknown[]) => {
      record(level, values)
      original.apply(host.console, values)
    }
  }

  const originalFetch = host.fetch
  if (originalFetch !== undefined) {
    host.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const started = now()
      const method = (init?.method ?? (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase()
      const url = clip(scrub(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url))
      const entry = (status: number | null, error: string | null): RequestEntry => ({ kind: 'request', at: stamp(), method, url, status, error, ms: now() - started })
      try {
        const response = await Reflect.apply(originalFetch, host, [input, init]) as Response
        if (!response.ok) push(entry(response.status, null))
        return response
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) push(entry(null, clip(describe(error instanceof Error ? error.message : error))))
        throw error
      }
    }
  }

  const onError = (event: { message?: string; error?: unknown; filename?: string; lineno?: number }): void =>
    record('uncaught', [event.error ?? `${event.message ?? 'error'}${event.filename ? ` at ${event.filename}:${event.lineno ?? 0}` : ''}`])
  const onRejection = (event: { reason?: unknown }): void => record('uncaught', ['Unhandled rejection:', event.reason])
  host.addEventListener?.('error', onError)
  host.addEventListener?.('unhandledrejection', onRejection)

  const buffer: FeedbackBuffer = {
    entries: () => ring.map((item) => ({ ...item })),
    push: (entry) => push(entry.kind === 'console'
      ? { ...entry, text: clip(scrub(entry.text)) }
      : { ...entry, url: clip(scrub(entry.url)), error: entry.error === null ? null : clip(scrub(entry.error)) }),
    clear: () => { ring.length = 0 },
    uninstall: () => {
      for (const [level, original] of originals) host.console[level] = original
      if (originalFetch !== undefined) host.fetch = originalFetch
      host.removeEventListener?.('error', onError)
      host.removeEventListener?.('unhandledrejection', onRejection)
      if (shared === buffer) shared = undefined
    },
  }
  if (options.host === undefined) shared = buffer
  return buffer
}

/** The buffer installFeedbackBuffer() put on the page, if any. */
export function feedbackBuffer(): FeedbackBuffer | undefined {
  return shared
}

export interface FeedbackEnvironment {
  /** The page, every query and fragment value masked. */
  url: string
  userAgent: string
  language: string
  timezone: string
  /** `1280x720`. */
  viewport: string
  screen: string
  pixelRatio: number
  colorScheme: 'light' | 'dark'
  online: boolean
  version: string | null
  at: string
}

export type EnvironmentHost = Pick<Window, 'location' | 'navigator' | 'innerWidth' | 'innerHeight' | 'screen' | 'devicePixelRatio' | 'matchMedia'>

export function collectEnvironment(version?: string, host: EnvironmentHost = window, now: () => number = Date.now): FeedbackEnvironment {
  return {
    url: redactUrl(host.location.href),
    userAgent: host.navigator.userAgent,
    language: host.navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${host.innerWidth}x${host.innerHeight}`,
    screen: `${host.screen.width}x${host.screen.height}`,
    pixelRatio: host.devicePixelRatio,
    colorScheme: host.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    online: host.navigator.onLine,
    version: version ?? null,
    at: new Date(now()).toISOString(),
  }
}

export type FeedbackType = 'bug' | 'idea' | 'question'
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical'

/** The body of the send mutation, exactly as the preview shows it. */
export interface FeedbackReport {
  type: FeedbackType
  text: string
  /** Bugs only. */
  severity: FeedbackSeverity | null
  /** Null when the user left the technical details out. */
  environment: FeedbackEnvironment | null
  entries: FeedbackEntry[]
  /** A data URL, null without one. */
  screenshot: string | null
}

/** What the dialog froze when it opened. */
export interface FeedbackSnapshot {
  environment: FeedbackEnvironment
  entries: FeedbackEntry[]
  screenshot: string | null
}

/**
 * Runs the screenshot hook, giving up after `ms` (default 3 s): a slow or hanging hook must not
 * keep the dialog from opening. A failure or a timeout answers null.
 */
export async function runScreenshotHook(hook: () => Promise<string | null | undefined>, ms = 3000, timer: (done: () => void, ms: number) => unknown = setTimeout): Promise<string | null> {
  const timeout = new Promise<null>((resolve) => { timer(() => resolve(null), ms) })
  try {
    return (await Promise.race([hook(), timeout])) ?? null
  } catch {
    return null
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const item of Object.values(value)) deepFreeze(item)
  }
  return value
}

/** The report from the form and the frozen snapshot; frozen itself, so what is previewed is what is sent. */
export function buildReport(
  form: { type: FeedbackType; text: string; severity: FeedbackSeverity },
  snapshot: FeedbackSnapshot,
  include: { technical: boolean; screenshot: boolean },
): FeedbackReport {
  return deepFreeze({
    type: form.type,
    text: form.text.trim(),
    severity: form.type === 'bug' ? form.severity : null,
    environment: include.technical ? structuredClone(snapshot.environment) : null,
    entries: include.technical ? structuredClone(snapshot.entries) : [],
    screenshot: include.screenshot ? snapshot.screenshot : null,
  })
}

/** The report as the preview prints it: the screenshot as a size note, it shows as an image below. */
export function previewText(report: FeedbackReport): string {
  const screenshot = report.screenshot === null ? null : `[image, ${Math.ceil(report.screenshot.length / 1024)} KB, shown below]`
  return JSON.stringify({ ...report, screenshot }, null, 2)
}
