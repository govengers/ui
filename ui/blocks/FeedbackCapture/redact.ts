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
// key with an optional quote (escaped too: `\"key\"` in JSON carried in a string), = or :. The
// escape run is bounded (15 is JSON four times in a string): an unbounded one was quadratic on a
// long run of backslashes.
const pairs = new RegExp(String.raw`(\\{0,15}["']?)\b(${keyPattern})\b\1(\s*[:=]\s*)`, 'gi')
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

function* characters(text: string, from: number, to: number): Generator<[string, number]> {
  for (let at = from; at < to; at++) yield [text[at]!, at]
}

// The characters with one level of string escaping undone (`\x` reads as x), each with the
// position of its last character in the text (for a quote, the quote itself).
function* unescaped(chars: Iterable<[string, number]>): Generator<[string, number]> {
  let escaped = false
  for (const [char, at] of chars) {
    if (!escaped && char === '\\') escaped = true
    else {
      escaped = false
      yield [char, at]
    }
  }
}

// The end of the quoted value starting at `from` with `opener` (a quote, maybe escaped). An
// escaped string (JSON carried in a string) is read through as many levels of unescaping as its
// opener needs, so a quote escaped once more inside it does not end it. An unterminated value
// (the text was cut) runs to the end, an escaped one to the end of the line.
function quotedEnd(text: string, from: number, opener: string): number {
  const to = opener.length > 1 ? lineEnd(text, from) : text.length
  let chars: Iterable<[string, number]> = characters(text, from, to)
  for (let level = opener; level.length > 1; level = level.replace(/\\(.)/g, '$1')) chars = unescaped(chars)
  const quote = opener[opener.length - 1]
  let first = true
  let escape = false
  for (const [char, at] of chars) {
    if (first) first = false // the opener's own quote
    else if (escape) escape = false
    else if (char === '\\') escape = true
    else if (char === quote) return at + 1
  }
  return to
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
    let resume = 0
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
      // The closing quote can open the next key (`"Invalid password:","pin":"1"`): search on from it.
      if (end - start > opener.length) resume = opener.length
    } else if (headerKeys.has(key.toLowerCase().replace(/[-_]/g, '')) && match[3]!.includes(':')) {
      end = lineEnd(text, start)
      mask = redacted
    } else {
      bare.lastIndex = start
      end = start + (bare.exec(text)?.[0].length ?? 0)
      mask = redacted
    }
    // No value (`token:` as its own console argument): nothing to mask, and a marker here would
    // hide the value that follows from the scrub of the whole line.
    if (end === start) mask = ''
    out += text.slice(last, start) + mask
    last = end
    pairs.lastIndex = end - resume
  }
  return out + text.slice(last)
}

const trailingKey = new RegExp(String.raw`(\\{0,15}["']?)\b(?:${keyPattern})\b\1\s*[:=]\s*$`, 'i')

/** Whether text ends in a secret key and `:` or `=` (`'token:'`), so the value comes next. */
export function endsWithSecretKey(text: string): boolean {
  return trailingKey.test(text.slice(-200))
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

// Longer text is cut before it is scanned, so one huge value costs little; a value the cut splits
// is still masked (an open quote or bracket runs to the end).
const maxScan = 8000

/**
 * Scrubs credentials out of free text, URLs and serialized JSON (also JSON inside JSON). Text
 * longer than 8000 characters is cut to that length first.
 */
export function redactText(input: string): string {
  const text = input.length > maxScan ? input.slice(0, maxScan) : input
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

/**
 * A request URL: scrubbed like text, and the values of `code`, `key` and `state` masked too (an
 * OAuth callback's code and state, a share link's key). Other query values stay, a failed
 * request's `?filter=` or `?page=` is what a bug report needs.
 */
export function redactRequestUrl(url: string): string {
  return redactText(url).replace(/([?&#;])([^=&#;]*)=[^&#;]*/g, (pair, sep: string, name: string) => {
    const decoded = decodedName(name)
    return /^(?:code|key|state)$/i.test(decoded) || secretKey(decoded) ? `${sep}${name}=${redacted}` : pair
  })
}

// A parameter name percent-decoded (`%6Bey` is key); a malformed escape stays as written.
function decodedName(name: string): string {
  try {
    return decodeURIComponent(name.replace(/\+/g, ' '))
  } catch {
    return name
  }
}
