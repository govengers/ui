---
name: LoginPage
tier: page
intent: [login page, sign in page, logout page, logged out, signed out, change password, sso login, authentication screen, session expired]
uses: [AppShell, Page, PageHeader, Card, Banner, Badge, Button, Field, Input, LoginForm]
livewire: false
status: ready
laws: [pareto-principle]
---

# LoginPage

The three auth screens of an application in one file, on a bare `AppShell` (no navigation):
sign in (`LoginForm` with SSO above and "Forgot password?" below), signed out (a sentence and
"Sign in again") and change password (three password Fields). A centred column of 26rem with
the imprint link and the app's version under the card. Outside livewire (login-and-session).

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `LoginPage.vue`, `actions.ts`, `messages.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `AppShell`, `Page`, `PageHeader`, `Card`, `Banner`, `Badge`, `Button`, `Field`, `Input`, `LoginForm` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| the cards of its blocks, `patterns/` guide named below, the laws in `laws` | when composing | shape, reasons, review questions |

Do not load:

| Skip | Why |
|------|-----|
| `LoginPage.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `state` | `login \| loggedOut \| changePassword` | `login` | the screen; one route per state |
| `login` | `(credentials: LoginCredentials) => Promise<{ twoFactor?: boolean } \| void>` | required | the app's sign-in (see `LoginForm`): ends the empty pair, POSTs, builds the identity's pair, navigates |
| `change` | `(passwords: { currentPassword, newPassword }) => Promise<void>` | required | throws an `ApiError` whose `fields` show at the Fields, or an `Error` whose message shows in a Banner |
| `loginRoute` | `RouteLocationRaw` | `{ name: 'auth.login' }` | where "Sign in again" goes |
| `version` | `string \| undefined` | none | shown as a Badge under the card |

## Slots

| Slot | Content |
|------|---------|
| `logo` | the app's logo in the top bar; the app name (`auth.app`) by default |

## Agent

`data-page` follows the state: `auth.login`, `auth.loggedOut`, `auth.changePassword`. Actions in
`actions.ts`: `login` (LoginForm's submit), `loginSso` (the SSO button, an `<a>` to
`/auth/sso/start`) and `changePassword` (the submit). They are declared for `app-map.json` and
never bound: drive mode treats an unbound action as mutating and pauses on its button (D52), so
the user signs in and changes the password themselves. Field names: `email`, `password`,
`remember`, `code`; `currentPassword`, `newPassword`, `confirmPassword`.

## Layout

The page's h1 is the `PageHeader` with `ui-visually-hidden`: `LoginForm` carries its own visible
title ("Sign in"), and a second visible heading saying the same would stack two titles. The other
two screens follow the same shape so the three look alike: hidden h1, Card with the visible title.

## Messages

`messages.ts` holds every string under `auth.*` in `en` and `de`, including `auth.app` (the app
name). Mounted with `useI18n({ useScope: 'global', messages })`, the convention of every page
recipe: one `t` for the page's keys and the `ui.*` keys.

## When copying

1. `ui-copy LoginPage` lands it in `src/pages/LoginPage/`; rename the folder (`src/pages/Auth/`).
2. Set `auth.app`, the SSO start URL (`/auth/sso/start`), the forgot-password and imprint hrefs.
3. Routes, one per state, sharing the functions of the app's auth module:
   `{ path: '/login', name: 'auth.login', component: LoginPage, props: { login, change }, meta: { page: 'auth.login', title: 'Sign in', intent: 'Sign in' } }`,
   `/logged-out` with `props: { state: 'loggedOut', login, change }`, `/change-password` with
   `state: 'changePassword'`. Pass `version` from the build (`import.meta.env.VITE_APP_VERSION`).
4. In `login`, follow the LoginForm card: end the pair before the request that sets the cookie,
   build the next pair after it, then navigate.

## Gotchas

- The new password needs 12 characters (`minlength`, native validation); the repeat is checked
  on the page before `change` runs. Change both in the project's policy.
- A successful change clears the three fields and shows a success Banner; navigate in `change`
  when the app wants to leave the screen instead.
- Never show the server's reason for a failed sign-in; `login` throws one sentence for every
  wrong-credentials case (LoginForm card).
