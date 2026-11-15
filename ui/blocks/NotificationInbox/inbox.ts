// NotificationInbox's logic: which rows show as unread while "mark all read" is on its way, and
// what the bell's count says.

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

/** The parameters of a list read the block passes (the limit only). */
export interface ListQuery {
  filter?: unknown
  sort?: readonly string[]
  limit?: number
  offset?: number
}

/**
 * Unread, unless "mark all read" covers it: `allReadUpTo` is the newest createdAt the list showed
 * when the user pressed it (the server's clock, not the browser's), so a row that arrives later
 * stays unread.
 */
export function isUnread(item: NotificationLike, allReadUpTo?: string): boolean {
  return item.readAt === null && !(allReadUpTo !== undefined && Date.parse(item.createdAt) <= Date.parse(allReadUpTo))
}

/** The newest createdAt of the rows, for allReadUpTo. */
export function newest(items: readonly NotificationLike[]): string | undefined {
  return items.reduce<string | undefined>((latest, item) => (latest === undefined || Date.parse(item.createdAt) > Date.parse(latest) ? item.createdAt : latest), undefined)
}

export interface Count {
  n: number
  /** The bell's text: "99+" above the cap, "5+" when only a part of the list is loaded and no count read exists. */
  label: string
}

/**
 * The bell's count: the server's count read when there is one and no "mark all" is in flight,
 * else the unread rows of the loaded page (a lower bound when the list has more rows).
 */
export function unreadCount(items: readonly NotificationLike[], options: { server?: number | undefined; total?: number | undefined; allReadUpTo?: string | undefined; markingAll?: boolean; cap?: number } = {}): Count {
  const cap = options.cap ?? 99
  const local = items.filter((item) => isUnread(item, options.allReadUpTo)).length
  const useServer = options.server !== undefined && !options.markingAll
  const n = useServer ? options.server! : local
  const partial = !useServer && options.total !== undefined && options.total > items.length && local === items.length && local > 0
  return { n, label: n > cap ? `${cap}+` : partial ? `${n}+` : String(n) }
}
