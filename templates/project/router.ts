// The app's routes and the sign-in guard (ui-start step 4, D48, D56). Goes to src/router.ts.
// Route meta `page`, `title`, `intent` feed app-map.json (scripts/app-map.ts imports `routes`), so
// this module must load without a DOM: components are lazy imports, the router is made in
// createAppRouter. `public: true` routes need no identity.
import { shallowRef, watch } from 'vue'
import { createRouter, createWebHistory, isNavigationFailure, NavigationFailureType, type LocationQueryValue, type RouteRecordRaw, type Router, type RouterScrollBehavior } from 'vue-router'
import { providers, session } from './session'
import { safeRedirect } from './ui/session'
import { toast } from './ui/Toast/toast'
import type { LoginAnswer, LoginCredentials } from './ui/blocks/LoginForm/LoginForm.vue'

declare module 'vue-router' {
  interface RouteMeta {
    page?: string
    title?: string
    intent?: string
    public?: boolean
  }
}

type Redirect = LocationQueryValue | LocationQueryValue[] | undefined

let router: Router | undefined

/**
 * The one sign-out, read by the guards and the shell: `asking` while the guards decide, `ending`
 * while the logout request is out, `slow` once it has had no answer for 10 s.
 */
export const signOutState = shallowRef<'idle' | 'asking' | 'ending' | 'slow'>('idle')
/** The logout request's outcome: true when nobody is signed in afterwards. */
let ending: Promise<boolean> | undefined
/** Turns a sign-out still under way after 10 s `slow`, whatever it waits on (the request, the screen's chunk). */
let patience: ReturnType<typeof setTimeout> | undefined

/** LoginPage's login: the session's login, then back to where the guard came from. */
async function login(credentials: LoginCredentials, redirect: Redirect): Promise<LoginAnswer> {
  const answer = await session.login(credentials)
  // `totp_setup`: TOTP is required and not enrolled; route to the app's enrolment screen here once it exists.
  if (answer.challenge === undefined) await router?.replace(safeRedirect(redirect))
  return answer
}

/** DevLogin's login (development builds only, see LoginRoute.vue): the dev user, then back. */
export async function devLogin(id: string, redirect: Redirect): Promise<void> {
  await session.devLogin(id)
  await router?.replace(safeRedirect(redirect))
}

/**
 * LoginPage's props for the way back in `redirect`; LoginRoute.vue binds them. govengers/auth has
 * no change-password route: once the app has its own call, add `change` here and a
 * `changePassword` route (LoginPage card).
 */
export const loginProps = (redirect: Redirect) => ({
  login: (credentials: LoginCredentials) => login(credentials, redirect),
  providers: providers.map((provider) => ({ name: provider.name, label: provider.label, href: session.loginHref(provider, redirect) })),
})

export const routes: RouteRecordRaw[] = [
  {
    path: '/login', name: 'auth.login', component: () => import('./LoginRoute.vue'),
    meta: { page: 'auth.login', title: 'Sign in', intent: 'Sign in', public: true },
  },
  {
    path: '/logged-out', name: 'auth.loggedOut', component: () => import('./LoginRoute.vue'),
    props: { state: 'loggedOut' },
    // After the leave guards and every beforeEach, before this route's chunk loads, the request goes
    // out at once; so a guard that asks the user belongs there, not in beforeResolve. While a
    // sign-out asks, any navigation to this route that gets through starts it, and a guard must
    // answer every question it asks: one left open keeps the sign-out asking until a reload.
    beforeEnter: () => {
      if (signOutState.value === 'asking') void endSession()
    },
    meta: { page: 'auth.loggedOut', title: 'Signed out', intent: 'See that the session ended', public: true },
  },
  {
    path: '/', name: 'home', component: () => import('./pages/Home/Home.vue'),
    meta: { page: 'home', title: 'Home', intent: 'Start here' },
  },
]

/** The top bar's height in px, whatever length the preset gave `--ui-topbar-h`. */
function topbarHeight(): number {
  const probe = document.body.appendChild(document.createElement('div'))
  probe.style.position = 'absolute'
  probe.style.height = 'var(--ui-topbar-h)'
  const height = probe.getBoundingClientRect().height
  probe.remove()
  return height
}

/**
 * Back and forward return to the saved position, a hash lands below the sticky top bar, a change
 * of the query alone (a filter, a tab, a page number) stays where it is, anything else starts at
 * the top. Touches the DOM only when called, so app-map.ts can still import this module.
 */
const scrollBehavior: RouterScrollBehavior = (to, from, saved) => {
  if (saved) {
    // Live rows arrive after the navigation: a page still too short would clamp the position, so wait (at most 1 s).
    // A newer navigation or a reader who scrolled meanwhile ends the wait without a scroll.
    const startY = window.scrollY
    const until = performance.now() + 1000
    return new Promise((resolve) => {
      const check = (now: number): void => {
        if (router?.currentRoute.value !== to || window.scrollY !== startY) resolve(false)
        else if (document.documentElement.scrollHeight >= saved.top + window.innerHeight || now >= until) resolve(saved)
        else requestAnimationFrame(check)
      }
      check(performance.now())
    })
  }
  if (to.path === from.path && (to.hash === from.hash || to.hash === '')) return false
  if (to.hash) return { el: to.hash, top: topbarHeight() }
  return { top: 0 }
}

/** The router with the guard: a route that is not public needs an identity, else the login page with the way back. */
export function createAppRouter(): Router {
  router = createRouter({ history: createWebHistory(), routes, scrollBehavior })
  router.beforeEach((to) => {
    // Signed in and not signing out: the signed-out screen would not be true.
    if (to.name === 'auth.loggedOut' && session.identity.value !== null && signOutState.value === 'idle') return { name: 'home' }
    if (to.meta.public === true || session.identity.value !== null) return true
    return { name: 'auth.login', query: { redirect: to.fullPath } }
  })
  // The signed-out screen with somebody signed in and no sign-out running (another tab signed in,
  // or the way back after a refused logout was refused too): home.
  watch([session.identity, signOutState], ([now, state]) => {
    if (now !== null && state === 'idle' && router?.currentRoute.value.name === 'auth.loggedOut') void router.replace({ name: 'home' })
  })
  return router
}

/**
 * Sign out from the shell. The signed-out route comes first, so a leave guard can keep the user,
 * their edits and the session; whatever else becomes of that navigation (a lost chunk, a throwing
 * guard, a link or Back meanwhile), the session ends. One at a time: a second click joins the first.
 * `t` is the shell's translation (this module has no i18n of its own): it words the refusal's toast.
 */
export async function logout(t: (key: string) => string): Promise<void> {
  if (signOutState.value !== 'idle') return
  try {
    signOutState.value = 'asking'
    const from = router?.currentRoute.value.fullPath
    // A redirect provider's logout leaves for the provider (ui/session.ts): no load of ours may cancel it.
    const owner = session.identity.value?.impersonator ?? session.identity.value
    const leaves = providers.some((provider) => provider.name === owner?.provider)
    // A refusal resolves with an aborted NavigationFailure; a lost chunk or a throwing guard rejects.
    const refused = await router?.replace({ name: 'auth.loggedOut' }).then((failure) => isNavigationFailure(failure, NavigationFailureType.aborted), () => false)
    if (refused && ending === undefined) return
    if (!(await endSession())) {
      if (from !== undefined && router?.currentRoute.value.name === 'auth.loggedOut') await router.replace(from).catch(() => undefined)
      toast({ message: t('ui.signOutFailed'), variant: 'danger', action: { label: t('ui.retry'), run: () => void logout(t) } })
    } else if (!leaves && router?.currentRoute.value.name !== 'auth.loggedOut') {
      // A page reached meanwhile or a lost chunk: a full load drops it and every state of the old identity.
      location.assign('/logged-out')
    }
  } finally {
    clearTimeout(patience)
    ending = undefined
    signOutState.value = 'idle'
  }
}

/** Sends the logout once per sign-out (from `beforeEnter` or after the navigation) and starts the patience. */
function endSession(): Promise<boolean> {
  if (ending !== undefined) return ending
  signOutState.value = 'ending'
  patience = setTimeout(() => (signOutState.value = 'slow'), 10_000)
  ending = sendLogout()
  return ending
}

/** True when nobody is signed in afterwards, also after a refusal that left nobody (a 401); a throw counts as a refusal. */
async function sendLogout(): Promise<boolean> {
  try {
    await session.logout()
  } catch (error) {
    console.error('session: logout failed', error)
  }
  return session.identity.value === null
}
