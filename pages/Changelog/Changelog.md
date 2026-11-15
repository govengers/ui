---
name: Changelog
tier: page
intent: [changelog page, release notes page, version history, what changed, all changes, whats new page]
uses: [Page, PageHeader, Card, Badge, EmptyState, changelog, format]
livewire: false
status: ready
laws: [jakobs-law, law-of-common-region]
---

# Changelog

The release notes page: every minor line of the parsed changelog, newest first, one Card per line
with its title and intro, then each release with its date and its groups (New, Fixed, Changed,
Security). The running release carries a "Current" badge, and every release has an anchor
(`#v2-4-1`) that `WhatsNew`'s "All changes" link or a support answer can point at. Static: the
notes ship with the bundle, no read (D56).

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Changelog.vue`, `actions.ts`, `messages.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Page`, `PageHeader`, `Card`, `Badge`, `EmptyState`, `changelog`, `format` | when their props show up here | what the composed pieces do; the file format |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Changelog.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `releases` | `readonly ReleaseLine[]` | required | `parseChangelogs(files).lines` |
| `version` | `string \| undefined` | none | the running build (`v2.4.1` and `2.4.1-rc.1` count as `2.4.1`); its release gets the "Current" badge |

## Agent

`data-page="help.changelog"`. Read only: `actions.ts` exports an empty list. Release anchors are
`#v<major>-<minor>-<patch>`.

## Messages

`messages.ts` holds `help.changelog.*` in `en` and `de`; the group headings are the
`ui.group*` keys WhatsNew shows too, so the dialog and the page name groups alike.

## When copying

1. `ui-copy Changelog` lands it in `src/pages/Changelog/`; copy `ui/changelog.ts` with it.
2. Keep the notes in `changelog/<major>.<minor>.md` at the project root and parse them once in
   `src/changelog.ts` (changelog card, "With Vite"); add the test that `changelogErrors` is empty.
3. Route: `{ path: '/changelog', name: 'help.changelog', component: Changelog, props: { releases, version: import.meta.env.VITE_APP_VERSION }, meta: { page: 'help.changelog', title: 'Changelog', intent: 'See what changed in each version' } }`.
4. Link it from the user menu and from `WhatsNew` (`:to="{ name: 'help.changelog' }"`).

## Gotchas

- The notes are English plus one twin set per extra language; the page shows the set the app
  passes. Pick the set by locale in `src/changelog.ts`, not here.
- Dates are formatted at local noon, so `2026-11-10` never shows as the 9th west of UTC.
