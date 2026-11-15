// Credential redaction for everything FeedbackCapture sends: object keys that name a secret are
// masked at any depth (their whole subtree), and text is scrubbed of bearer tokens, JWTs, URL
// user info and `key=value` / `"key": "value"` pairs whose key names a secret. Over-redacting is
// the accepted trade: a field called `sessionCount` is masked too.

export const redacted = '[redacted]'

// Matched against the key lowercased without - and _ ("api_key" is "apikey").
const secretParts = ['password', 'passwd', 'passphrase', 'secret', 'token', 'authorization', 'cookie', 'session', 'credential', 'apikey', 'privatekey', 'signature', 'csrf', 'xsrf']
const secretWords = new Set(['pwd', 'auth', 'otp', 'totp', 'sid', 'jwt'])

/** Whether a key names a credential. */
export function secretKey(key: string): boolean {
  const flat = key.toLowerCase().replace(/[-_\s]/g, '')
  return secretWords.has(flat) || secretParts.some((part) => flat.includes(part))
}

const keyPattern = String.raw`[A-Za-z0-9_-]*(?:password|passwd|passphrase|secret|token|authorization|cookie|session|credential|api[-_]?key|private[-_]?key|signature|csrf|xsrf)[A-Za-z0-9_-]*|pwd|auth|otp|totp|sid|jwt`
// key, optional closing quote, = or :, then a quoted value (kept quoted) or a bare one, with its
// auth scheme ("Authorization: Bearer x" loses both words).
const pairs = new RegExp(String.raw`(["']?)\b(${keyPattern})\b\1(\s*[:=]\s*)(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|(?:(?:Bearer|Basic|Token)\s+)?[^\s&,;"'}\]]+)`, 'gi')
const schemes = /\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{6,}/gi
const userinfo = /\b([a-z][a-z0-9+.-]*:\/\/)[^/\s@]+@/gi
const jwts = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g

/** Scrubs credentials out of free text, URLs and serialized JSON. */
export function redactText(text: string): string {
  return text
    .replace(userinfo, `$1${redacted}@`)
    .replace(jwts, redacted)
    .replace(pairs, (match: string, quote: string, key: string, separator: string) => {
      const value = match.slice(quote.length * 2 + key.length + separator.length)
      if (value === redacted || value === `"${redacted}"`) return match
      const wrap = value.startsWith('"') ? '"' : value.startsWith("'") ? "'" : ''
      return `${quote}${key}${quote}${separator}${wrap}${redacted}${wrap}`
    })
    .replace(schemes, `$1 ${redacted}`)
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
