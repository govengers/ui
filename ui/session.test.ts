import { describe, expect, test } from 'bun:test'
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
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`
    log.push(key)
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
  return { session, log, pairs, signIn: (identity: SessionIdentity | null) => { me = identity } }
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
    expect(await box.session.login({ identifier: 'ada', password: 'secret' })).toEqual({ twoFactor: true })
    expect(box.session.identity.value).toBeNull()
    await box.session.login({ identifier: 'ada', password: 'secret', code: 'ab12-cd34', backupCode: true })
    expect(sent).toEqual({ code: 'ab12-cd34', backupCode: true })
    expect(box.session.identity.value?.subject).toBe('u-1')
  })

  test('a required TOTP setup is refused with its own code', async () => {
    const { session } = fixture({ 'POST /auth/password/login': () => reply(202, { challenge: 'totp_setup' }) })
    await expect(session.login({ identifier: 'ada', password: 'secret' })).rejects.toMatchObject({ code: 'totp_setup_required' })
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
    const box = fixture({}, { providers: [{ name: 'oidc', label: 'Company SSO', prefix: '/auth/oidc/company' }], navigate: (href) => left.push(href) })
    box.signIn({ ...ada, provider: 'oidc' })
    await box.session.resume()
    await box.session.logout()
    expect(left).toEqual(['/auth/oidc/company/logout'])
    expect(box.session.identity.value).toBeNull()
    expect(box.pairs.at(-1)?.ended).toBe(true)
  })

  test('dev login lists users, logs one in; no dev login answers no users', async () => {
    const box = fixture({
      'GET /auth/dev/users': () => reply(200, [{ id: 'u-2', name: 'Bob' }]),
      'POST /auth/dev/login': (init) => { expect(JSON.parse(String(init?.body))).toEqual({ id: 'u-2' }); box.signIn(bob); return reply(200, bob) },
    })
    expect(await box.session.devUsers()).toEqual([{ id: 'u-2', name: 'Bob' }])
    await box.session.devLogin('u-2')
    expect(box.session.identity.value?.username).toBe('bob')
    expect(await fixture({}).session.devUsers()).toEqual([])
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
