---
name: SettingsPage
tier: page
intent: [settings page, preferences, configuration page, profile page, account page, notification settings, delete workspace, danger zone, theme setting, language setting]
uses: [Page, PageHeader, Tabs, Card, Field, Input, Select, Switch, Button, Avatar, Banner, Skeleton, Dialog, Toast, DetailForm, LiveForm, FileUpload, theme, agent]
livewire: true
status: ready
laws: []
---

# SettingsPage

The settings of a workspace in four tabs on `?tab=`: General, Profile, Notifications, Danger
zone. Every Card is its own form with its own save, never one Save for the page
(building-a-settings-page). Width `content`, the dangerous card last and red only on its button.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `SettingsPage.vue`, `actions.ts`, `messages.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Page`, `PageHeader`, `Tabs`, `Card`, `Field`, `Input`, `Select`, `Switch`, `Button`, `Avatar`, `Banner`, `Skeleton`, `Dialog`, `Toast`, `DetailForm`, `LiveForm`, `FileUpload`, `theme`, `agent` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| the cards of its blocks, `patterns/` guide named below, the laws in `laws` | when composing | shape, reasons, review questions |

Do not load:

| Skip | Why |
|------|-----|
| `SettingsPage.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## What it shows

| Tab | Cards | Data path |
|-----|-------|-----------|
| General | `DetailForm` "Workspace": company name, support email, time zone, default language | `useLiveForm(live.settings, calls.updateSettings, pick)`: Save sends only the touched fields |
| Profile | "Profile": `Avatar`, `FileUpload` for the picture, name and email read only; "Appearance": theme and language | `useLive(live['users.item'], { id })`, `uploads.uploadFile`, `useTheme()`, the vue-i18n `locale` |
| Notifications | two `Switch`es that save on change and toast "Saved" | a second `useLiveForm` on `live.settings` with its own `pick`; a refusal resets the switch |
| Danger zone | the explanation and a danger Button; a danger `Dialog` that enables Delete only once the workspace name is typed | the name is `companyName` of the General form's record |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `tab` | `general \| profile \| notifications \| danger \| undefined` | `?tab=` | pins the tab; leave it unset in the router so the URL decides |

## Tabs

The routed form of `Tabs`: every tab is a link to `{ query: { tab } }`, so the back button and a
deep link (`/settings?tab=notifications`) work, and the agent's `navigate` reaches a tab. The
active tab is derived from `route.query.tab`; an unknown value shows General.

## Agent

`data-page="settings.general"` for every tab (one route, one page). Actions in `actions.ts`:

| Action | Bound to | Notes |
|--------|----------|-------|
| `updateSettings` | the General Save button and both Switches | `run` calls `calls.updateSettings` with the params |
| `deleteWorkspace` | the Danger zone button and the dialog's Delete | `run` only opens the confirmation; the user types the name and confirms |

Field names equal the setting names (`companyName`, `supportEmail`, `timezone`, `language`,
`notifyByEmail`, `weeklyDigest`); the profile's are `avatar`, `name`, `email`, `theme`, `locale`;
the confirmation's is `workspaceName`.

## Messages

`messages.ts` holds every page string under `settings.*` in `en` and `de`. The page mounts them
with `useI18n({ useScope: 'global', messages })`: vue-i18n merges them into the global messages,
so one `t` resolves the page's keys and the `ui.*` keys (`ui.cancel`, `ui.retry`,
`ui.loadFailed`) and follows the app's locale. This is the convention of every page recipe.

## When copying

1. `ui-copy SettingsPage` lands it in `src/pages/SettingsPage/`; rename the folder to the area
   (`src/pages/Settings/`).
2. Rewrite the descriptor line: `@/fake/api` becomes `@/api/api` (the comment above it says so).
3. Resolve every `// REPLACE:`: the user id from the session, the picture saved on the user, the
   `deleteWorkspace` call.
4. Route: `{ path: '/settings', name: 'settings', component: SettingsPage, meta: { page: 'settings.general', title: 'Settings', intent: 'Change workspace settings, your profile and notifications' } }`.
5. Change the `pick`s and Fields to the project's settings; each Card saves only what it picks.

## Gaps against the demo API

- No `updateUser` call: name and email are read only, and an uploaded picture is not set on
  the user. A project with the call replaces the profile Fields with a `DetailForm` over
  `useLiveForm(live['users.item'], { id }, calls.updateUser)`.
- No `deleteWorkspace` call: the dialog's Delete closes and toasts.
- `Settings` has no currency field, so General has none.
- The Profile language changes the vue-i18n `locale` for this tab only; a project persists it on
  the user, like the theme through `useTheme({ persist })`.

## Gotchas

- Two `useLiveForm`s over one record are fine: each saves only its own `pick`, and a push
  refills the other's untouched fields.
- The toast host is mounted once in the app shell; the page only calls `toast()`.
- `Intl.supportedValuesOf('timeZone')` lacks `UTC` in Chrome; the page adds it.
- `FileUpload` with `max-files="1"` counts the finished upload, so a second picture needs a
  reload until the project wires `remove`.
- `useTheme()` applies the theme through a watcher made by its first caller. Call it once in the
  shell (`App.vue`) so that caller never unmounts; if this page is the first, a theme chosen
  after leaving and coming back is not applied.
- The Danger zone button and the dialog's Delete both carry `data-action="deleteWorkspace"`.
  `resolveTarget` searches an open modal dialog first, so a plan's first click opens the dialog
  and its second lands on the dialog's Delete; drive mode pauses on both (mutating).
