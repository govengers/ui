// Credential redaction for everything FeedbackCapture sends: object keys that name a secret are
// masked at any depth (their whole subtree), text that is JSON is parsed and redacted as a value,
// and other text is scrubbed of bearer tokens, JWTs, URL user info and `key=value` /
// `"key": "value"` pairs whose key names a secret (a value that is an object or array goes with
// its whole subtree, header lines such as Cookie to the end of the line). Over-redacting is the
// accepted trade: a field called `sessionCount` is masked too.

export const redacted = '[redacted]'

// Matched against the key lowercased without - and _ ("api_key" is "apikey").
const secretParts = ['password', 'passwd', 'passphrase', 'passcode', 'secret', 'token', 'authorization', 'cookie', 'session', 'credential', 'apikey', 'privatekey', 'signature', 'csrf', 'xsrf']
const secretWords = new Set(['pwd', 'pass', 'pw', 'pin', 'auth', 'otp', 'totp', 'sid', 'jwt'])
// Header keys whose value runs to the end of the line ("Authorization: ApiKey x", "Cookie: a=1; b=2").
const headerKeys = new Set(['authorization', 'proxyauthorization', 'cookie', 'setcookie'])

/** Whether a key names a credential. */
export function secretKey(key: string): boolean {
  const flat = key.toLowerCase().replace(/[-_\s]/g, '')
  return secretWords.has(flat) || secretParts.some((part) => flat.includes(part))
}

// The key's prefix and suffix are bounded: an unbounded run made the pattern quadratic on long
// hyphenated text (60 KB took seconds).
const keyPattern = String.raw`[A-Za-z0-9_-]{0,40}(?:password|passwd|passphrase|passcode|secret|token|authorization|cookie|session|credential|api[-_]?key|private[-_]?key|signature|csrf|xsrf)[A-Za-z0-9_-]{0,40}|pwd|pass|pw|pin|auth|otp|totp|sid|jwt`
// key with an optional quote (escaped too: `\"key\"` in JSON carried in a string), = or :.
const pairs = new RegExp(String.raw`(\\*["']?)\b(${keyPattern})\b\1(\s*[:=]\s*)`, 'gi')
const quoted = /^\\*["']/
const bare = /(?:(?:Bearer|Basic|Token)\s+)?[^\s&,;"'}\]]+/iy
const schemes = /\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{6,}/gi
const userinfo = /\b([a-z][a-z0-9+.-]{0,30}:\/\/)[^/\s@]+@/gi
const jwts = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g

function lineEnd(text: string, from: number): number {
  const end = text.indexOf('\n', from)
  return end === -1 ? text.length : end
}

// The end of the object or array starting at `from`, strings skipped; unbalanced runs to the end.
function closing(text: string, from: number): number {
  let depth = 0
  let inString = false
  for (let at = from; at < text.length; at++) {
    const char = text[at]
    if (inString) {
      if (char === '\\') at++
      else if (char === '"') inString = false
    } else if (char === '"') inString = true
    else if (char === '{' || char === '[') depth++
    else if (char === '}' || char === ']') {
      depth--
      if (depth === 0) return at + 1
    }
  }
  return text.length
}

// The end of the quoted value starting at `from` with `opener` (a quote, maybe escaped); an
// unterminated one (the text was cut) runs to the end.
function quotedEnd(text: string, from: number, opener: string): number {
  if (opener.length > 1) {
    // shortcut: an escaped string ends at the next same escaped quote, so a quote escaped once more inside it ends it early; upgrade if such logs show up
    const end = text.indexOf(opener, from + opener.length)
    return end === -1 ? lineEnd(text, from) : end + opener.length
  }
  for (let at = from + 1; at < text.length; at++) {
    if (text[at] === '\\') at++
    else if (text[at] === opener) return at + 1
  }
  return text.length
}

function scrubPairs(text: string): string {
  let out = ''
  let last = 0
  pairs.lastIndex = 0
  for (let match = pairs.exec(text); match !== null; match = pairs.exec(text)) {
    const quote = match[1] ?? ''
    const key = match[2] ?? ''
    const start = match.index + match[0].length
    const rest = text.slice(start, start + 16)
    let end: number
    let mask: string
    if (rest.startsWith(redacted)) {
      end = start + redacted.length // already redacted
      mask = redacted
    } else if (rest.startsWith('{') || rest.startsWith('[')) {
      end = quote.startsWith('\\') ? lineEnd(text, start) : closing(text, start)
      mask = `${quote}${redacted}${quote}`
    } else if (quoted.test(rest)) {
      const opener = quoted.exec(rest)![0]
      end = quotedEnd(text, start, opener)
      mask = `${opener}${redacted}${opener}`
    } else if (headerKeys.has(key.toLowerCase().replace(/[-_]/g, '')) && match[3]!.includes(':')) {
      end = lineEnd(text, start)
      mask = redacted
    } else {
      bare.lastIndex = start
      end = start + (bare.exec(text)?.[0].length ?? 0)
      mask = end === start ? '' : redacted
    }
    out += text.slice(last, start) + mask
    last = end
    pairs.lastIndex = end
  }
  return out + text.slice(last)
}

function parsedJson(text: string): unknown {
  const trimmed = text.trim()
  if (!/^[[{]/.test(trimmed)) return undefined
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return undefined
  }
}

/** Scrubs credentials out of free text, URLs and serialized JSON (also JSON inside JSON). */
export function redactText(text: string): string {
  const json = parsedJson(text)
  if (json !== undefined) return JSON.stringify(redactValue(json))
  return scrubPairs(text.replace(userinfo, `$1${redacted}@`).replace(jwts, redacted)).replace(schemes, `$1 ${redacted}`)
}

/**
 * A redacted deep copy that is safe to serialize: secret keys masked, strings scrubbed, cycles
 * and depth beyond `depth` cut, errors as { name, message, stack }, functions and symbols named.
 */
export function redactValue(value: unknown, depth = 6, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return redactText(value)
  if (typeof value === 'function') return '[function]'
  if (typeof value === 'symbol' || typeof value === 'bigint') return String(value)
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[circular]'
  if (depth <= 0) return '[deep]'
  seen.add(value)
  try {
    if (value instanceof Error) return { name: value.name, message: redactText(value.message), stack: redactText(value.stack ?? '') }
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString()
    if (Array.isArray(value)) return value.map((item) => redactValue(item, depth - 1, seen))
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) out[key] = secretKey(key) ? redacted : redactValue(item, depth - 1, seen)
    return out
  } finally {
    seen.delete(value) // a shared, non-circular reference is copied again, not marked circular
  }
}

/**
 * The page URL for the environment: every query and fragment value masked (keys kept), user info
 * dropped. An OAuth `code` or a share link's `key` is a credential no key list knows.
 */
export function redactUrl(href: string): string {
  const at = href.search(/[?#]/)
  const head = redactText(at === -1 ? href : href.slice(0, at))
  return at === -1 ? head : head + href.slice(at).replace(/([?&#;][^=&#;]*=)[^&#;]*/g, `$1${redacted}`)
}
