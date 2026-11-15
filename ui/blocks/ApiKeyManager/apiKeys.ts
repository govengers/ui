// The ApiKeyManager's rules without the view: the row shape, its state, the expiry choices.

/** An API key as its owner sees it: never the secret, only the non-secret prefix. */
export interface ApiKeyRow {
  id: string
  name: string
  /** The non-secret start of the key ("holo_01JX..."), to recognise it. */
  prefix: string
  /** Permissions in text form, "tasks:write". */
  scopes: readonly string[]
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

/** A scope the user may grant; `value` is the permission text ("tasks:read"). */
export interface ApiKeyScope {
  value: string
  label: string
  description?: string | undefined
}

export type ApiKeyState = 'active' | 'expiring' | 'expired'

const day = 86_400_000

/** Expired once its time passed, expiring within 7 days, else active; no expiry is active. */
export function keyState(key: Pick<ApiKeyRow, 'expiresAt'>, now: number): ApiKeyState {
  if (key.expiresAt === null) return 'active'
  const left = Date.parse(key.expiresAt) - now
  if (left <= 0) return 'expired'
  return left <= 7 * day ? 'expiring' : 'active'
}

/** The expiry a choice of days means: null for never (0), else the end of that day span from now. */
export function expiresAtFor(days: number, now: number): string | null {
  return days === 0 ? null : new Date(now + days * day).toISOString()
}

/** Newest first; the list is read whole, so the order is the block's. */
export function newestFirst<Key extends Pick<ApiKeyRow, 'createdAt'>>(keys: readonly Key[]): Key[] {
  return [...keys].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
