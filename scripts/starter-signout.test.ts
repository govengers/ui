// The starter's sign-out (templates/project/router.ts, D100): which paths end the session, in which
// order, where the user lands and what they are told. router.ts loads here with the real vue-router
// on jsdom's history; the starter's session, toast and route components are stood in for, since
// they exist only in a scaffolded target; the leave guard of the last cases is the real one. The browser
// half (the screen, a closed tab) is a probe.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, mock, test } from 'bun:test'
import { join } from 'node:path'
import { createApp, defineComponent, ref, shallowRef, type App, type ShallowRef } from 'vue'
import { createI18n } from 'vue-i18n'
import type { NavigationGuardWithThis, RouteRecordRaw, Router } from 'vue-router'
import { useLeaveGuard } from '../ui/blocks/LiveForm/leaveGuard'
import { messages } from '../ui/messages'

const starter = join(import.meta.dir, '../templates/project')

interface Identity { provider: string; subject: string }
const identity = shallowRef<Identity | null>(null)
/** What happened, in order: guards, logout requests, chunk loads. */
const calls: string[] = []
let answer: () => Promise<void> = async () => undefined
const session = { identity, loginHref: () => '', logout: () => (calls.push('logout'), answer()) }
const providers: { name: string; label: string; prefix: string }[] = []
const toasts = new Map<number, { message: string; action?: { label: string; run: () => void } }>()
let lastToast = 0
/** Full page loads the code asked for (bare `location`, swapped below). */
const loads: string[] = []
const realLocation = globalThis.location
/** The bare `location` during a case: loads are recorded, everything else reads the real one (vue-router reads it too). */
const fakeLocation = { assign: (href: string) => void loads.push(href), reload: () => void loads.push('reload') }
for (const key of ['href', 'origin', 'protocol', 'host', 'pathname', 'search', 'hash'] as const) {
  Object.defineProperty(fakeLocation, key, { get: () => realLocation[key] })
}

mock.module('../templates/project/session', () => ({ session, providers }))
mock.module('../templates/project/ui/session', () => ({ safeRedirect: () => '/' }))
mock.module('../templates/project/ui/Toast/toast', () => ({
  toast: (options: { message: string; action?: { label: string; run: () => void } }) => (toasts.set(++lastToast, options), lastToast),
}))
mock.module('../templates/project/LoginRoute.vue', () => ({ default: { render: () => null } }))
mock.module('../templates/project/pages/Home/Home.vue', () => ({ default: { render: () => null } }))

const starterRouter = await import(join(starter, 'router.ts')) as {
  createAppRouter: () => Router
  logout: (t: (key: string) => string) => Promise<void>
  routes: RouteRecordRaw[]
  signOutState: ShallowRef<'idle' | 'asking' | 'ending' | 'slow'>
}
const { signOutState: state } = starterRouter
/** The shell's translation, in German, so a literal in router.ts would show. */
const t = (key: string): string => (messages.de.ui as Record<string, string>)[key.replace(/^ui\./, '')] ?? key
const logout = (): Promise<void> => starterRouter.logout(t)
const signedOut = starterRouter.routes.find((route) => route.name === 'auth.loggedOut')!
const page = { render: () => null }

// One router for the file: createAppRouter registers a watch that lives as long as the app.
let router: Router
/** Guards a case added and work it left waiting; both are undone after it, so a failing case cannot hold the next. */
const undo: Array<() => void> = []
// vue-router reports a rejected navigation and the flow a refused logout on the console; the tests read the outcome.
const quiet = [jest.spyOn(console, 'error'), jest.spyOn(console, 'warn')]

beforeAll(() => {
  window.history.replaceState(null, '', '/')
  router = starterRouter.createAppRouter()
  router.addRoute({ path: '/other', name: 'other', component: page })
})
// The shared test process gets back what this file changed: the console, the URL, the history listeners.
// The module mocks stay: they name paths under templates/project/ that no other test imports.
afterAll(() => {
  for (const spy of quiet) spy.mockRestore()
  router.options.history.destroy()
  window.history.replaceState(null, '', '/')
})
beforeEach(async () => {
  for (const spy of quiet) spy.mockImplementation(() => undefined)
  calls.length = 0
  loads.length = 0
  toasts.clear()
  providers.length = 0
  answer = async () => void (identity.value = null)
  identity.value = { provider: 'password', subject: 'ada' }
  ;(globalThis as { location: unknown }).location = fakeLocation
  router.addRoute(signedOut)
  await router.replace('/')
})
afterEach(async () => {
  jest.useRealTimers()
  for (const step of undo.splice(0)) step()
  await flush()
  for (const spy of quiet) spy.mockReset()
  ;(globalThis as { location: unknown }).location = realLocation
})

/** A guard that keeps the signed-out route waiting until the test decides. */
function asking(): () => void {
  let decide = (): void => undefined
  guard((to) => (to.name === 'auth.loggedOut' ? new Promise<boolean>((resolve) => (decide = () => resolve(true))) : true))
  undo.push(() => decide())
  return () => decide()
}

/** Microtasks and the mocked imports (an import settles on a later turn, not a timer). */
async function flush(): Promise<void> {
  for (let round = 0; round < 5; round++) await new Promise((resolve) => setImmediate(resolve))
}

function guard(check: NavigationGuardWithThis<undefined>): void {
  undo.push(router.beforeEach(check))
}

/** A logout that answers when the test says: `end()` signs nobody in. */
function slowAnswer(): () => void {
  let end = (): void => undefined
  answer = () => new Promise((resolve) => (end = () => resolve(void (identity.value = null))))
  undo.push(() => end())
  return () => end()
}

/** The signed-out route with a chunk the test resolves or loses. */
function chunk(): { resolve: () => void; reject: () => void } {
  let resolve = (): void => undefined
  let reject = (): void => undefined
  const loading = new Promise<{ default: typeof page }>((done, fail) => {
    resolve = () => done({ default: page })
    reject = () => fail(new Error('chunk lost after a deploy'))
  })
  router.addRoute({ ...signedOut, component: () => (calls.push('chunk'), loading) } as RouteRecordRaw)
  undo.push(() => resolve())
  return { resolve, reject }
}

const shown = (): [string, string | undefined][] => [...toasts.values()].map((item) => [item.message, item.action?.label])

describe('starter sign-out', () => {
  test('a leave guard that says no keeps the page and the session', async () => {
    guard((to) => to.name !== 'auth.loggedOut')
    await logout()
    expect(calls).toEqual([])
    expect(router.currentRoute.value.path).toBe('/')
    expect(identity.value).not.toBeNull()
    expect(toasts.size).toBe(0)
    expect(state.value).toBe('idle')
  })

  test('the guards are asked first; the request goes out before the screen has loaded', async () => {
    const decide = asking()
    const screen = chunk()
    const end = slowAnswer()
    const done = logout()
    await flush()
    expect([state.value, calls]).toEqual(['asking', []])
    decide()
    await flush()
    expect([state.value, calls]).toEqual(['ending', ['logout', 'chunk']])
    expect(router.currentRoute.value.path).toBe('/')
    screen.resolve()
    end()
    await done
    expect([state.value, router.currentRoute.value.name, identity.value, loads]).toEqual(['idle', 'auth.loggedOut', null, []])
  })

  test('a lost chunk still ends the session, then a full load shows the screen', async () => {
    chunk().reject()
    await logout()
    expect(calls).toEqual(['logout', 'chunk'])
    expect(loads).toEqual(['/logged-out'])
  })

  test('a throwing guard still ends the session, then a full load shows the screen', async () => {
    guard((to) => {
      if (to.name === 'auth.loggedOut') throw new Error('guard failed')
    })
    await logout()
    expect(calls).toEqual(['logout'])
    expect(loads).toEqual(['/logged-out'])
  })

  test('a link clicked meanwhile does not keep the session; the page it reached is loaded away', async () => {
    const end = slowAnswer()
    const screen = chunk()
    const done = logout()
    await flush()
    await router.push('/other')
    screen.resolve()
    end()
    await done
    expect(calls.filter((call) => call === 'logout')).toHaveLength(1)
    expect(loads).toEqual(['/logged-out'])
  })

  test('a link clicked while a guard still decides cancels the screen, not the sign-out', async () => {
    const decide = asking()
    const done = logout()
    await flush()
    await router.push('/other')
    decide()
    await done
    expect(calls).toEqual(['logout'])
    expect(loads).toEqual(['/logged-out'])
  })

  test('a refused logout takes the user back to their page, signed in, and Retry sends again', async () => {
    answer = async () => {
      throw new Error('500')
    }
    await logout()
    expect([router.currentRoute.value.path, state.value, loads]).toEqual(['/', 'idle', []])
    expect(identity.value).not.toBeNull()
    expect(shown()).toEqual([['Abmelden fehlgeschlagen. Du bist weiterhin angemeldet.', 'Erneut versuchen']])
    // Retry passes the shell's translation on: a second refusal is worded like the first.
    toasts.get(lastToast)?.action?.run()
    await flush()
    expect(shown()).toEqual([['Abmelden fehlgeschlagen. Du bist weiterhin angemeldet.', 'Erneut versuchen'], ['Abmelden fehlgeschlagen. Du bist weiterhin angemeldet.', 'Erneut versuchen']])
    answer = async () => void (identity.value = null)
    toasts.get(lastToast)?.action?.run()
    await flush()
    expect(calls).toEqual(['logout', 'logout', 'logout'])
    expect(router.currentRoute.value.name).toBe('auth.loggedOut')
  })

  test('a refused logout whose way back is refused too ends at home, not on the signed-out screen', async () => {
    await router.replace('/other')
    guard((to, from) => !(from.name === 'auth.loggedOut' && to.path === '/other'))
    answer = async () => {
      throw new Error('500')
    }
    await logout()
    await flush()
    expect(router.currentRoute.value.name).toBe('home')
  })

  test('a refusal that left nobody signed in (a 401) counts as signed out', async () => {
    answer = async () => {
      identity.value = null
      throw new Error('401')
    }
    await logout()
    expect(router.currentRoute.value.name).toBe('auth.loggedOut')
    expect(toasts.size).toBe(0)
  })

  test('two clicks send one request; sign out, sign in, sign out again sends two', async () => {
    await Promise.all([logout(), logout()])
    expect(calls).toEqual(['logout'])
    identity.value = { provider: 'password', subject: 'ada' }
    await flush()
    await logout()
    expect(calls).toEqual(['logout', 'logout'])
  })

  test('a logout without an answer turns slow after 10 s; a click meanwhile sends nothing', async () => {
    jest.useFakeTimers()
    const end = slowAnswer()
    const done = logout()
    await flush()
    expect(router.currentRoute.value.name).toBe('auth.loggedOut')
    jest.advanceTimersByTime(9_999)
    expect(state.value).toBe('ending')
    jest.advanceTimersByTime(1)
    expect(state.value).toBe('slow')
    await logout()
    expect(calls).toEqual(['logout'])
    end()
    await done
    expect([state.value, toasts.size, router.currentRoute.value.name]).toEqual(['idle', 0, 'auth.loggedOut'])
  })

  test('a screen whose chunk never comes turns slow after 10 s, though the request has answered', async () => {
    jest.useFakeTimers()
    chunk()
    void logout()
    await flush()
    expect([calls, identity.value, state.value]).toEqual([['logout', 'chunk'], null, 'ending'])
    jest.advanceTimersByTime(10_000)
    expect(state.value).toBe('slow')
  })

  test('a logout that throws at once counts as refused and leaves nothing running', async () => {
    jest.useFakeTimers()
    answer = () => {
      throw new Error('a session that throws before it sends')
    }
    await logout()
    expect([calls, router.currentRoute.value.path, state.value]).toEqual([['logout'], '/', 'idle'])
    expect(shown()).toEqual([['Abmelden fehlgeschlagen. Du bist weiterhin angemeldet.', 'Erneut versuchen']])
    jest.advanceTimersByTime(10_000)
    expect(state.value).toBe('idle')
  })

  test('a quick sign-out does not turn slow 10 s later, nor the next one early', async () => {
    jest.useFakeTimers()
    await logout()
    jest.advanceTimersByTime(10_000)
    expect(state.value).toBe('idle')
    identity.value = { provider: 'password', subject: 'ada' }
    await router.replace('/')
    await logout()
    jest.advanceTimersByTime(6_000)
    identity.value = { provider: 'password', subject: 'ada' }
    await router.replace('/')
    const end = slowAnswer()
    const done = logout()
    await flush()
    jest.advanceTimersByTime(5_000)
    expect(state.value).toBe('ending')
    end()
    await done
  })

  test("a redirect provider's logout is not cancelled by a load of ours", async () => {
    providers.push({ name: 'company', label: 'Company SSO', prefix: '/auth/oidc/company' })
    identity.value = { provider: 'company', subject: 'ada' }
    chunk().reject()
    await logout()
    expect(calls).toEqual(['logout', 'chunk'])
    expect(loads).toEqual([])
  })

  test('a visit of the signed-out screen sends no request, and goes home while somebody is signed in', async () => {
    await router.push('/logged-out')
    expect(router.currentRoute.value.name).toBe('home')
    identity.value = null
    await router.push('/logged-out')
    expect(router.currentRoute.value.name).toBe('auth.loggedOut')
    expect(calls).toEqual([])
  })

  test('somebody signing in elsewhere moves the signed-out screen home', async () => {
    await logout()
    expect(router.currentRoute.value.name).toBe('auth.loggedOut')
    identity.value = { provider: 'password', subject: 'ada' }
    await flush()
    expect([router.currentRoute.value.name, state.value, calls]).toEqual(['home', 'idle', ['logout']])
  })
})

// The forms package's own leave guard (useLeaveGuard, D96), not a stand-in: a dirty form on the page
// asks through window.confirm, and only its Cancel keeps the page, the edits and the session.
describe('starter sign-out with the real leave guard', () => {
  const dirty = ref(false)
  let answer = false
  let asked = 0
  let app: App | undefined
  const confirm = window.confirm
  beforeEach(() => {
    asked = 0
    window.confirm = () => (asked++, answer)
    app = createApp(defineComponent({
      setup() {
        useLeaveGuard(dirty)
        return () => null
      },
    })).use(createI18n({ legacy: false, locale: 'en', messages })).use(router)
    app.mount(document.createElement('div'))
  })
  afterEach(() => {
    app?.unmount()
    window.confirm = confirm
  })

  for (const [form, says, outcome] of [
    ['an edited form', 'Cancel', { asked: 1, calls: [], route: 'home', signedIn: true }],
    ['an edited form', 'OK', { asked: 1, calls: ['logout'], route: 'auth.loggedOut', signedIn: false }],
    ['a clean form', 'nothing', { asked: 0, calls: ['logout'], route: 'auth.loggedOut', signedIn: false }],
  ] as const) {
    test(`${form}, the user says ${says}`, async () => {
      dirty.value = form === 'an edited form'
      answer = says === 'OK'
      await flush()
      await logout()
      expect({ asked, calls, route: router.currentRoute.value.name, signedIn: identity.value !== null }).toEqual({ ...outcome, calls: [...outcome.calls] })
      expect([state.value, toasts.size]).toEqual(['idle', 0])
    })
  }
})
