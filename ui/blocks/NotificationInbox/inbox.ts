// NotificationInbox's logic: which rows show as unread after "mark all read", what the bell's
// count says, and the mark-all state that belongs to one connection.
import { ref, shallowRef, watch, type Ref } from 'vue'

/** A notification row as the block reads it; a project's row may carry more. */
export interface NotificationLike {
  id: string
  title: string
  body?: string | null | undefined
  /** Where the notification points; none for a notice without a target. */
  route?: string | null | undefined
  /** ISO time. */
  createdAt: string
  /** ISO time it was read, null while unread. */
  readAt: string | null
}

/**
 * Unread, unless "mark all read" covers it: `covered` holds the ids of the rows the list showed
 * when the user pressed it, so a row that arrives later stays unread whatever its createdAt.
 */
export function isUnread(item: NotificationLike, covered?: ReadonlySet<string>): boolean {
  return item.readAt === null && !(covered?.has(item.id) ?? false)
}

export interface Count {
  n: number
  /** The bell's text: "99+" above the cap, "5+" when only a part of the list is loaded and no count read exists. */
  label: string
  /** Whether n is the whole truth (the server's count, or the list is loaded completely); a 0 that is not exact may hide older unread rows. */
  exact: boolean
}

/**
 * The bell's count: the server's count read when there is one and no "mark all" is in flight,
 * else the unread rows of the loaded page (a lower bound when the list has more rows).
 */
export function unreadCount(items: readonly NotificationLike[], options: { server?: number | undefined; total?: number | undefined; covered?: ReadonlySet<string> | undefined; markingAll?: boolean; cap?: number } = {}): Count {
  const cap = options.cap ?? 99
  const local = items.filter((item) => isUnread(item, options.covered)).length
  const useServer = options.server !== undefined && !options.markingAll
  const n = useServer ? options.server! : local
  const complete = options.total !== undefined && options.total <= items.length
  const partial = !useServer && !complete && options.total !== undefined && local === items.length && local > 0
  return { n, label: n > cap ? `${cap}+` : partial ? `${n}+` : String(n), exact: useServer || complete }
}

/**
 * Mark all read: the rows shown count as read at once and stay so (the server marked them); an
 * error gives them back and rethrows. Another connection (another identity) forgets them, and the
 * answer of a call made on the connection before changes nothing.
 */
export function useMarkAll<Connection>(connection: Readonly<Ref<Connection>>, call: (connection: Connection) => Promise<unknown>) {
  const covered = shallowRef<ReadonlySet<string>>()
  const marking = ref(false)
  watch(connection, () => {
    covered.value = undefined
    marking.value = false
  }, { flush: 'sync' })
  async function run(items: readonly NotificationLike[]): Promise<void> {
    const mine = connection.value
    const before = covered.value
    covered.value = new Set([...(before ?? []), ...items.map((item) => item.id)])
    marking.value = true
    try {
      await call(mine)
    } catch (error) {
      if (connection.value !== mine) return
      covered.value = before
      throw error
    } finally {
      if (connection.value === mine) marking.value = false
    }
  }
  return { covered, marking, run }
}
