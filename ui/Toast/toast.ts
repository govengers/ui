// The toast queue. Call toast() from anywhere; the Toast host, mounted once in the app shell,
// shows the first three (newest at the bottom), counts their time down and pauses while the user
// hovers or focuses it. Later toasts wait their turn: an error is never pushed out unread.
import { shallowReactive } from 'vue'

export type ToastVariant = 'neutral' | 'success' | 'danger'

export interface ToastOptions {
  message: string
  variant?: ToastVariant | undefined
  /** Milliseconds on screen: 5000 by default, 8000 for danger. `Infinity` keeps it until closed. */
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

export const visibleToasts = 3

/** The queue, oldest first. Shallow: the host's countdown on `remaining` renders nothing. */
export const toasts = shallowReactive<ToastItem[]>([])

let lastId = 0

export function toastItem(options: ToastOptions, id: number): ToastItem {
  const variant = options.variant ?? 'neutral'
  const remaining = options.duration ?? (variant === 'danger' ? 8000 : 5000)
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
