---
name: NotificationInbox
tier: block
intent: [notifications, notification bell, inbox, unread count, mark as read, mark all read, alerts menu, mentions]
uses: [Popover, Button, Icon, Banner, EmptyState, Skeleton, format]
livewire: true
status: ready
laws: [selective-attention, zeigarnik-effect, fittss-law]
---

# NotificationInbox

The bell in the top bar (D64): an icon button with the unread count, and a popover with the
newest notifications, live. Unread rows carry a dot and a mark-read button; opening a row marks
it read and follows its route; the header marks all read. One list subscription, plus an
optional count read for the true unread total.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `NotificationInbox.vue`, `inbox.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Popover`, `Button`, `Icon`, `Banner`, `EmptyState`, `Skeleton`, `format` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `NotificationInbox.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `target` | `LiveTarget<Query, ListResponse<NotificationLike>>` | required | the user's notifications, e.g. `live.notifications`; its default sort must be newest first |
| `count` | `LiveTarget<NoParameters, { unread }> \| undefined` | none | the server's unread count, e.g. `live.notificationCount`; without it the bell counts the loaded rows |
| `markRead` | `MutationTarget<{ id }, undefined, NotificationLike>` | required | marks one read, answering the row; give it an `upserts` effect on the list's target |
| `markAllRead` | `MutationTarget<NoParameters, undefined, unknown>` | required | marks every unread row read |
| `limit` | `number` | `20` | rows in the popover |
| `to` | `RouteLocationRaw \| undefined` | none | the full notifications page, "All notifications" |

`NotificationLike` (`inbox.ts`): `{ id, title, body?, route?, createdAt, readAt: string | null }`.
`inbox.ts` also exports `isUnread`, `unreadCount` (the bell's number and label: `99+` above the
cap, `3+` when the loaded page is all unread and the list has more; `exact` when the number is the
whole truth) and `useMarkAll` (the mark-all state of one connection).

## Exposes

`open()`, `close()`: a keyboard shortcut or a "you have mail" toast can open the inbox.

## With livewire

The server declares three things on the notifications table, scoped to the caller:

```ts
// api.ts (generated)
live.notifications        // list, default sort -createdAt
live.notificationCount    // object read { unread }, Tables: notifications
calls.markNotificationRead      // POST /notifications/{id}/read, effect upserts notifications
calls.markAllNotificationsRead  // POST /notifications/read
```
```vue
<NotificationInbox :target="live.notifications" :count="live.notificationCount"
  :mark-read="calls.markNotificationRead" :mark-all-read="calls.markAllNotificationsRead" />
```

Mark read is optimistic through the runtime (the row turns read at once, an error takes it back).
Mark all shows the rows it was pressed on read at once and keeps them so; rows that arrive later
stay unread whatever their createdAt; an error takes it back and shows the message. Another
connection (another identity) forgets it, and the answer of a call made before changes nothing.
Mark all is disabled only when nothing can be unread: the count read says 0, or the whole list is
loaded and none is unread.

## Agent

The bell is a button named "Notifications, 3 unread". Mark read carries `data-action` =
`markRead.name`, mark all `markAllRead.name`. An unread row's title ends in a visually hidden
", unread". Rows with a route are links.

## Messages

`ui.notifications`, `ui.notificationsUnread`, `ui.markRead`, `ui.markAllRead`, `ui.unread`,
`ui.noNotifications`, `ui.noNotificationsHint`, `ui.allNotifications`, `ui.retry`.

## Gotchas

- Put it in `AppShell`'s top bar actions, once. Two inboxes are two subscriptions.
- Without `count`, the number is a lower bound: unread rows beyond `limit` are not counted.
- The count read and the list update on their own pushes; for a moment after mark read the bell
  and the dot may disagree by one.
- A row without `route` is plain text; mark it read with its button.
