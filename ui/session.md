---
name: session
tier: block
intent: [session, login, logout, current user, who am i, sign out, identity change, livewire pair, impersonate, dev login, redirect after login]
uses: []
livewire: true
status: ready
laws: [teslers-law]
---

# session

`createSession(options)` is the one place an application changes who it acts as, against
govengers/auth as it is (D56): password login with the TOTP step, logout, development login,
impersonation start and stop, and the livewire pair that follows the identity. Every change ends
the pair before the request that changes the cookie and builds the next pair from what
`GET /auth/me` answers afterwards, whatever the change did (livewire D66). Changes run one after
the other. A single file, `ui/session.ts`, with `safeRedirect` for the return path.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `session.ts` | to use it: skim; to change it: read | the behaviour |
| `patterns/login-and-session.md` | wiring it into a project | the whole flow, routes and guard |
| `templates/project/session.ts`, `templates/project/router.ts` | wiring it into a project | the instance and the guard |

Do not load:

| Skip | Why |
|------|-----|
| `session.test.ts` | the test is not copied and not needed to use it |
| other pieces | one piece per need |

## API

| Export | What |
|--------|------|
| `createSession(options)` | the `Session`; make one per app in `src/session.ts` |
| `safeRedirect(raw, fallback = '/')` | a same-origin path from `route.query.redirect`, else `fallback` |
| `identityKey(identity)` | `provider:subject`, `impersonator>target` while impersonating, `""` for nobody |
| `AuthError` | a refused auth route: `status` and govengers/auth's closed `code` |
| types | `SessionIdentity`, `RedirectProvider`, `DevUser`, `PasswordCredentials`, `SessionOptions` |

Options: `createPair(key, onUnauthorized)` (required: builds the pair, passes `onUnauthorized`
to both the client and the connection), `providers` (redirect logins), `paths` (`me`,
`password`, `impersonation`, `dev` prefixes, govengers/auth defaults), `onSignedOut` (route to
the login page), `fetch` and `navigate` (tests).

`Session`:

| Member | Route | Notes |
|--------|-------|-------|
| `pair`, `identity` | | shallow refs; `livePlugin(session.pair)`; `identity` is `null` for nobody |
| `resume()` | `GET /auth/me` | call before mounting, and on the route an OIDC or GitHub login returns to |
| `login({ identifier, password })` | `POST /auth/password/login` | `{ twoFactor: true }` on the `totp` challenge |
| `login({ ..., code, backupCode })` | `POST /auth/password/totp/verify` | the second step |
| `logout()` | redirect provider: `GET <prefix>/logout`; else `POST /auth/password/logout` | the password route ends any session |
| `devUsers()`, `devLogin(id)` | `GET /auth/dev/users`, `POST /auth/dev/login` | `[]` when the server has no dev login (404) |
| `impersonate(subject)`, `stopImpersonating()` | `POST`, `DELETE /auth/impersonation` | identity changes like a login |
| `loginHref(provider, redirect)` | `<prefix>/login?return_to=` | sanitised through `safeRedirect` |

## With livewire

The session owns the pair: `livePlugin(session.pair)` and every composable follow it. A 401 from
the client or a 4401 close of the current pair resumes; when that leaves nobody, `onSignedOut`
runs once. An earlier pair's callback is ignored.

## Gotchas

- `totp_setup` (TOTP required, none enrolled) throws `AuthError` code `totp_setup_required`; the
  enrolment screen is the app's (`/auth/password/totp/setup`, `/enable`).
- govengers/auth's `/auth/me` does not answer the impersonation end; an app that wants the
  countdown adds `impersonationEndsAt` to its own `/auth/me` handler.
- A redirect logout navigates away; the promise resolves before the page unloads.
- Never store a token: the cookie is the session.
