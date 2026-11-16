// A stand-in for the generated src/api/api.ts of a target (template-check, D61, D74), checked
// there, not here (tsconfig excludes scripts/fixtures: `./runtime` exists only in the target). The
// declarations the starter shell names, in the shape livewire's generator writes them. A real
// project generates this file from its registry; the server declares these reads and calls.
import * as runtime from './runtime'

export interface ItemParameters {
  id: string
}

export interface Notification {
  id: string
  title: string
  body: string | null
  route: string | null
  createdAt: string
  readAt: string | null
}

export interface NotificationCount {
  unread: number
}

export interface NotificationsListQuery extends runtime.ListQuery<runtime.SearchableFilterDocument<unknown>, 'createdAt' | '-createdAt'> {}

export interface CreateFeedback {
  type: 'bug' | 'idea' | 'question'
  text: string
  severity: 'low' | 'medium' | 'high' | 'critical' | null
  environment: object | null
  entries: object[]
  screenshot: string | null
}

export interface FeedbackReceipt {
  id: string
  createdAt: string
}

export const live = {
  notifications: runtime.liveRead<NotificationsListQuery, runtime.ListResponse<Notification>>({ target: 'notifications', path: '/notifications', pathParameters: [], list: true }),
  notificationCount: runtime.liveRead<runtime.NoParameters, NotificationCount>({ target: 'notificationCount', path: '/notifications/count', pathParameters: [], list: false }),
} as const

export const calls = {
  markNotificationRead: runtime.mutation<ItemParameters, undefined, Notification>({ name: 'markNotificationRead', method: 'POST', path: '/notifications/{id}/read', pathParameters: ['id'], body: false, content: true, effect: { kind: 'upserts', target: 'notifications' } }),
  markAllNotificationsRead: runtime.mutation<runtime.NoParameters, undefined, NotificationCount>({ name: 'markAllNotificationsRead', method: 'POST', path: '/notifications/read', pathParameters: [], body: false, content: true }),
  createFeedback: runtime.mutation<runtime.NoParameters, CreateFeedback, FeedbackReceipt>({ name: 'createFeedback', method: 'POST', path: '/feedback', pathParameters: [], body: true, content: true }),
} as const
