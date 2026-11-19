import { describe, expect, test } from 'bun:test'
import { formatAge, formatBytes, formatCurrency, formatSpan } from './format'

describe('format', () => {
  test('formatSpan picks the two leading units', () => {
    expect(formatSpan(12)).toBe('12s')
    expect(formatSpan(65)).toBe('1m 05s')
    expect(formatSpan(3900)).toBe('1h 05m')
    expect(formatSpan(-3)).toBe('0s')
  })

  test('formatBytes steps through units', () => {
    expect(formatBytes(512, 'en')).toBe('512 B')
    expect(formatBytes(1536, 'en')).toBe('1.5 kB')
    expect(formatBytes(5 * 1024 ** 3, 'en')).toBe('5 GB')
  })

  test('formatCurrency takes number options, never another style or currency', () => {
    expect(formatCurrency(1234.5, 'en', 'EUR')).toBe('€1,234.50')
    expect(formatCurrency(12.5, 'en', 'EUR', { signDisplay: 'exceptZero' })).toBe('+€12.50')
    expect(formatCurrency(-3, 'en', 'EUR', { signDisplay: 'exceptZero' })).toBe('-€3.00')
    expect(formatCurrency(0, 'en', 'EUR', { signDisplay: 'exceptZero' })).toBe('€0.00')
    expect(formatCurrency(12, 'en', 'EUR', { style: 'percent', currency: 'USD' })).toBe('€12.00')
  })

  test('formatAge is relative to a given now', () => {
    const now = new Date('2026-11-02T12:00:00Z')
    expect(formatAge('2026-11-02T11:57:00Z', 'en', now)).toBe('3 minutes ago')
    expect(formatAge('2026-11-04T12:00:00Z', 'en', now)).toBe('in 2 days')
    expect(formatAge(now, 'en', now)).toBe('now')
  })
})
