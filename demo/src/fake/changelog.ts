// The demo application's changelog files, as a project keeps them in changelog/<major>.<minor>.md
// and reads them with import.meta.glob (changelog card). Inline here because every .md under ui/
// and pages/ is a card.

import { parseChangelogs } from '../../../ui/changelog'

export const changelogFiles: Record<string, string> = {
  '/changelog/2.4.md': `# 2.4 - Saved filters

Name a filter once, use it everywhere.

## 2.4.1 - 2026-11-10

### Fixes
- The export no longer drops customers without a country.
- Dates in the order list follow the language setting.

## 2.4.0 - 2026-11-03

### Features
- Save any filter of the customer list under a name and share its link.
- Counts next to every facet value update live.
- Pick the columns of every table; the choice is remembered.

### Changes
- The customer drawer opens on the right on every screen size.

### Security
- Sessions end after 12 hours without activity.
`,
  '/changelog/2.3.md': `# 2.3 - Background jobs

## 2.3.2 - 2026-10-20

### Fixes
- A failed import shows the row that broke it.

## 2.3.0 - 2026-10-06

### Features
- Exports and imports run in the background; follow them on the dashboard.
- Upload attachments to a customer by drag and drop.
`,
  '/changelog/2.2.md': `# 2.2 - Dark mode

## 2.2.0 - 2026-09-15

### Features
- The app follows the system's dark mode; pin light or dark in the settings.

### Fixes
- Long customer names no longer push the actions off the row.
`,
}

export const { lines: releases, errors: changelogErrors } = parseChangelogs(changelogFiles)
