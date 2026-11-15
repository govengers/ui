// The app's routes and the sign-in guard (ui-start step 4, D48, D56). Goes to src/router.ts.
// Route meta `page`, `title`, `intent` feed app-map.json (scripts/app-map.ts imports `routes`), so
// this module must load without a DOM: components are lazy imports, the router is made in
// createAppRouter. `public: true` routes need no identity.
import { createRouter, createWebHistory, type LocationQueryValue, type RouteRecordRaw, type Router } from 'vue-router'
import { providers, session } from './session'
import { safeRedirect } from './ui/session'
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

// govengers/auth has no change-password route: wire the app's own call here or drop the route.
const change = async (): Promise<void> => { throw new Error('Changing the password is not available.') }

/** LoginPage's props for the way back in `redirect`; LoginRoute.vue binds them. */
export const loginProps = (redirect: Redirect) => ({
  login: (credentials: LoginCredentials) => login(credentials, redirect),
  change,
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
    meta: { page: 'auth.loggedOut', title: 'Signed out', intent: 'See that the session ended', public: true },
  },
  {
    path: '/', name: 'home', component: () => import('./pages/Home/Home.vue'),
    meta: { page: 'home', title: 'Home', intent: 'Start here' },
  },
]

/** The router with the guard: a route that is not public needs an identity, else the login page with the way back. */
export function createAppRouter(): Router {
  router = createRouter({ history: createWebHistory(), routes })
  router.beforeEach((to) => {
    if (to.meta.public === true || session.identity.value !== null) return true
    return { name: 'auth.login', query: { redirect: to.fullPath } }
  })
  return router
}

/** Logout from the user menu: the session ends, then the signed-out screen. */
export async function logout(): Promise<void> {
  await session.logout()
  await router?.replace({ name: 'auth.loggedOut' })
}
