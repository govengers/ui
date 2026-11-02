---
name: LoginForm
tier: block
intent: [login form, sign in, log in, password login, two-factor, 2fa code, one-time code, remember me, sso button]
uses: [Card, Banner, Button, Checkbox, Field, Input]
livewire: false
status: ready
laws: [parkinsons-law]
---

# LoginForm

Email, password and "Remember me" in a Card. The page passes `login`, and the message of the
error it throws shows in a danger Banner. When `login` answers `{ twoFactor: true }`, a second
step asks for a 6-digit code and calls `login` again with it. Centre it with the `LoginPage`
recipe.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `LoginForm.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Card`, `Banner`, `Button`, `Checkbox`, `Field`, `Input` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `LoginForm.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `login` | `(credentials: LoginCredentials) => Promise<{ twoFactor?: boolean } \| void>` | required | throws an `Error` (or `ApiError`) whose `message` is shown |
| `title` | `string \| undefined` | `ui.signIn` | |

`LoginCredentials` is exported from `LoginForm.vue`: `{ email, password, remember, code? }`.
`code` is set only in the second step.

## Slots

| Slot | Content |
|------|---------|
| `logo` | above the title |
| `sso` | above the fields, first step only: a `Button block` "Continue with SSO" |
| `footer` | under the form: links (forgot password, sign up) |

## Events

None. `login` does the work; navigate from inside it once it succeeded.

## With livewire

It has none: a livewire pair serves one identity (D66), and the identity exists only after the
login. In `login`, end the old pair before the request that sets the session cookie, then make
the new pair once the session answers.

```ts
async function login(credentials: LoginCredentials) {
  pair.value.end()
  const answer = await signIn(credentials) // the app's own fetch to its auth route
  if (answer.twoFactor) return { twoFactor: true }
  pair.value = createLivePair(...)
  await router.push(redirect)
}
```

## Agent

The fields are named `email`, `password`, `remember` and, in the second step, `code`. Submit is
`data-action="login"`. The error Banner is `role="alert"`.

## Gotchas

- Native validation runs first: `required` and `type="email"` stop the submit before `login` is
  called, and the code must match `[0-9]{6}`.
- The code field has `autocomplete="one-time-code"` and `inputmode="numeric"`, and it takes the
  focus when the second step opens.
- There is no way back from the code step; a page that wants one remounts the form (`:key`).
- Do not show the server's reason for a failed login ("no such user"); throw one sentence for
  every wrong-credentials case.
