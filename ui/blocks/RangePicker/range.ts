// The time range model of RangePicker, framework-free: quick ranges, the label, the two livewire
// time conditions and the URL form. A relative time is livewire's { relative: "-7d" } (s m h d w).
import { format, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns'
import type { RelativeTime } from '@/api/runtime'

/** A time in a condition: RFC 3339, relative to the clock of the read, or '' for now (no bound). */
export type TimeValue = string | RelativeTime

/** Calendar ranges computed when chosen (livewire has no "start of day"); the key keeps them in the URL. */
export type CalendarKey = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth'

export interface TimeRange {
  from: TimeValue
  /** '' is now: no upper bound. */
  to: TimeValue
  /** Set by a calendar quick range, so its label and URL stay "today" instead of two instants. */
  calendar?: CalendarKey | undefined
}

export type TimeCondition = { field: string; op: 'gte' | 'lte'; value: TimeValue }

/** The translate function of vue-i18n, as far as the label needs it. */
export type Translate = (key: string, named: Record<string, unknown>, plural: number) => string

export const relativeQuick = ['-5m', '-15m', '-1h', '-6h', '-24h', '-7d', '-30d', '-90d'] as const
export const calendarQuick: readonly CalendarKey[] = ['today', 'yesterday', 'thisWeek', 'thisMonth']

/** No range: no conditions, no `t` in the URL; a list's usual default. */
export const anyTime: TimeRange = { from: '', to: '' }

export function isAnyTime(range: TimeRange): boolean {
  return !range.calendar && range.from === '' && range.to === ''
}

export function relativeRange(relative: string): TimeRange {
  return { from: { relative }, to: '' }
}

/** A calendar range as instants, now: weeks start on Monday (ISO 8601). */
export function calendarRange(key: CalendarKey, now: Date = new Date()): TimeRange {
  const today = startOfDay(now)
  const from = { today, yesterday: subDays(today, 1), thisWeek: startOfWeek(now, { weekStartsOn: 1 }), thisMonth: startOfMonth(now) }[key]
  return { from: from.toISOString(), to: key === 'yesterday' ? today.toISOString() : '', calendar: key }
}

const unitKeys: Record<string, string> = { m: 'ui.lastMinutes', h: 'ui.lastHours', d: 'ui.lastDays', w: 'ui.lastWeeks' }

function sameRelative(left: TimeValue, right: TimeValue): boolean {
  return typeof left === 'string' || typeof right === 'string' ? left === right : left.relative === right.relative
}

export function sameRange(left: TimeRange, right: TimeRange): boolean {
  return left.calendar === right.calendar && sameRelative(left.from, right.from) && sameRelative(left.to, right.to)
}

function timeLabel(value: TimeValue, t: Translate, locale: string): string {
  if (value === '') return t('ui.now', {}, 1)
  return typeof value === 'string' ? new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : value.relative
}

/** "Any time", "Last 7 days", "Today", or "02.11.26, 10:00 - 02.11.26, 12:00" in the locale. */
export function labelOf(range: TimeRange, t: Translate, locale: string): string {
  if (range.calendar) return t(`ui.${range.calendar}`, {}, 1)
  if (isAnyTime(range)) return t('ui.anyTime', {}, 1)
  const match = typeof range.from === 'string' ? null : /^-(\d+)([mhdw])$/.exec(range.from.relative)
  if (match && range.to === '') {
    const n = Number(match[1])
    return t(unitKeys[match[2]!]!, { n }, n)
  }
  return `${timeLabel(range.from, t, locale)} - ${timeLabel(range.to, t, locale)}`
}

/** The conditions a page ANDs into its filter: field >= from, field <= to; now is no bound. */
export function rangeToConditions(field: string, range: TimeRange): TimeCondition[] {
  const conditions: TimeCondition[] = []
  if (range.from !== '') conditions.push({ field, op: 'gte', value: range.from })
  if (range.to !== '') conditions.push({ field, op: 'lte', value: range.to })
  return conditions
}

/** `?t=-7d`, `?t=today`, `?t=<from>..<to>` (an empty side is now); '' for any time, which is no `t`. */
export function toQuery(range: TimeRange): string {
  if (range.calendar) return range.calendar
  if (isAnyTime(range)) return ''
  const side = (value: TimeValue): string => (typeof value === 'string' ? value : value.relative)
  return range.to === '' && typeof range.from !== 'string' ? range.from.relative : `${side(range.from)}..${side(range.to)}`
}

const relativePattern = /^[+-](\d+[smhdw])+$/

/** The range of a `t` query value; undefined when it names none (no `t` at all is any time or the page's default). */
export function fromQuery(text: unknown, now: Date = new Date()): TimeRange | undefined {
  if (typeof text !== 'string' || text === '') return undefined
  if ((calendarQuick as readonly string[]).includes(text)) return calendarRange(text as CalendarKey, now)
  if (relativePattern.test(text)) return relativeRange(text)
  const [from, to] = text.split('..')
  if (from === undefined || to === undefined) return undefined
  const side = (value: string): TimeValue | undefined => (value === '' ? '' : relativePattern.test(value) ? { relative: value } : Number.isNaN(Date.parse(value)) ? undefined : value)
  const range = { from: side(from), to: side(to) }
  return range.from === undefined || range.to === undefined ? undefined : { from: range.from, to: range.to }
}

const seconds: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 }

/** The instant a time stands for now: '' is now, a relative time counts from now. */
export function instantOf(value: TimeValue, now: Date = new Date()): Date {
  if (typeof value === 'string') return value === '' ? now : new Date(value)
  let offset = 0
  for (const [, amount, unit] of value.relative.matchAll(/(\d+)([smhdw])/g)) offset += Number(amount) * (seconds[unit ?? 's'] ?? 0)
  return new Date(now.getTime() + (value.relative.startsWith('+') ? offset : -offset) * 1000)
}

/** A time as the value of a native datetime-local input (local time, minutes); now is empty. */
export function toLocalInput(value: TimeValue, now: Date = new Date()): string {
  return value === '' ? '' : format(instantOf(value, now), "yyyy-MM-dd'T'HH:mm")
}

/** A datetime-local value as an instant; '' stays now. */
export function fromLocalInput(value: string): string {
  return value === '' ? '' : new Date(value).toISOString()
}
