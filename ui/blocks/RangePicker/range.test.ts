import { describe, expect, test } from 'bun:test'
import { anyTime, calendarRange, fromLocalInput, instantOf, fromQuery, labelOf, rangeToConditions, relativeRange, sameRange, toLocalInput, toQuery, type Translate } from './range'

const t: Translate = (key, named, plural) => {
  const words: Record<string, [string, string]> = { 'ui.lastHours': ['Last hour', 'Last {n} hours'], 'ui.lastDays': ['Last day', 'Last {n} days'], 'ui.lastMinutes': ['Last minute', 'Last {n} minutes'], 'ui.lastWeeks': ['Last week', 'Last {n} weeks'] }
  const pair = words[key]
  if (pair) return (plural === 1 ? pair[0] : pair[1]).replace('{n}', String(named['n']))
  return ({ 'ui.today': 'Today', 'ui.yesterday': 'Yesterday', 'ui.now': 'now', 'ui.anyTime': 'Any time' })[key] ?? key
}
// 02.11.2026 10:30 local time, a Monday.
const now = new Date(2026, 10, 2, 10, 30)

describe('labelOf', () => {
  test('relative quick ranges in words, singular and plural', () => {
    expect(labelOf(relativeRange('-7d'), t, 'en')).toBe('Last 7 days')
    expect(labelOf(relativeRange('-1h'), t, 'en')).toBe('Last hour')
    expect(labelOf(relativeRange('-15m'), t, 'en')).toBe('Last 15 minutes')
  })

  test('no range is any time, an open absolute range ends at now', () => {
    expect(labelOf(anyTime, t, 'en')).toBe('Any time')
    expect(labelOf({ from: new Date(2026, 10, 2, 10).toISOString(), to: '' }, t, 'de')).toBe('02.11.26, 10:00 - now')
  })

  test('calendar ranges by name, compound and absolute ranges as two ends', () => {
    expect(labelOf(calendarRange('today', now), t, 'en')).toBe('Today')
    expect(labelOf(relativeRange('-1h30m'), t, 'en')).toBe('-1h30m - now')
    const from = new Date(2026, 10, 2, 10).toISOString()
    const to = new Date(2026, 10, 2, 12).toISOString()
    expect(labelOf({ from, to }, t, 'de')).toBe('02.11.26, 10:00 - 02.11.26, 12:00')
  })
})

describe('calendarRange', () => {
  test('today runs from midnight to now, yesterday ends at midnight, weeks start on Monday', () => {
    expect(calendarRange('today', now)).toEqual({ from: new Date(2026, 10, 2).toISOString(), to: '', calendar: 'today' })
    expect(calendarRange('yesterday', now)).toEqual({ from: new Date(2026, 10, 1).toISOString(), to: new Date(2026, 10, 2).toISOString(), calendar: 'yesterday' })
    expect(calendarRange('thisWeek', new Date(2026, 10, 4)).from).toBe(new Date(2026, 10, 2).toISOString())
    expect(calendarRange('thisMonth', now).from).toBe(new Date(2026, 10, 1).toISOString())
  })
})

describe('rangeToConditions', () => {
  test('gte from, lte to, now is no bound, any time is none', () => {
    expect(rangeToConditions('createdAt', anyTime)).toEqual([])
    expect(rangeToConditions('createdAt', relativeRange('-7d'))).toEqual([{ field: 'createdAt', op: 'gte', value: { relative: '-7d' } }])
    expect(rangeToConditions('createdAt', { from: 'a', to: 'b' })).toEqual([{ field: 'createdAt', op: 'gte', value: 'a' }, { field: 'createdAt', op: 'lte', value: 'b' }])
  })
})

describe('URL query', () => {
  test('relative, calendar and absolute ranges round-trip', () => {
    for (const range of [relativeRange('-30d'), calendarRange('yesterday', now), { from: '2026-11-01T00:00:00.000Z', to: '' }, { from: { relative: '-2d' }, to: { relative: '-1d' } }]) {
      expect(sameRange(fromQuery(toQuery(range), now)!, range)).toBe(true)
    }
    expect(toQuery(relativeRange('-7d'))).toBe('-7d')
    expect(toQuery(calendarRange('today', now))).toBe('today')
  })

  test('any time is no t: an empty query value, and no t names no range', () => {
    expect(toQuery(anyTime)).toBe('')
    expect(fromQuery(undefined)).toBeUndefined()
    expect(fromQuery('')).toBeUndefined()
  })

  test('garbage is no range', () => {
    for (const text of [undefined, '', 'week', 'x..y', '-7x', ['-7d']]) expect(fromQuery(text)).toBeUndefined()
  })
})

describe('instantOf', () => {
  test('now, relative back and forward, absolute', () => {
    expect(instantOf('', now)).toBe(now)
    expect(instantOf({ relative: '-2h' }, now).getTime()).toBe(now.getTime() - 7_200_000)
    expect(instantOf({ relative: '+1w' }, now).getTime()).toBe(now.getTime() + 604_800_000)
    expect(instantOf('2026-11-02T00:00:00.000Z', now).toISOString()).toBe('2026-11-02T00:00:00.000Z')
  })
})

describe('datetime-local', () => {
  test('round-trips minutes in local time, now stays empty', () => {
    const iso = new Date(2026, 10, 2, 10, 5).toISOString()
    expect(toLocalInput(iso)).toBe('2026-11-02T10:05')
    expect(fromLocalInput('2026-11-02T10:05')).toBe(iso)
    expect(toLocalInput('')).toBe('')
    expect(toLocalInput({ relative: '-1d1h' }, now)).toBe('2026-11-01T09:30')
  })
})
