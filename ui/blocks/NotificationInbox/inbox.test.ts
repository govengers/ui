import { describe, expect, test } from 'bun:test'
import { isUnread, newest, unreadCount, type NotificationLike } from './inbox'

const row = (id: string, createdAt: string, readAt: string | null = null): NotificationLike => ({ id, title: id, createdAt, readAt })
const rows = [row('a', '2026-11-02T10:00:00Z'), row('b', '2026-11-02T09:00:00Z', '2026-11-02T09:30:00Z'), row('c', '2026-11-02T08:00:00Z')]

describe('inbox', () => {
  test('mark all covers rows up to the newest shown, not later arrivals', () => {
    const upTo = newest(rows)
    expect(upTo).toBe('2026-11-02T10:00:00Z')
    expect(rows.filter((item) => isUnread(item, upTo))).toEqual([])
    expect(isUnread(row('d', '2026-11-02T10:00:01Z'), upTo)).toBe(true)
    expect(newest([])).toBeUndefined()
  })

  test('the server count wins unless mark all is in flight', () => {
    expect(unreadCount(rows, { server: 12 })).toEqual({ n: 12, label: '12' })
    expect(unreadCount(rows, { server: 12, markingAll: true, allReadUpTo: newest(rows) })).toEqual({ n: 0, label: '0' })
    expect(unreadCount(rows)).toEqual({ n: 2, label: '2' })
    expect(unreadCount(rows, { server: 150 })).toEqual({ n: 150, label: '99+' })
  })

  test('a loaded page that is all unread with more behind it is a lower bound', () => {
    const unread = [row('a', '2026-11-02T10:00:00Z'), row('b', '2026-11-02T09:00:00Z')]
    expect(unreadCount(unread, { total: 40 }).label).toBe('2+')
    expect(unreadCount(unread, { total: 2 }).label).toBe('2')
    expect(unreadCount(rows, { total: 40 }).label).toBe('2')
  })
})
