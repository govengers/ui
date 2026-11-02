---
name: Login and session
tier: pattern
intent: [login, sign in, authentication, session, logout, two-factor, sso]
uses: [LoginPage, LoginForm, AppShell, Banner]
livewire: false
status: ready
---

# Login and session

Authentication is the one thing outside livewire (D26): the session cookie is set by the auth
endpoints of `govengers/auth`, and the livewire pair is rebuilt afterwards.

## Flow

1. `LoginPage` (bare `AppShell`, centred `Card`) renders `LoginForm` with a `login` function
   that POSTs the credentials, handles `{ twoFactor: true }`, and on success calls the app's
   `resume()` (ends the empty pair, asks `/auth/me`, builds the identity's pair).
2. SSO: a Button in the `sso` slot that navigates to the provider's start URL; the callback lands
   on a route that calls `resume()`.
3. Logout: end the pair, POST logout, build the empty pair, go to the login route.
4. A 4401 close or a 401 from any call: the `onUnauthorized` of the pair sends the user to
   login; impersonation shows the shell's `Banner` danger with "Stop".

## Rules

- Never store a token in `localStorage`; the cookie is the session.
- The login page never shows the app's navigation (`AppShell bare`).
- Field names `email`, `password`, `code`; the submit is `data-action="login"`.
