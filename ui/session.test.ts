import { describe, expect, jest, test } from 'bun:test'
import type { LivePair } from '@/api/runtime'
import { AuthError, createSession, identityKey, safeRedirect, type SessionIdentity, type SessionOptions } from './session'

const ada: SessionIdentity = { provider: 'password', subject: 'u-1', username: 'ada', active: true, roles: ['admin'] }
const bob: SessionIdentity = { provider: 'password', subject: 'u-2', username: 'bob', active: true, roles: [] }

type Route = (init: RequestInit | undefined) => Response | Promise<Response>

/** A fake auth server: answers per "METHOD path", logs every request and every pair event in order. */
function fixture(routes: Record<string, Route>, extra: Partial<SessionOptions> = {}) {
  const log: string[] = []
  const pairs: { key: string; ended: boolean; unauthorized: () => void }[] = []
  let me: SessionIdentity | null = null
  let meStatus = 200
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`
    log.push(key)
    if (key === 'GET /auth/me' && meStatus !== 200) return reply(meStatus, { code: 'internal' })
    if (key === 'GET /auth/me') return me === null ? reply(401, { code: 'unauthenticated' }) : reply(200, me)
    const route = routes[key]
    return route === undefined ? reply(404, { code: 'not_found' }) : route(init)
  }) as typeof globalThis.fetch
  const session = createSession({
    fetch,
    createPair: (key, unauthorized) => {
      const record = { key, ended: false, unauthorized }
      pairs.push(record)
      log.push(`pair ${key || '-'}`)
      return { identity: key, end: () => { if (!record.ended) log.push(`end ${key || '-'}`); record.ended = true } } as unknown as LivePair
    },
    ...extra,
  })
  return {
    session, log, pairs,
    signIn: (identity: SessionIdentity | null) => { me = identity },
    /** Makes GET /auth/me answer `status` (200: the signed-in identity again). */
    meAnswers: (status: number) => { meStatus = status },
  }
}

function reply(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('session', () => {
  test('resume serves whoever /auth/me answers', async () => {
    const { session, signIn, log } = fixture({})
    await session.resume()
    expect(session.identity.value).toBeNull()
    signIn(ada)
    await session.resume()
    expect(session.identity.value?.username).toBe('ada')
    expect(session.pair.value.identity).toBe('password:u-1')
    expect(log).toEqual(['pair -', 'end -', 'GET /auth/me', 'pair -', 'end -', 'GET /auth/me', 'pair password:u-1'])
  })

  test('login ends the pair before the request that sets the cookie', async () => {
    const box = fixture({ 'POST /auth/password/login': () => { box.signIn(ada); return reply(200, ada) } })
    expect(await box.session.login({ identifier: 'ada', password: 'secret' })).toEqual({})
    expect(box.log).toEqual(['pair -', 'end -', 'POST /auth/password/login', 'GET /auth/me', 'pair password:u-1'])
  })

  test('a TOTP challenge asks for the code, the code finishes the login', async () => {
    let sent: unknown
    const box = fixture({
      'POST /auth/password/login': () => reply(202, { challenge: 'totp' }),
      'POST /auth/password/totp/verify': (init) => { sent = JSON.parse(String(init?.body)); box.signIn(ada); return reply(200, ada) },
    })
    expect(await box.session.login({ identifier: 'ada', password: 'secret' })).toEqual({ challenge: 'totp' })
    expect(box.session.identity.value).toBeNull()
    await box.session.login({ identifier: 'ada', password: 'secret', code: 'ab12-cd34', backupCode: true })
    expect(sent).toEqual({ code: 'ab12-cd34', backupCode: true })
    expect(box.session.identity.value?.subject).toBe('u-1')
  })

  test('a required TOTP setup answers its challenge, an unknown one is refused', async () => {
    const { session } = fixture({ 'POST /auth/password/login': () => reply(202, { challenge: 'totp_setup' }) })
    expect(await session.login({ identifier: 'ada', password: 'secret' })).toEqual({ challenge: 'totp_setup' })
    const unknown = fixture({ 'POST /auth/password/login': () => reply(202, { challenge: 'webauthn' }) })
    await expect(unknown.session.login({ identifier: 'ada', password: 'secret' })).rejects.toMatchObject({ code: 'internal' })
  })

  test('a refused login throws the closed code and still serves nobody', async () => {
    const { session, pairs } = fixture({ 'POST /auth/password/login': () => reply(401, { code: 'invalid_credentials', message: 'authentication required' }) })
    const failure = await session.login({ identifier: 'ada', password: 'wrong' }).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(AuthError)
    expect(failure).toMatchObject({ status: 401, code: 'invalid_credentials' })
    expect(pairs.map((pair) => pair.ended)).toEqual([true, false])
  })

  test('changes run one after the other', async () => {
    let release = (): void => undefined
    const box = fixture({
      'POST /auth/password/login': () => new Promise((resolve) => { release = () => { box.signIn(ada); resolve(reply(200, ada)) } }),
      'POST /auth/password/logout': () => { box.signIn(null); return reply(204) },
    })
    const first = box.session.login({ identifier: 'ada', password: 'secret' })
    const second = box.session.logout()
    await Promise.resolve()
    release()
    await Promise.all([first, second])
    expect(box.log.slice(1)).toEqual(['end -', 'POST /auth/password/login', 'GET /auth/me', 'pair password:u-1', 'end password:u-1', 'POST /auth/password/logout', 'GET /auth/me', 'pair -'])
  })

  test('a redirect provider logs out by leaving the page', async () => {
    const left: string[] = []
    const box = fixture({}, { providers: [{ name: 'company', label: 'Company SSO', prefix: '/auth/oidc/company' }], navigate: (href) => left.push(href) })
    box.signIn({ ...ada, provider: 'company' })
    await box.session.resume()
    await box.session.logout()
    expect(left).toEqual(['/auth/oidc/company/logout'])
    expect(box.session.identity.value).toBeNull()
    expect(box.pairs.at(-1)?.ended).toBe(true)
  })

  test('logout while impersonating follows the provider that made the session', async () => {
    const left: string[] = []
    const providers = [{ name: 'company', label: 'Company SSO', prefix: '/auth/oidc/company' }]
    const box = fixture({ 'POST /auth/password/logout': () => { box.signIn(null); return reply(204) } }, { providers, navigate: (href) => left.push(href) })
    box.signIn({ ...bob, provider: 'company', impersonator: ada }) // a password admin acting as an SSO user
    await box.session.resume()
    await box.session.logout()
    expect(left).toEqual([])
    expect(box.log).toContain('POST /auth/password/logout')

    const sso = fixture({}, { providers, navigate: (href) => left.push(href) })
    sso.signIn({ ...bob, impersonator: { ...ada, provider: 'company' } }) // an SSO admin acting as a password user
    await sso.session.resume()
    await sso.session.logout()
    expect(left).toEqual(['/auth/oidc/company/logout'])
  })

  test('dev login lists users from auth\'s envelope, logs one in and out; no dev login answers no users', async () => {
    const dev = { ...bob, provider: 'dev_login' }
    const box = fixture({
      'GET /auth/dev/users': () => reply(200, { users: [{ id: 'u-2', name: 'Bob', description: 'member' }] }),
      'POST /auth/dev/login': (init) => { expect(JSON.parse(String(init?.body))).toEqual({ id: 'u-2' }); box.signIn(dev); return reply(200, dev) },
      'POST /auth/dev/logout': () => { box.signIn(null); return reply(204) },
    })
    expect(await box.session.devUsers()).toEqual([{ id: 'u-2', name: 'Bob', description: 'member' }])
    await box.session.devLogin('u-2')
    expect(box.session.identity.value?.username).toBe('bob')
    await box.session.logout() // no password provider mounted: its logout would answer 404
    expect(box.log).toContain('POST /auth/dev/logout')
    expect(box.session.identity.value).toBeNull()
    expect(await fixture({}).session.devUsers()).toEqual([])
  })

  test('a dev users body without a users list is refused, not shown as empty', async () => {
    const { session } = fixture({ 'GET /auth/dev/users': () => reply(200, [{ id: 'u-2', name: 'Bob' }]) })
    await expect(session.devUsers()).rejects.toMatchObject({ code: 'internal' })
  })

  test('impersonation is an identity change with its own pair key', async () => {
    const box = fixture({
      'POST /auth/impersonation': () => { box.signIn({ ...bob, impersonator: ada }); return reply(200, {}) },
      'DELETE /auth/impersonation': () => { box.signIn(ada); return reply(200, ada) },
    })
    box.signIn(ada)
    await box.session.resume()
    await box.session.impersonate('u-2')
    expect(box.session.pair.value.identity).toBe('password:u-1>password:u-2')
    await box.session.stopImpersonating()
    expect(box.session.pair.value.identity).toBe('password:u-1')
  })

  test('a 401 or 4401 of the current pair resumes and reports the sign-out once', async () => {
    let signedOut = 0
    const box = fixture({}, { onSignedOut: () => { signedOut += 1 } })
    box.signIn(ada)
    await box.session.resume()
    const stale = box.pairs[0]!
    box.signIn(null)
    stale.unauthorized() // an earlier pair: ignored
    box.pairs.at(-1)!.unauthorized()
    await box.session.resume()
    expect(signedOut).toBe(1)
    expect(box.session.identity.value).toBeNull()
  })

  test('an anonymous pair\'s 401 or 4401 does not resume', async () => {
    const box = fixture({})
    await box.session.resume()
    const before = box.log.length
    box.pairs.at(-1)!.unauthorized()
    box.pairs.at(-1)!.unauthorized()
    await box.session.check()
    expect(box.log.slice(before)).toEqual(['GET /auth/me'])
    expect(box.pairs.length).toBe(2)
  })

  test('check replaces the pair only when the identity changed', async () => {
    let signedOut = 0
    const box = fixture({}, { onSignedOut: () => { signedOut += 1 } })
    box.signIn({ ...bob, impersonator: ada })
    await box.session.resume()
    await box.session.check()
    expect(box.pairs.length).toBe(2)
    box.signIn(ada) // auth ended the impersonation in place (MaximumDuration): no 401, no 4401
    await box.session.check()
    expect(box.session.identity.value?.impersonator).toBeUndefined()
    expect(box.session.pair.value.identity).toBe('password:u-1')
    expect(box.pairs.map((pair) => pair.ended)).toEqual([true, true, false])
    box.signIn(null) // another tab signed out
    await box.session.check()
    expect(box.session.identity.value).toBeNull()
    expect(signedOut).toBe(1)
  })

  test('an impersonation is looked at again every minute', async () => {
    jest.useFakeTimers()
    try {
      const box = fixture({})
      box.signIn({ ...bob, impersonator: ada })
      await box.session.resume()
      box.signIn(ada)
      jest.advanceTimersByTime(60_000)
      await box.session.check() // waits for the poll queued before it
      expect(box.session.pair.value.identity).toBe('password:u-1')
      const reads = box.log.filter((entry) => entry === 'GET /auth/me').length
      jest.advanceTimersByTime(120_000) // no impersonation: no poll
      await box.session.check()
      expect(box.log.filter((entry) => entry === 'GET /auth/me').length).toBe(reads + 1)
    } finally {
      jest.useRealTimers()
    }
  })

  test('a refused change keeps its own error when /auth/me fails too', async () => {
    jest.useFakeTimers()
    try {
      const box = fixture({ 'POST /auth/password/login': () => reply(401, { code: 'invalid_credentials' }) })
      box.meAnswers(502)
      await expect(box.session.login({ identifier: 'ada', password: 'wrong' })).rejects.toMatchObject({ code: 'invalid_credentials' })
    } finally {
      jest.useRealTimers()
    }
  })

  test('an unreadable /auth/me after a 4401 retries until a pair serves again', async () => {
    jest.useFakeTimers()
    try {
      let signedOut = 0
      const box = fixture({}, { onSignedOut: () => { signedOut += 1 } })
      box.signIn(ada)
      await box.session.resume()
      box.meAnswers(503)
      box.pairs.at(-1)!.unauthorized()
      await box.session.check().catch(() => undefined) // the 4401's resume failed: the pair is ended
      expect(box.pairs.at(-1)?.ended).toBe(true)
      box.meAnswers(200)
      box.signIn(null)
      jest.advanceTimersByTime(30_000)
      await box.session.check()
      expect(box.pairs.at(-1)?.ended).toBe(false)
      expect(box.session.identity.value).toBeNull()
      expect(signedOut).toBe(1)
    } finally {
      jest.useRealTimers()
    }
  })

  test('identityKey', () => {
    expect(identityKey(null)).toBe('')
    expect(identityKey({ ...bob, impersonator: ada })).toBe('password:u-1>password:u-2')
  })
})

describe('safeRedirect', () => {
  test.each([
    ['/tasks?board=1#top', '/tasks?board=1#top'],
    [['/a', '/b'], '/a'],
    ['//evil.example/x', '/'],
    ['/\\evil.example', '/'],
    ['https://evil.example', '/'],
    ['javascript:alert(1)', '/'],
    ['tasks', '/'],
    ['/a\nb', '/'],
    ['/a\\b', '/'],
    [undefined, '/'],
    [42, '/'],
    ['/' + 'a'.repeat(2048), '/'],
  ])('%p -> %p', (raw, expected) => {
    expect(safeRedirect(raw)).toBe(expected)
  })

  test('fallback and login href', () => {
    expect(safeRedirect('//x', '/home')).toBe('/home')
    const { session } = fixture({})
    expect(session.loginHref({ name: 'github', label: 'GitHub', prefix: '/auth/github' }, '/tasks?x=1')).toBe('/auth/github/login?return_to=%2Ftasks%3Fx%3D1')
    expect(session.loginHref({ name: 'github', label: 'GitHub', prefix: '/auth/github' }, '//evil')).toBe('/auth/github/login?return_to=%2F')
  })
})
