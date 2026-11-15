// session: the one place for login, logout, the current identity and the livewire pair against
// govengers/auth (D56). Every identity change ends the pair before the request that changes the
// cookie and builds the next pair from what GET /auth/me answers afterwards (livewire D66).
import { shallowRef, type ShallowRef } from 'vue'
import type { LivePair } from '@/api/runtime'

/** The public identity govengers/auth answers (auth.IdentityResponse), plus the impersonation end when the app adds it. */
export interface SessionIdentity {
  provider: string
  subject: string
  userId?: string | undefined
  username?: string | undefined
  name?: string | undefined
  email?: string | undefined
  picture?: string | undefined
  active: boolean
  roles: string[]
  /** Text form, "tasks:write". */
  permissions?: string[] | undefined
  /** Set while an admin acts as this identity. */
  impersonator?: SessionIdentity | undefined
  /** RFC 3339; when the app's /auth/me answers it, the banner counts down. */
  impersonationEndsAt?: string | undefined
}

/** A login that leaves the page: OIDC (`/auth/oidc/<name>`) or GitHub (`/auth/github`). */
export interface RedirectProvider {
  /** The identity's `provider` after this login: the OIDC provider's `Name` ("company" for /auth/oidc/company), "github" for GitHub. */
  name: string
  label: string
  /** The provider's PathPrefix; login is GET `<prefix>/login?return_to=`, logout GET `<prefix>/logout`. */
  prefix: string
}

/** A user the development login offers (GET /auth/dev/users answers `{ users: DevUser[] }`). */
export interface DevUser {
  id: string
  name: string
  /** A hint such as "admin" or "no projects". */
  description?: string | undefined
}

/** The second step a password login owes: a TOTP code, or enrolling TOTP first (TOTP required, none set up). */
export type LoginChallenge = 'totp' | 'totp_setup'

export interface PasswordCredentials {
  /** User name or email, whichever the auth provider accepts. */
  identifier: string
  password: string
  /** The second step: a TOTP code, or a backup code when `backupCode` is true. */
  code?: string | undefined
  backupCode?: boolean | undefined
}

export interface SessionPaths {
  me: string
  password: string
  impersonation: string
  dev: string
}

export interface SessionOptions {
  /** Builds the pair of one identity key ("" for nobody); pass `onUnauthorized` to the client and the connection. */
  createPair: (identity: string, onUnauthorized: () => void) => LivePair
  providers?: readonly RedirectProvider[] | undefined
  paths?: Partial<SessionPaths> | undefined
  /** Runs when a signed-in identity ended without the app asking (401, 4401, another tab): route to the login page. */
  onSignedOut?: (() => void) | undefined
  fetch?: typeof fetch | undefined
  /** Full-page navigation for redirect logouts; `location.assign` by default. */
  navigate?: ((href: string) => void) | undefined
}

/** A refusal of an auth route: its status and govengers/auth's closed `code` ("invalid_credentials"). */
export class AuthError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.code = code
  }
}

export interface Session {
  /** The pair livePlugin follows; replaced on every identity change. */
  pair: ShallowRef<LivePair>
  /** Who the session acts as; null for nobody. */
  identity: ShallowRef<SessionIdentity | null>
  /** Builds the pair of whoever GET /auth/me answers: at start and after a callback login. */
  resume(): Promise<void>
  /** Re-reads GET /auth/me: takes the fresh identity, replaces the pair only when its key changed (on tab or window focus and while impersonating by itself). */
  check(): Promise<void>
  /** Password login, then the TOTP step; answers auth's `challenge` when a second step is owed. */
  login(credentials: PasswordCredentials): Promise<{ challenge?: LoginChallenge }>
  logout(): Promise<void>
  /** The development users; [] when the server has no dev login (404). */
  devUsers(): Promise<DevUser[]>
  devLogin(id: string): Promise<void>
  impersonate(subject: string): Promise<void>
  stopImpersonating(): Promise<void>
  /** The href of a redirect provider's login that comes back to `redirect` (sanitised). */
  loginHref(provider: RedirectProvider, redirect?: unknown): string
}

/** govengers/auth's provider name of a dev login (auth.ProviderDev). */
const devProvider = 'dev_login'
const impersonationPoll = 60_000
const retryFirst = 1_000
const retryLast = 30_000

const defaultPaths: SessionPaths = { me: '/auth/me', password: '/auth/password', impersonation: '/auth/impersonation', dev: '/auth/dev' }

/** The pair key of an identity: an impersonation is another key than the same user signed in. */
export function identityKey(identity: SessionIdentity | null): string {
  if (identity === null) return ''
  const own = `${identity.provider}:${identity.subject}`
  return identity.impersonator ? `${identityKey(identity.impersonator)}>${own}` : own
}

/**
 * A same-origin path to go to after a login, else `fallback`: starts with one "/", no "//" or
 * "/\" (protocol-relative), no backslash or control characters, at most 2048 characters, the
 * same rule govengers/auth applies to `return_to`.
 */
export function safeRedirect(raw: unknown, fallback = '/'): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/')) return fallback
  if (value[1] === '/' || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return fallback
  const base = 'https://same.invalid'
  const parsed = new URL(value, base)
  return parsed.origin === base ? value : fallback
}

export function createSession(options: SessionOptions): Session {
  const paths = { ...defaultPaths, ...options.paths }
  const send = (path: string, init?: RequestInit): Promise<Response> => (options.fetch ?? fetch)(path, { credentials: 'same-origin', ...init })
  const navigate = options.navigate ?? ((href: string) => window.location.assign(href))

  const identity = shallowRef<SessionIdentity | null>(null)
  const pair = shallowRef<LivePair>(build(''))
  // Identity changes run one after the other, so no pair is live while a cookie changes.
  let transitions: Promise<unknown> = Promise.resolve()
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryDelay = 0
  let pollTimer: ReturnType<typeof setInterval> | undefined
  // A redirect logout is leaving the page: nothing may serve an identity again before it unloads.
  let leaving = false

  function build(key: string): LivePair {
    const built: LivePair = options.createPair(key, () => {
      // Nobody cannot be signed out: resuming the anonymous pair would only build it again.
      if (pair.value !== built || key === '') return
      void follow(true).catch(() => undefined)
    })
    return built
  }

  async function read(): Promise<SessionIdentity | null> {
    const response = await send(paths.me)
    if (response.status === 401 || response.status === 403) return null
    if (!response.ok) throw new AuthError(response.status, 'internal', `GET ${paths.me} answered ${response.status}`)
    return await response.json() as SessionIdentity
  }

  /** Serves `current`: its identity, its pair, and the poll while it is an impersonation. */
  function adopt(current: SessionIdentity | null): void {
    if (leaving) return
    identity.value = current
    pair.value = build(identityKey(current))
    clearInterval(pollTimer)
    pollTimer = undefined
    // auth ends an impersonation in place (MaximumDuration) without a 401 or 4401: look again now and then.
    if (current?.impersonator !== undefined) pollTimer = setInterval(() => { void follow(false).catch(() => undefined) }, impersonationPoll)
  }

  /** Ends the pair and serves whoever GET /auth/me answers; an unreadable answer leaves the pair ended and retries with backoff. */
  async function resumeNow(): Promise<void> {
    pair.value.end()
    clearTimeout(retryTimer)
    let current: SessionIdentity | null
    try {
      current = await read()
    } catch (error) {
      retryDelay = Math.min(retryDelay === 0 ? retryFirst : retryDelay * 2, retryLast)
      retryTimer = setTimeout(() => { void follow(true).catch(() => undefined) }, retryDelay)
      throw error
    }
    retryDelay = 0
    adopt(current)
  }

  /** Ends the pair, runs the change, then serves whoever the session is afterwards, also when the change failed. */
  function serial<Result>(change: () => Promise<Result>): Promise<Result> {
    const run = transitions.then(async () => {
      pair.value.end()
      let result: Result
      try {
        result = await change()
      } catch (error) {
        // The change's own refusal is the answer, also when the read after it fails too.
        await resumeNow().catch(() => undefined)
        throw error
      }
      await resumeNow()
      return result
    })
    transitions = run.catch(() => undefined)
    return run
  }

  /**
   * A change the app did not make: a 401 or 4401 (force), another tab, an ended impersonation, a
   * retry. Without force it reads first and keeps the pair when the identity is the same.
   * `onSignedOut` runs when it leaves nobody where someone was signed in.
   */
  function follow(force: boolean): Promise<void> {
    const run = transitions.then(async () => {
      if (leaving) return
      const before = identity.value
      // After an unreadable answer the pair is ended: rebuild it whatever the identity is.
      if (force || retryDelay !== 0) {
        await resumeNow()
      } else {
        const current = await read()
        if (leaving) return
        // The same identity keeps its pair; its roles, name or impersonation end may have changed.
        if (identityKey(current) === identityKey(before)) {
          identity.value = current
          return
        }
        pair.value.end()
        adopt(current)
      }
      if (!leaving && before !== null && identity.value === null) options.onSignedOut?.()
    })
    transitions = run.catch(() => undefined)
    return run
  }

  // Back to a tab or window: another one may have signed in, out, or as someone else meanwhile.
  // Two windows side by side are both visible, so moving between them only fires focus.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void follow(false).catch(() => undefined)
    })
    window.addEventListener('focus', () => { void follow(false).catch(() => undefined) })
  }

  async function expect(response: Response): Promise<Response> {
    if (response.ok) return response
    const body = await response.json().catch(() => ({})) as { code?: unknown; message?: unknown }
    const code = typeof body.code === 'string' ? body.code : 'internal'
    throw new AuthError(response.status, code, typeof body.message === 'string' ? body.message : code)
  }

  const json = (method: string, body?: unknown): RequestInit => ({
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
  })

  return {
    pair,
    identity,
    resume: () => serial(() => Promise.resolve()),
    check: () => follow(false),
    login: (credentials) => serial(async (): Promise<{ challenge?: LoginChallenge }> => {
      if (credentials.code !== undefined) {
        await expect(await send(`${paths.password}/totp/verify`, json('POST', { code: credentials.code, backupCode: credentials.backupCode === true })))
        return {}
      }
      const response = await expect(await send(`${paths.password}/login`, json('POST', { identifier: credentials.identifier, password: credentials.password })))
      if (response.status !== 202) return {}
      const { challenge } = await response.json() as { challenge?: unknown }
      if (challenge === 'totp' || challenge === 'totp_setup') return { challenge }
      throw new AuthError(202, 'internal', `unknown login challenge ${String(challenge)}`)
    }),
    logout: () => {
      // While impersonating, the session belongs to the impersonator: log out where they signed in.
      const owner = identity.value?.impersonator ?? identity.value
      const redirect = options.providers?.find((provider) => provider.name === owner?.provider)
      if (redirect !== undefined) {
        // The provider's logout ends the session and leaves for the identity provider; the page unloads.
        leaving = true
        clearInterval(pollTimer)
        clearTimeout(retryTimer)
        pair.value.end()
        identity.value = null
        navigate(`${redirect.prefix}/logout`)
        return Promise.resolve()
      }
      // A dev login logs out at its own provider; the password route ends any session, so it covers the rest.
      const path = owner?.provider === devProvider ? `${paths.dev}/logout` : `${paths.password}/logout`
      return serial(async () => { await expect(await send(path, { method: 'POST' })) })
    },
    devUsers: async () => {
      const response = await send(`${paths.dev}/users`)
      if (response.status === 404) return []
      const body = await (await expect(response)).json() as { users?: unknown }
      if (!Array.isArray(body.users)) throw new AuthError(response.status, 'internal', `GET ${paths.dev}/users answered no users list`)
      return body.users as DevUser[]
    },
    devLogin: (id) => serial(async () => { await expect(await send(`${paths.dev}/login`, json('POST', { id }))) }),
    impersonate: (subject) => serial(async () => { await expect(await send(paths.impersonation, json('POST', { subject }))) }),
    stopImpersonating: () => serial(async () => { await expect(await send(paths.impersonation, { method: 'DELETE' })) }),
    loginHref: (provider, redirect) => `${provider.prefix}/login?return_to=${encodeURIComponent(safeRedirect(redirect))}`,
  }
}
