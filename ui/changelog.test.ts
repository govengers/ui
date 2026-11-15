import { describe, expect, test } from 'bun:test'
import { ChangelogError, compareVersions, decideWhatsNew, mergedGroups, parseChangelog, parseChangelogs, plainVersion, versionLine } from './changelog'

const line24 = `# 2.4 - Saved filters

Filters you can name and share.

## 2.4.1 - 2026-11-10

### Fixes
- The export no longer drops customers
  without a country.

## 2.4.0 - 2026-11-03

### Fixes
- Sorting by name ignores case.

### Features
- Save any filter under a name.
* Share a filter by its link.
`

const line23 = `# 2.3 – Columns

## 2.3.0 - 2026-10-01

### Changes
- The table remembers its columns.
`

describe('parseChangelog', () => {
  test('a minor line with its releases, newest first, groups in order', () => {
    const parsed = parseChangelog('2.4.md', line24)
    expect(parsed.line).toBe('2.4')
    expect(parsed.title).toBe('Saved filters')
    expect(parsed.intro).toBe('Filters you can name and share.')
    expect(parsed.releases.map((release) => release.version)).toEqual(['2.4.1', '2.4.0'])
    expect(parsed.releases[0]?.groups).toEqual([{ group: 'Fixes', items: ['The export no longer drops customers without a country.'] }])
    expect(parsed.releases[1]?.groups.map((group) => group.group)).toEqual(['Features', 'Fixes'])
    expect(parsed.releases[1]?.date).toBe('2026-11-03')
  })

  test('accepts an en or em dash in the headings, CRLF and comments', () => {
    expect(parseChangelog('2.3.md', line23).title).toBe('Columns')
    const em = '# 1.0 \u2014 First\r\n<!-- keep -->\r\n## 1.0.0 \u2014 2026-01-02\r\n### features\r\n- One\r\n'
    expect(parseChangelog('1.0.md', em).releases[0]?.groups[0]).toEqual({ group: 'Features', items: ['One'] })
  })

  test.each([
    ['', 'empty file'],
    ['## 1.0.0 - 2026-01-01', 'expected "# <major>.<minor> - <title>" first'],
    ['# 1.0 - A\n## 1.1.0 - 2026-01-01', '1.1.0 does not belong to the line 1.0'],
    ['# 1.0 - A\n## 1.0.0 - 2026-02-30', '2026-02-30 is not a date'],
    ['# 1.0 - A\n## 1.0.0 - 2026-01-01\n## 1.0.0 - 2026-01-02', '1.0.0 appears twice'],
    ['# 1.0 - A\n## 1.0.0 - 2026-01-01\n### Ideas', 'unknown group "Ideas"'],
    ['# 1.0 - A\n### Fixes', 'a group before the first "## " release'],
    ['# 1.0 - A\n## 1.0.0 - 2026-01-01\n- loose bullet', 'expected a "### <group>" heading'],
    ['# 1.0 - A\n## 1.0.0 2026-01-01', 'expected "## <major>.<minor>.<patch> - YYYY-MM-DD"'],
    ['# 1.0 - A\n# 1.1 - B', 'a second "# " heading'],
  ])('refuses %j with its line', (text, problem) => {
    expect(() => parseChangelog('x.md', text)).toThrow(ChangelogError)
    expect(() => parseChangelog('x.md', text)).toThrow(problem)
  })

  test('refuses a file named for another line and a comment that never ends; skips a multi-line one', () => {
    expect(() => parseChangelog('changelog/2.5.md', '# 2.4 - T\n## 2.4.0 - 2026-11-03\n### Features\n- a')).toThrow('changelog/2.5.md:1: the file is named for 2.5, the heading says 2.4')
    expect(() => parseChangelog('2.4.md', '# 2.4 - T\n<!--\nnote\n')).toThrow('2.4.md:2: an HTML comment that never ends')
    const commented = parseChangelog('2.4.md', '# 2.4 - T\n<!--\nnote\n-->\n## 2.4.0 - 2026-11-03\n### Features\n- a')
    expect(commented.intro).toBe('')
    expect(commented.releases).toHaveLength(1)
  })
})

describe('parseChangelogs', () => {
  test('newest line first; a broken or duplicate file is left out and named', () => {
    const { lines, errors } = parseChangelogs({ '/changelog/2.3.md': line23, '/changelog/2.4.md': line24, '/changelog/2.10.md': '# 2.10 - Later\n', '/changelog/bad.md': 'nonsense', '/changelog/dup.md': line23 })
    expect(lines.map((line) => line.line)).toEqual(['2.10', '2.4', '2.3'])
    expect(errors).toHaveLength(2)
    expect(errors[0]).toStartWith('/changelog/bad.md:1:')
    expect(errors[1]).toContain('the line 2.3 is in two files')
  })
})

describe('versions', () => {
  test('versionLine', () => {
    expect(versionLine('2.4.1')).toBe('2.4')
    expect(versionLine('v2.4.1-rc.1')).toBe('2.4')
    expect(versionLine('2.04')).toBe('2.4')
    expect(versionLine('development')).toBeUndefined()
    expect(versionLine(null)).toBeUndefined()
  })

  test('plainVersion', () => {
    expect(plainVersion('v2.4.1')).toBe('2.4.1')
    expect(plainVersion('2.4.1-rc.1')).toBe('2.4.1')
    expect(plainVersion('2.4.1+abc')).toBe('2.4.1')
    expect(plainVersion('2.4')).toBeUndefined()
    expect(plainVersion('development')).toBeUndefined()
  })

  test('compareVersions is numeric', () => {
    expect(compareVersions('2.10', '2.9')).toBeGreaterThan(0)
    expect(compareVersions('2.4.0', '2.4')).toBe(0)
    expect(compareVersions('1.9.9', '2.0.0')).toBeLessThan(0)
  })

  test('mergedGroups puts the x.y.0 items first', () => {
    const merged = mergedGroups(parseChangelog('2.4.md', line24))
    expect(merged.find((list) => list.group === 'Fixes')?.items[0]).toBe('Sorting by name ignores case.')
    expect(merged.map((list) => list.group)).toEqual(['Features', 'Fixes'])
  })
})

describe('decideWhatsNew', () => {
  const { lines } = parseChangelogs({ a: line23, b: line24 })

  test('first visit is silent and remembers the running line', () => {
    expect(decideWhatsNew(lines, '2.4.1', undefined)).toEqual({ show: undefined, remember: '2.4' })
    expect(decideWhatsNew(lines, '2.4.1', 'garbage')).toEqual({ show: undefined, remember: '2.4' })
  })

  test('a newer minor line with features shows once', () => {
    const decision = decideWhatsNew(lines, '2.4.0', '2.3')
    expect(decision.show?.line).toBe('2.4')
    expect(decision.remember).toBe('2.4')
    expect(decideWhatsNew(lines, '2.4.1', '2.4').show).toBeUndefined()
  })

  test('an older stored full version counts by its line', () => {
    expect(decideWhatsNew(lines, '2.4.1', '2.3.7').show?.line).toBe('2.4')
    expect(decideWhatsNew(lines, '2.4.1', '2.4.0').show).toBeUndefined()
  })

  test('no features, no notes, a rollback or a development build show nothing and store nothing', () => {
    expect(decideWhatsNew(lines, '2.3.0', '2.2')).toEqual({ show: undefined, remember: undefined })
    expect(decideWhatsNew(lines, '2.5.0', '2.4')).toEqual({ show: undefined, remember: undefined })
    expect(decideWhatsNew(lines, '2.3.0', '2.4')).toEqual({ show: undefined, remember: undefined })
    expect(decideWhatsNew(lines, 'development', '2.3')).toEqual({ show: undefined, remember: undefined })
  })
})
