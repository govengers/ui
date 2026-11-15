// changelog: the parser for `changelog/<major>.<minor>.md` files and the pure "show what's new?"
// decision (D56). No Vue: WhatsNew and the Changelog recipe render what this returns.

/** The groups of a release, in the order they are shown. */
export const changeGroups = ['Features', 'Fixes', 'Changes', 'Security'] as const
export type ChangeGroup = (typeof changeGroups)[number]

export interface ChangeList {
  group: ChangeGroup
  /** One bullet each, as written (inline markdown is not rendered). */
  items: string[]
}

/** One patch release: `## 2.4.1 - 2026-11-10`. */
export interface Release {
  version: string
  /** `YYYY-MM-DD`. */
  date: string
  /** Only the groups with items, in `changeGroups` order. */
  groups: ChangeList[]
}

/** One file: a minor line `# 2.4 - Saved filters` with its releases, newest first. */
export interface ReleaseLine {
  /** `major.minor`. */
  line: string
  title: string
  /** The paragraph between the H1 and the first release, if any. */
  intro: string
  releases: Release[]
}

export class ChangelogError extends Error {
  constructor(file: string, line: number, problem: string) {
    super(`${file}:${line}: ${problem}`)
    this.name = 'ChangelogError'
  }
}

// A hyphen, an en dash or an em dash between the number and the rest; written as escapes so the
// source carries neither dash character.
const dash = String.raw`\s+[-–—]\s+`
const lineHeading = new RegExp(String.raw`^#\s+(\d+\.\d+)${dash}(.+)$`)
const releaseHeading = new RegExp(String.raw`^##\s+(\d+\.\d+\.\d+)${dash}(\d{4}-\d{2}-\d{2})\s*$`)
const groupHeading = /^###\s+(\S.*?)\s*$/
const bullet = /^[-*]\s+(.*)$/

/** The `major.minor` of a version (`v2.4.1`, `2.4.1-rc.1`, `2.4`), or undefined for anything else (`development`). */
export function versionLine(version: string | null | undefined): string | undefined {
  const match = /^v?(\d+)\.(\d+)(?:\.\d+)?(?:[-+].*)?$/.exec((version ?? '').trim())
  return match ? `${Number(match[1])}.${Number(match[2])}` : undefined
}

/** Orders two `major.minor` or `major.minor.patch` strings numerically. */
export function compareVersions(left: string, right: string): number {
  const a = left.split('.').map(Number)
  const b = right.split('.').map(Number)
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

function validDate(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date)
}

/** Parses one changelog file; throws a ChangelogError naming the file and line of the first problem. */
export function parseChangelog(file: string, text: string): ReleaseLine {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let result: ReleaseLine | undefined
  let release: Release | undefined
  let list: ChangeList | undefined
  const intro: string[] = []
  const seen = new Set<string>()

  lines.forEach((raw, index) => {
    const number = index + 1
    const fail = (problem: string): never => { throw new ChangelogError(file, number, problem) }
    const text = raw.trimEnd()
    if (text.trim() === '' || /^<!--.*-->$/.test(text.trim())) return
    if (result === undefined) {
      const heading = lineHeading.exec(text)
      if (!heading) fail('expected "# <major>.<minor> - <title>" first')
      result = { line: heading![1]!, title: heading![2]!.trim(), intro: '', releases: [] }
      return
    }
    if (text.startsWith('# ')) fail('a second "# " heading; one minor line per file')
    if (text.startsWith('## ')) {
      const heading = releaseHeading.exec(text) ?? fail('expected "## <major>.<minor>.<patch> - YYYY-MM-DD"')
      const [, version = '', date = ''] = heading
      if (versionLine(version) !== result.line) fail(`${version} does not belong to the line ${result.line}`)
      if (!validDate(date)) fail(`${date} is not a date`)
      if (seen.has(version)) fail(`${version} appears twice`)
      seen.add(version)
      release = { version, date, groups: [] }
      list = undefined
      result.releases.push(release)
      return
    }
    if (text.startsWith('### ')) {
      if (release === undefined) fail('a group before the first "## " release')
      const name = groupHeading.exec(text)?.[1] ?? ''
      const group = changeGroups.find((candidate) => candidate.toLowerCase() === name.toLowerCase())
      if (group === undefined) fail(`unknown group "${name}"; use ${changeGroups.join(', ')}`)
      list = release!.groups.find((existing) => existing.group === group)
      if (list === undefined) {
        list = { group: group!, items: [] }
        release!.groups.push(list)
      }
      return
    }
    const item = bullet.exec(text.trim())
    if (item && list !== undefined && !/^\s{2,}/.test(raw)) {
      list.items.push(item[1]!.trim())
      return
    }
    // A wrapped bullet continues the bullet above it.
    if (/^\s+\S/.test(raw) && list !== undefined && list.items.length > 0) {
      list.items[list.items.length - 1] += ` ${text.trim()}`
      return
    }
    if (release === undefined) {
      intro.push(text.trim())
      return
    }
    fail('expected a "### <group>" heading or a "- " bullet')
  })

  if (result === undefined) throw new ChangelogError(file, 1, 'empty file')
  result.intro = intro.join(' ')
  for (const entry of result.releases) {
    entry.groups = entry.groups.filter((group) => group.items.length > 0)
    entry.groups.sort((left, right) => changeGroups.indexOf(left.group) - changeGroups.indexOf(right.group))
  }
  result.releases.sort((left, right) => compareVersions(right.version, left.version))
  return result
}

/**
 * Parses every file (path to text, as `import.meta.glob('/changelog/*.md', { query: '?raw',
 * import: 'default', eager: true })` returns it), newest line first. A broken file is left out
 * and named in `errors`; a project test asserts `errors` is empty so CI catches it, the running
 * app never fails on a changelog typo.
 */
export function parseChangelogs(files: Record<string, string>): { lines: ReleaseLine[]; errors: string[] } {
  const lines: ReleaseLine[] = []
  const errors: string[] = []
  for (const [file, text] of Object.entries(files)) {
    try {
      const parsed = parseChangelog(file, text)
      if (lines.some((line) => line.line === parsed.line)) throw new ChangelogError(file, 1, `the line ${parsed.line} is in two files`)
      lines.push(parsed)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  lines.sort((left, right) => compareVersions(right.line, left.line))
  return { lines, errors }
}

/** A line's groups merged over its releases, oldest release first, so the x.y.0 features lead. */
export function mergedGroups(line: ReleaseLine): ChangeList[] {
  return changeGroups
    .map((group) => ({ group, items: [...line.releases].reverse().flatMap((release) => release.groups.find((list) => list.group === group)?.items ?? []) }))
    .filter((list) => list.items.length > 0)
}

export interface WhatsNewDecision {
  /** The line whose notes to show now, if any. */
  show: ReleaseLine | undefined
  /** What to store as seen: at once when nothing is shown, when the dialog closes otherwise. */
  remember: string | undefined
}

/**
 * Whether to show what's new (D56). Shows the running minor line once per user, when the user
 * last saw an older line and the running line has at least one Features item; patches alone never
 * show. A user with nothing stored (first visit) is not behind: the running line is remembered
 * silently. A development build (no `major.minor` in `running`) never shows and stores nothing.
 */
export function decideWhatsNew(lines: readonly ReleaseLine[], running: string, seen: string | null | undefined): WhatsNewDecision {
  const current = versionLine(running)
  if (current === undefined) return { show: undefined, remember: undefined }
  const last = versionLine(seen)
  if (last === undefined) return { show: undefined, remember: current }
  if (compareVersions(current, last) <= 0) return { show: undefined, remember: undefined }
  const notes = lines.find((line) => line.line === current)
  if (notes === undefined || !mergedGroups(notes).some((list) => list.group === 'Features')) return { show: undefined, remember: undefined }
  return { show: notes, remember: current }
}
