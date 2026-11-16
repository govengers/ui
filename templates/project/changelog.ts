// The release notes WhatsNew shows (D62): one file per minor line in changelog/ at the project
// root. Goes to src/changelog.ts; a project test asserts changelogErrors is empty.
import { parseChangelogs } from './ui/changelog'

const files = import.meta.glob<string>('/changelog/*.md', { query: '?raw', import: 'default', eager: true })
export const { lines: releases, errors: changelogErrors } = parseChangelogs(files)
