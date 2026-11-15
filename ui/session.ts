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
  /** The identity's `provider` after this login, "oidc" or "github" unless the app renamed it. */
  name: string
  label: string
  /** The provider's PathPrefix; login is GET `<prefix>/login?return_to=`, logout GET `<prefix>/logout`. */
  prefix: string
}

/** A user the development login offers (GET /auth/dev/users). */
export interface DevUser {
  id: string
  name: string
  email?: string | undefined
  roles?: string[] | undefined
}

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
  /** Runs when a 401 or a 4401 ended a signed-in identity: route to the login page. */
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
  /** Password login, then the TOTP step; answers `{ twoFactor: true }` when a code is needed. */
  login(credentials: PasswordCredentials): Promise<{ twoFactor?: boolean }>
  logout(): Promise<void>
  /** The development users; [] when the server has no dev login (404). */
  devUsers(): Promise<DevUser[]>
  devLogin(id: string): Promise<void>
  impersonate(subject: string): Promise<void>
  stopImpersonating(): Promise<void>
  /** The href of a redirect provider's login that comes back to `redirect` (sanitised). */
  loginHref(provider: RedirectProvider, redirect?: unknown): string
}

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

  function build(key: string): LivePair {
    const built: LivePair = options.createPair(key, () => {
      if (pair.value !== built) return
      const wasSignedIn = identity.value !== null
      serial(() => Promise.resolve())
        .then(() => { if (wasSignedIn && identity.value === null) options.onSignedOut?.() })
        .catch(() => undefined) // /auth/me unreadable: the ended pair stays, the next resume retries
    })
    return built
  }

  async function read(): Promise<SessionIdentity | null> {
    const response = await send(paths.me)
    if (response.status === 401 || response.status === 403) return null
    if (!response.ok) throw new AuthError(response.status, 'internal', `GET ${paths.me} answered ${response.status}`)
    return await response.json() as SessionIdentity
  }

  async function resumeNow(): Promise<void> {
    pair.value.end()
    const current = await read()
    identity.value = current
    pair.value = build(identityKey(current))
  }

  /** Ends the pair, runs the change, then serves whoever the session is afterwards, also when the change failed. */
  function serial<Result>(change: () => Promise<Result>): Promise<Result> {
    const run = transitions.then(async () => {
      pair.value.end()
      let result: Result
      try {
        result = await change()
      } finally {
        await resumeNow()
      }
      return result
    })
    transitions = run.catch(() => undefined)
    return run
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
    login: (credentials) => serial(async () => {
      if (credentials.code !== undefined) {
        await expect(await send(`${paths.password}/totp/verify`, json('POST', { code: credentials.code, backupCode: credentials.backupCode === true })))
        return {}
      }
      const response = await expect(await send(`${paths.password}/login`, json('POST', { identifier: credentials.identifier, password: credentials.password })))
      if (response.status !== 202) return {}
      const { challenge } = await response.json() as { challenge?: string }
      // totp_setup: TOTP is required and the user has none; enrolment is the app's own screen.
      if (challenge === 'totp') return { twoFactor: true }
      throw new AuthError(202, 'totp_setup_required', 'two-factor setup required')
    }),
    logout: () => {
      const redirect = options.providers?.find((provider) => provider.name === identity.value?.provider)
      if (redirect !== undefined) {
        // The provider's logout ends the session and leaves for the identity provider; the page unloads.
        pair.value.end()
        identity.value = null
        navigate(`${redirect.prefix}/logout`)
        return Promise.resolve()
      }
      // The password route ends the request's session whatever provider made it.
      return serial(async () => { await expect(await send(`${paths.password}/logout`, { method: 'POST' })) })
    },
    devUsers: async () => {
      const response = await send(`${paths.dev}/users`)
      if (response.status === 404) return []
      return await (await expect(response)).json() as DevUser[]
    },
    devLogin: (id) => serial(async () => { await expect(await send(`${paths.dev}/login`, json('POST', { id }))) }),
    impersonate: (subject) => serial(async () => { await expect(await send(paths.impersonation, json('POST', { subject }))) }),
    stopImpersonating: () => serial(async () => { await expect(await send(paths.impersonation, { method: 'DELETE' })) }),
    loginHref: (provider, redirect) => `${provider.prefix}/login?return_to=${encodeURIComponent(safeRedirect(redirect))}`,
  }
}
