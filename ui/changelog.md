---
name: changelog
tier: primitive
intent: [changelog, release notes, version history, parse changelog, whats new decision, show release notes once]
uses: []
livewire: false
status: ready
laws: [paradox-of-the-active-user, peak-end-rule]
---

# changelog

The parser for a project's `changelog/<major>.<minor>.md` files and the pure decision "show
what's new?" (D62): `parseChangelog`, `parseChangelogs`, `mergedGroups`, `decideWhatsNew`,
`versionLine`, `plainVersion`, `compareVersions`. A module without Vue; `WhatsNew` and the `Changelog` recipe
render what it returns. A single file, `ui/changelog.ts`; `ui-copy` copies the file.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `changelog.ts` | to use it: skim; to change it: read | the behaviour |

Do not load:

| Skip | Why |
|------|-----|
| `changelog.test.ts` | tests are not copied and not needed to use it |
| other pieces | one piece per need |

## File format

One file per minor line, `changelog/2.4.md`, English (a second language is a twin file the
project parses as its own set):

```md
# 2.4 - Saved filters

One optional sentence about the line.

## 2.4.1 - 2026-11-10

### Fixes
- The export no longer drops customers without a country.

## 2.4.0 - 2026-11-03

### Features
- Save any filter under a name and share its link.
```

- `# M.m - Title` once, first; `## M.m.p - YYYY-MM-DD` per patch of that line; `### Features`,
  `### Fixes`, `### Changes` or `### Security` (any case) under a release; `-` or `*` bullets, a
  wrapped bullet is indented. The dash may be a hyphen, an en dash or an em dash.
- A file named `<M>.<m>.md` holds that line. HTML comments, also over several lines, are skipped.
- Anything else is refused with `file:line: problem`, never dropped silently.

## API

| Export | What |
|--------|------|
| `parseChangelog(file, text)` | one file to a `ReleaseLine` (`line`, `title`, `intro`, `releases` newest first, each `{ version, date, groups }`); throws `ChangelogError` |
| `parseChangelogs(files)` | `Record<path, text>` to `{ lines, errors }`, newest line first; a broken or duplicate file is left out and named in `errors` |
| `mergedGroups(line)` | the line's groups merged over its releases, x.y.0 items first |
| `decideWhatsNew(lines, running, seen)` | `{ show, remember }`, see below |
| `versionLine(version)` | `v2.4.1-rc.1` to `2.4`; `undefined` for `development` |
| `plainVersion(version)` | `v2.4.1-rc.1` to `2.4.1`, the form of a release heading; `undefined` for `development` |
| `compareVersions(a, b)` | numeric order of `M.m` or `M.m.p` |

## The decision

`decideWhatsNew` shows the running minor line once per user when all hold: the running version
is a release (`versionLine` answers), the user last saw an older line, and the running line has
at least one Features item. A user with nothing stored is baselined silently (`remember` set,
`show` empty): a new user is not behind. A patch alone never shows; announce a batch of fixes as
a minor with a Features bullet. A rollback (stored line newer) shows nothing.

## With Vite

```ts
// src/changelog.ts
import { parseChangelogs } from '@/ui/changelog'
const files = import.meta.glob<string>('/changelog/*.md', { query: '?raw', import: 'default', eager: true })
export const { lines: releases, errors: changelogErrors } = parseChangelogs(files)
```

A project test asserts `changelogErrors` is empty, so a typo fails CI and never the running app.

## Gotchas

- Bullets are plain text: inline markdown (backticks, links) shows as typed. Keep them short.
- The running version comes from the build (`import.meta.env.VITE_APP_VERSION`); a dev build
  without one never shows the notes.
