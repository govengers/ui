import { describe, expect, test } from 'bun:test'
import { toastItem, type ToastOptions } from './toast'

const undo = { label: 'Undo', run: () => undefined }

describe('toastItem duration (D93)', () => {
  const cases: [string, ToastOptions, number][] = [
    ['a neutral toast stays five seconds', { message: 'Export started.' }, 5000],
    ['a success toast stays five seconds', { message: 'Invoice 2026-0042 sent.', variant: 'success' }, 5000],
    ['a danger toast stays until closed', { message: 'Could not delete.', variant: 'danger' }, Infinity],
    ['a toast with an action stays until closed', { message: 'Customer archived.', action: undo }, Infinity],
    ['a number overrides the danger default', { message: 'Could not delete.', variant: 'danger', duration: 8000 }, 8000],
    ['a number overrides the action default', { message: 'Customer archived.', action: undo, duration: 10000 }, 10000],
    ['Infinity keeps a neutral toast', { message: 'Stays.', duration: Infinity }, Infinity],
  ]
  for (const [name, options, remaining] of cases) {
    test(name, () => expect(toastItem(options, 1).remaining).toBe(remaining))
  }
})
