---
name: ApiKeyManager
tier: block
intent: [api keys, api tokens, personal access tokens, create api key, revoke key, machine access, agent access, key scopes, key expiry]
uses: [Badge, Banner, Button, Checkbox, Dialog, EmptyState, Field, Icon, Input, Select, Table, Toast, format]
livewire: true
status: ready
laws: [peak-end-rule, cognitive-load]
---

# ApiKeyManager

The signed-in user's API keys over livewire (D60): a live table (name and non-secret prefix,
scopes, created, last used, expiry with an expiring or expired badge), "New API key" (name,
scopes, expiry) that shows the secret once with a copy button, and revoke behind a danger
confirmation. Fits govengers/auth's issued keys (`<prefix>_<id>.<secret>`, scopes as
permissions, optional expiry, last use); the app declares the three livewire operations.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `ApiKeyManager.vue`, `ApiKeyCreate.vue`, `apiKeys.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Badge`, `Banner`, `Button`, `Checkbox`, `Dialog`, `EmptyState`, `Field`, `Icon`, `Input`, `Select`, `Table`, `Toast`, `format` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `ApiKeyManager.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `target` | `LiveTarget<never, ListResponse<ApiKeyRow>>` | required | the caller's keys, read whole (`live.apiKeys`) |
| `create` | `MutationTarget<NoParameters, { name, scopes, expiresAt }, { secret }>` | required | answers the row plus `secret` |
| `revoke` | `MutationTarget<{ id }, undefined, unknown>` | required | |
| `scopes` | `ApiKeyScope[]` | required | `{ value: 'tasks:read', label, description? }`; unknown scopes on a row show as their text |
| `expiryDays` | `number[]` | `[90, 30, 365, 0]` | the choices, first preselected; `0` is never |

`ApiKeyRow` (exported from `apiKeys.ts`): `{ id, name, prefix, scopes, expiresAt, lastUsedAt,
createdAt }`, times as RFC 3339 strings or `null`.

## With livewire

```go
// The app's registry: the owner is the identity in the context, never a parameter.
livewire.NewResource("apiKeys", ...)            // Scope: owner = identity's user; no secret column
livewire.NewMutation("createApiKey", POST /api-keys)   // store.Issue; answers the row + secret; no Upserts effect
livewire.NewMutation("revokeApiKey", DELETE /api-keys/{id}) // Removes("apiKeys")
```

- `createApiKey` must not declare an `upserts` effect on `apiKeys`: the runtime would put its
  answer (with the secret) into every live list until the next push. The push of the insert
  brings the row without it.
- A key cannot manage keys: mount the three operations behind a check that refuses API-key
  identities (the session only), or an agent with a key mints itself more.
- Scopes cap the owner's permissions; offer only scopes the owner holds.

## Agent

"New API key" opens the dialog; its submit is `data-action="createApiKey"` (the `create`
descriptor's name). Each row's Revoke and the confirmation are `data-action="revokeApiKey"`,
the row button with `data-key="<id>"`. Fields: `name`, `scopes`, `expiresAt`. Never bound:
drive mode pauses on both (D52); an agent never creates its own credentials.

## Gotchas

- The secret lives only in the dialog's state; closing it (Done, Escape is off while it shows)
  forgets it, and so does a new connection (another identity: logout, user switch,
  impersonation) or the end of the current one (a 4401 while `/auth/me` cannot be read keeps
  the ended pair), which also closes both dialogs (`forgetWhenGone`). A create that answers after either is dropped
  (`attempts`). Nothing writes it to storage. While the closed dialog fades out it keeps the
  secret's layout with the field emptied, not the create form (D94).
- Copy uses `navigator.clipboard` (secure contexts only). A write that worked toasts `ui.copied`
  (the app mounts the Toast host once) and the button says Copied for 2 s; a refused one (no
  clipboard, denied) turns the button back to Copy and shows `ui.copyFailed` under the field,
  which stays selectable by hand. A write that settles after a newer copy, a close or the unmount
  does nothing.
- Expiry is computed on the client from the chosen days (`expiresAtFor`); the server validates
  it like any other input and may cap it.
- Rows are sorted newest first on the client; the list is read whole (a user has a handful).
