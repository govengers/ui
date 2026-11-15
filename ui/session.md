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
the other. Changes the app did not make (another tab, an impersonation auth ended) are caught by
`check()`, which runs by itself when the tab becomes visible and every minute while
impersonating. A single file, `ui/session.ts`, with `safeRedirect` for the return path.

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
| types | `SessionIdentity`, `RedirectProvider`, `DevUser`, `PasswordCredentials`, `LoginChallenge`, `SessionOptions` |

Options: `createPair(key, onUnauthorized)` (required: builds the pair, passes `onUnauthorized`
to both the client and the connection), `providers` (redirect logins), `paths` (`me`,
`password`, `impersonation`, `dev` prefixes, govengers/auth defaults), `onSignedOut` (route to
the login page), `fetch` and `navigate` (tests). A redirect provider's `name` is the identity's
`provider` after its login: the OIDC provider's `Name` (`company` for `/auth/oidc/company`),
`github` for GitHub; a wrong name logs out through the password route instead.

`Session`:

| Member | Route | Notes |
|--------|-------|-------|
| `pair`, `identity` | | shallow refs; `livePlugin(session.pair)`; `identity` is `null` for nobody |
| `resume()` | `GET /auth/me` | call before mounting, and on the route an OIDC or GitHub login returns to |
| `check()` | `GET /auth/me` | takes the fresh identity (roles, name); a new pair only when the key changed; runs on tab or window focus and every minute while impersonating |
| `login({ identifier, password })` | `POST /auth/password/login` | `{ challenge: 'totp' }` (a code is owed) or `{ challenge: 'totp_setup' }` (enrol first), else `{}` |
| `login({ ..., code, backupCode })` | `POST /auth/password/totp/verify` | the second step |
| `logout()` | redirect provider: `GET <prefix>/logout`; dev login: `POST /auth/dev/logout`; else `POST /auth/password/logout` | by the provider of whoever made the session (the impersonator while impersonating); the password route ends any session but needs the password provider mounted |
| `devUsers()`, `devLogin(id)` | `GET /auth/dev/users`, `POST /auth/dev/login` | unwraps `{ users }`; `[]` when the server has no dev login (404); another body throws |
| `impersonate(subject)`, `stopImpersonating()` | `POST`, `DELETE /auth/impersonation` | identity changes like a login |
| `loginHref(provider, redirect)` | `<prefix>/login?return_to=` | sanitised through `safeRedirect` |

## With livewire

The session owns the pair: `livePlugin(session.pair)` and every composable follow it. A 401 from
the client or a 4401 close of the current pair resumes; when that (or `check()`) leaves nobody
where someone was signed in, `onSignedOut` runs once. An earlier pair's callback is ignored, and
so is the anonymous pair's (nobody cannot be signed out; resuming would only rebuild it). When
`/auth/me` is unreadable the pair stays ended and the session retries with backoff (1 s doubling
to 30 s) until it reads an answer; a change refused by its own route keeps that refusal as its
error even when the read after it fails too.

## Gotchas

- `totp_setup` (TOTP required, none enrolled) answers `{ challenge: 'totp_setup' }`; the
  enrolment screen is the app's (`/auth/password/totp/setup`, `/enable`); its `login` wrapper
  routes there.
- govengers/auth's `/auth/me` does not answer the impersonation end; an app that wants the
  countdown adds `impersonationEndsAt` to its own `/auth/me` handler. Without it the banner has
  no countdown, and the minute poll notices the end.
- A redirect logout navigates away; the promise resolves before the page unloads, and the session serves nobody after it (no retry or check brings the identity back).
- Never store a token: the cookie is the session.
