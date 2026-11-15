import { expect, test } from 'bun:test'
import { changelogErrors, releases } from './changelog'

// The test a project keeps next to its src/changelog.ts: a typo fails CI, never the running app.
test('every changelog file parses', () => {
  expect(changelogErrors).toEqual([])
  expect(releases.map((line) => line.line)).toEqual(['2.4', '2.3', '2.2'])
})
