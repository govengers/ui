// WorkflowStatus mounted (D69, D94): the confirm keeps its title, sentence, tone and error while the
// dialog leaves (the panel shows for --ui-duration after it closed), and a press on it then runs
// nothing. Each press waits a task after the render before it: Vue ignores an event that comes in
// the same millisecond as the listener it reaches.
import { expect, spyOn, test } from 'bun:test'
import type { Component } from 'vue'
import { calls } from '../../../demo/src/fake/api'
import { mount, settle } from '../../../scripts/test/mount'
import WorkflowStatus from './WorkflowStatus.vue'
import type { WorkflowTransition } from './workflow'

const cancel: WorkflowTransition = {
  to: 'cancelled', label: 'Cancel order', danger: true, confirm: 'This cannot be undone.',
  call: calls.updateCustomer, params: { id: 'cus-001' }, body: { name: 'Ada' },
}

test('the confirm keeps what it showed while it leaves, and its button then runs nothing', async () => {
  const view = mount(WorkflowStatus as Component, () => ({
    states: [{ key: 'open', label: 'Open' }, { key: 'cancelled', label: 'Cancelled' }], current: 'open', transitions: [cancel],
  }))
  await settle()
  const call = spyOn(view.pair.value.connection, 'call')
  view.root.querySelector<HTMLButtonElement>('.ui-workflow-status__actions [data-transition="cancelled"]')!.click()
  await settle()
  const panel = view.root.querySelector('dialog')!
  const shown = () => [panel.hasAttribute('open'), panel.dataset['variant'], panel.querySelector('.ui-dialog__title')?.textContent, panel.querySelector('.ui-dialog__description')?.textContent]
  expect(shown()).toEqual([true, 'danger', 'Cancel order', 'This cannot be undone.'])
  panel.querySelector<HTMLButtonElement>('.ui-dialog__actions button:not([data-transition])')!.click()
  await settle()
  expect(shown()).toEqual([false, 'danger', 'Cancel order', 'This cannot be undone.'])
  panel.querySelector<HTMLButtonElement>('.ui-dialog__actions [data-transition="cancelled"]')!.click()
  await settle()
  expect(call).not.toHaveBeenCalled()
  expect(panel.hasAttribute('open')).toBe(false)
})

test('a refused confirm keeps its error line while the dialog leaves', async () => {
  const view = mount(WorkflowStatus as Component, () => ({
    states: [{ key: 'open', label: 'Open' }, { key: 'cancelled', label: 'Cancelled' }], current: 'open', transitions: [cancel],
  }))
  await settle()
  spyOn(view.pair.value.connection, 'call').mockRejectedValue(new Error('The order is already paid.'))
  view.root.querySelector<HTMLButtonElement>('.ui-workflow-status__actions [data-transition="cancelled"]')!.click()
  await settle()
  const panel = view.root.querySelector('dialog')!
  panel.querySelector<HTMLButtonElement>('.ui-dialog__actions [data-transition="cancelled"]')!.click()
  await settle()
  const error = () => panel.querySelector('.ui-dialog__body')?.textContent?.trim()
  expect([panel.hasAttribute('open'), error()]).toEqual([true, 'The order is already paid.'])
  panel.querySelector<HTMLButtonElement>('.ui-dialog__actions button:not([data-transition])')!.click()
  await settle()
  expect([panel.hasAttribute('open'), error()]).toEqual([false, 'The order is already paid.'])
})

test('a confirm that succeeded leaves as it was: the call still running, no X, Cancel disabled', async () => {
  const view = mount(WorkflowStatus as Component, () => ({
    states: [{ key: 'open', label: 'Open' }, { key: 'cancelled', label: 'Cancelled' }], current: 'open', transitions: [cancel],
  }))
  await settle()
  spyOn(view.pair.value.connection, 'call').mockResolvedValue({})
  view.root.querySelector<HTMLButtonElement>('.ui-workflow-status__actions [data-transition="cancelled"]')!.click()
  await settle()
  const panel = view.root.querySelector('dialog')!
  panel.querySelector<HTMLButtonElement>('.ui-dialog__actions [data-transition="cancelled"]')!.click()
  await settle()
  const confirm = panel.querySelector<HTMLButtonElement>('.ui-dialog__actions [data-transition="cancelled"]')!
  const cancelButton = panel.querySelector<HTMLButtonElement>('.ui-dialog__actions button:not([data-transition])')!
  expect([panel.hasAttribute('open'), panel.querySelector('.ui-dialog__close') === null, confirm.dataset['state'], cancelButton.disabled]).toEqual([false, true, 'loading', true])
})
