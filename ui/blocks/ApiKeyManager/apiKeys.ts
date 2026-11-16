// The ApiKeyManager's rules without the view: the row shape, its state, the expiry choices.
import { watch, type ComputedRef } from 'vue'
import type { LiveConnection } from '@/api/runtime'
import { useLiveStatus } from '@/api/vue'

/** An API key as its owner sees it: never the secret, only the non-secret prefix. */
export interface ApiKeyRow {
  id: string
  name: string
  /** The non-secret start of the key ("demo_01JX..."), to recognise it. */
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

/**
 * Counts the create dialog's attempts: `begin` marks one, `forget` (close, another identity)
 * makes every earlier one stale, so a create answering late cannot bring a forgotten secret back.
 */
export function attempts(): { begin(): () => boolean; forget(): void } {
  let current = 0
  return {
    begin: () => {
      const mine = current
      return () => mine === current
    },
    forget: () => { current += 1 },
  }
}

/**
 * Runs `forget` when the connection a secret was created on stops serving: another pair (logout,
 * switch, impersonation) or its end (a 4401 while /auth/me is unreadable keeps the ended pair).
 */
export function forgetWhenGone(connection: ComputedRef<LiveConnection>, forget: () => void): void {
  const status = useLiveStatus(connection)
  watch(connection, forget)
  watch(status, (now) => { if (now === 'ended') forget() })
}
