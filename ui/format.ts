// The formatting helpers every page uses (D34): Intl for display, date-fns for arithmetic (D20).
// Pass the app locale; never format in a component with a hard-coded locale.
import { differenceInSeconds, parseISO } from 'date-fns'

export type DateInput = Date | string | number

function toDate(value: DateInput): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string') return parseISO(value)
  return new Date(value)
}

export function formatDateTime(value: DateInput, locale: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
  return new Intl.DateTimeFormat(locale, options).format(toDate(value))
}

export function formatDate(value: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(toDate(value))
}

export function formatTime(value: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(toDate(value))
}

/** "3 minutes ago", "in 2 days": the age of a moment relative to now. */
export function formatAge(value: DateInput, locale: string, now: Date = new Date()): string {
  const seconds = differenceInSeconds(toDate(value), now)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]]
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size || unit === 'second') return format.format(Math.round(seconds / size), unit)
  }
  return format.format(0, 'second')
}

/** "1h 05m", "12s": a duration in seconds, compact. */
export function formatSpan(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  if (minutes > 0) return `${minutes}m ${String(rest).padStart(2, '0')}s`
  return `${rest}s`
}

export function formatBytes(bytes: number, locale: string): string {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const
  let value = bytes
  let index = 0
  while (Math.abs(value) >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return new Intl.NumberFormat(locale, { style: 'unit', unit: units[index]!, unitDisplay: 'short', maximumFractionDigits: index === 0 ? 0 : 1 }).format(value)
}

export function formatNumber(value: number, locale: string, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function formatCurrency(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

export function formatPercent(fraction: number, locale: string, digits = 0): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: digits }).format(fraction)
}
