// The toast queue. Call toast() from anywhere; the Toast host, mounted once in the app shell,
// shows the first three of each live region (newest at the bottom), counts their time down and
// pauses while the user hovers or focuses it. Later toasts wait their turn: an error is never
// pushed out unread, and never waits behind follow-ups, because errors have their own region.
import { shallowReactive } from 'vue'

export type ToastVariant = 'neutral' | 'success' | 'danger'

export interface ToastOptions {
  message: string
  variant?: ToastVariant | undefined
  /** Milliseconds on screen: 5000 by default; a danger toast or one with an action stays until closed; any number overrides. */
  duration?: number | undefined
  /** One follow-up, e.g. Undo. Running it closes the toast. */
  action?: { label: string; run: () => void } | undefined
}

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
  action: ToastOptions['action']
  /** Milliseconds left; the host counts it down while the toast is visible and not paused. */
  remaining: number
}

/** Toasts on screen per live region (polite, assertive); the rest of a region waits. */
export const visibleToasts = 3

/** The queue, oldest first. Shallow: the host's countdown on `remaining` renders nothing. */
export const toasts = shallowReactive<ToastItem[]>([])

let lastId = 0

export function toastItem(options: ToastOptions, id: number): ToastItem {
  const variant = options.variant ?? 'neutral'
  // An error or a follow-up must not time out before it is read (WCAG 2.2 SC 2.2.1, D93).
  const remaining = options.duration ?? (options.action || variant === 'danger' ? Infinity : 5000)
  return { id, message: options.message, variant, action: options.action, remaining }
}

/** Queues a toast and returns its id for dismiss(). */
export function toast(options: ToastOptions): number {
  lastId += 1
  toasts.push(toastItem(options, lastId))
  return lastId
}

export function dismiss(id: number): void {
  const index = toasts.findIndex(item => item.id === id)
  if (index >= 0) toasts.splice(index, 1)
}
