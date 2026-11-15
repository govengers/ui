import { describe, expect, test } from 'bun:test'
import { ref } from 'vue'
import { isUnread, unreadCount, useMarkAll, type NotificationLike } from './inbox'

const row = (id: string, createdAt: string, readAt: string | null = null): NotificationLike => ({ id, title: id, createdAt, readAt })
const rows = [row('a', '2026-11-02T10:00:00Z'), row('b', '2026-11-02T09:00:00Z', '2026-11-02T09:30:00Z'), row('c', '2026-11-02T08:00:00Z')]

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

describe('inbox', () => {
  test('mark all covers the rows shown, not later arrivals, even older ones', () => {
    const covered = new Set(rows.map((item) => item.id))
    expect(rows.filter((item) => isUnread(item, covered))).toEqual([])
    expect(isUnread(row('d', '2026-11-02T10:00:01Z'), covered)).toBe(true)
    // committed after the press, created before the newest shown row (transaction start time)
    expect(isUnread(row('e', '2026-11-02T09:59:59Z'), covered)).toBe(true)
  })

  test('the server count wins unless mark all is in flight', () => {
    const covered = new Set(rows.map((item) => item.id))
    expect(unreadCount(rows, { server: 12 })).toEqual({ n: 12, label: '12', exact: true })
    expect(unreadCount(rows, { server: 12, markingAll: true, covered })).toEqual({ n: 0, label: '0', exact: false })
    expect(unreadCount(rows)).toEqual({ n: 2, label: '2', exact: false })
    expect(unreadCount(rows, { server: 150 })).toEqual({ n: 150, label: '99+', exact: true })
  })

  test('a loaded page that is all unread with more behind it is a lower bound', () => {
    const unread = [row('a', '2026-11-02T10:00:00Z'), row('b', '2026-11-02T09:00:00Z')]
    expect(unreadCount(unread, { total: 40 }).label).toBe('2+')
    expect(unreadCount(unread, { total: 2 }).label).toBe('2')
    expect(unreadCount(rows, { total: 40 }).label).toBe('2')
  })

  test('zero is exact only with the server count or the whole list loaded', () => {
    const read = Array.from({ length: 20 }, (_, index) => row(String(index), '2026-11-02T10:00:00Z', '2026-11-02T10:01:00Z'))
    expect(unreadCount(read, { total: 21 })).toMatchObject({ n: 0, exact: false })
    expect(unreadCount(read, { total: 20 })).toMatchObject({ n: 0, exact: true })
    expect(unreadCount(read, { total: 21, server: 0 })).toMatchObject({ n: 0, exact: true })
  })
})

describe('useMarkAll', () => {
  test('covers the rows at once, keeps them after success, gives them back on error', async () => {
    const connection = ref('alice')
    let answer = deferred()
    const markAll = useMarkAll(connection, () => answer.promise)
    const done = markAll.run(rows)
    expect(markAll.marking.value).toBe(true)
    expect(isUnread(rows[0]!, markAll.covered.value)).toBe(false)
    answer.resolve()
    await done
    expect(markAll.marking.value).toBe(false)
    expect(isUnread(rows[0]!, markAll.covered.value)).toBe(false)

    answer = deferred()
    const later = row('d', '2026-11-02T11:00:00Z')
    const failing = markAll.run([later])
    answer.reject(new Error('refused'))
    await expect(failing).rejects.toThrow('refused')
    expect(isUnread(later, markAll.covered.value)).toBe(true)
    expect(isUnread(rows[0]!, markAll.covered.value)).toBe(false)
  })

  test('another identity forgets the marks and ignores the answer of the call before', async () => {
    const connection = ref('alice')
    const answer = deferred()
    const calls: string[] = []
    const markAll = useMarkAll(connection, (current) => { calls.push(current); return answer.promise })
    const done = markAll.run(rows)
    connection.value = 'bob'
    const bobs = row('c', '2026-11-02T08:00:00Z') // same id, Bob's unread row
    expect(isUnread(bobs, markAll.covered.value)).toBe(true)
    expect(markAll.marking.value).toBe(false)
    answer.reject(new Error('alice refused'))
    await done // resolves: the error belongs to the connection before
    expect(isUnread(bobs, markAll.covered.value)).toBe(true)
    expect(calls).toEqual(['alice'])
  })
})
