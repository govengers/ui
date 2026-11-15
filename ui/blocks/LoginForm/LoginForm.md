---
name: LoginForm
tier: block
intent: [login form, sign in, log in, password login, user name or email, two-factor, 2fa code, backup code, one-time code, sso button, oidc login, github login, sso first]
uses: [Card, Banner, Button, Field, Input]
livewire: false
status: ready
laws: [parkinsons-law, hicks-law]
---

# LoginForm

The sign-in card against govengers/auth (D57): user name or email and password, the redirect
providers (OIDC, GitHub) as buttons from a prop, and the TOTP step with a switch to a backup
code. `layout="sso"` puts the providers first and the password form behind a link. The page
passes `login` (the session module's `login` plus the navigation); a refusal with a known
govengers/auth `code` shows as its own sentence. Centre it with the `LoginPage` recipe.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `LoginForm.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Card`, `Banner`, `Button`, `Field`, `Input` | when their props show up here | what the composed pieces do |
| `ui/session.md` | wiring `login` and `providers` | where both come from |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `LoginForm.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `login` | `(credentials: LoginCredentials) => Promise<{ twoFactor?: boolean } \| void>` | required | throws an error; with a `code` below its sentence shows, else its `message` |
| `title` | `string \| undefined` | `ui.signIn` | |
| `providers` | `LoginProvider[]` | `[]` | `{ name, label, href }`; `href` from `session.loginHref(provider, redirect)` |
| `layout` | `password \| sso` | `password` | `sso`: providers as primary buttons, "Sign in with a password" reveals the form |

`LoginCredentials` (exported): `{ identifier, password, code?, backupCode? }`; `code` and
`backupCode` only in the second step. `LoginProvider` is exported too.

Codes shown as sentences: `invalid_credentials`, `invalid_totp_code`, `no_pending_login` (also
returns to the first step), `totp_setup_required` (the session module's code for the
`totp_setup` challenge).

## Slots

| Slot | Content |
|------|---------|
| `logo` | above the title |
| `footer` | under the form: links (forgot password, sign up) |

## Events

None. `login` does the work; navigate from inside it once it succeeded.

## With livewire

None: a pair serves one identity, which exists only after the login. The session module ends
the pair before the request and builds the next one after it (`ui/session.md`):

```ts
async function login(credentials: LoginCredentials) {
  const answer = await session.login(credentials)
  if (!answer.twoFactor) await router.replace(safeRedirect(route.query.redirect))
  return answer
}
```

## Agent

Fields `identifier`, `password` and, in the second step, `code`. Submit is `data-action="login"`;
each provider button is `data-action="loginSso"` with `data-provider="<name>"`. The error
Banner is `role="alert"`.

## Gotchas

- govengers/auth has no "remember me": the session lives `MaximumAge` from the login, so the
  form offers none (D57). The `ui.rememberMe` key stays for copies made before.
- The identifier field is plain text (`autocomplete="username"`): govengers/auth accepts a user
  name or an email, whichever its options enable.
- The TOTP code must match `[0-9]{6}`; a backup code has no pattern.
- There is no way back from the code step; a page that wants one remounts the form (`:key`).
- Do not show the server's reason for a failed login; govengers/auth answers one code for every
  wrong-credentials case and the form keeps it that way.
