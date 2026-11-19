// SettingsPage mounted (D69): the danger dialog's Delete stays enabled, refuses a wrong name with
// a field error and the focus in the name, and runs confirmDelete on the right one (D95).
import { afterEach, expect, test } from 'bun:test'
import { nextTick, type Component } from 'vue'
import { key, mount, settle, type Mounted } from '../../scripts/test/mount'
import { toasts } from '../../ui/Toast/toast'
import SettingsPage from './SettingsPage.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

async function openConfirm(): Promise<{ root: HTMLElement; panel: HTMLDialogElement; input: HTMLInputElement; remove: HTMLButtonElement }> {
  view = mount(SettingsPage as Component, () => ({ tab: 'danger' }))
  await settle()
  const root = view.root
  root.querySelector<HTMLButtonElement>('.settings-page__danger [data-action="deleteWorkspace"]')!.click()
  await nextTick()
  const panel = root.querySelector('dialog')!
  return {
    root, panel,
    input: panel.querySelector<HTMLInputElement>('input[name="workspaceName"]')!,
    remove: panel.querySelector<HTMLButtonElement>('[data-action="deleteWorkspace"]')!,
  }
}

async function type(input: HTMLInputElement, value: string): Promise<void> {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  await nextTick()
}

const error = (panel: HTMLElement) => panel.querySelector('.ui-field__error')?.textContent?.trim()

test('a wrong name keeps the dialog open, shows the field error and focuses the name; typing clears it', async () => {
  const { panel, input, remove } = await openConfirm()
  const before = toasts.length
  expect(panel.hasAttribute('open')).toBe(true)
  expect(remove.disabled).toBe(false)
  await type(input, 'Not the workspace')
  remove.click()
  await nextTick()
  expect(panel.hasAttribute('open')).toBe(true)
  expect(error(panel)).toBe('Type the workspace name exactly.')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(input)
  expect(toasts.length).toBe(before)
  await type(input, 'Not the workspac')
  expect(error(panel)).toBeUndefined()
})

test('closing clears the refusal and the typed name', async () => {
  const { root, panel, input, remove } = await openConfirm()
  await type(input, 'Not the workspace')
  remove.click()
  await nextTick()
  expect(error(panel)).toBe('Type the workspace name exactly.')
  panel.querySelector<HTMLButtonElement>('.ui-dialog__actions button:not([data-action])')!.click()
  await nextTick()
  expect(panel.hasAttribute('open')).toBe(false)
  root.querySelector<HTMLButtonElement>('.settings-page__danger [data-action="deleteWorkspace"]')!.click()
  await nextTick()
  expect(error(panel)).toBeUndefined()
  expect(input.value).toBe('')
})

test('the right name runs confirmDelete: the dialog closes and a toast says so', async () => {
  const { panel, input, remove } = await openConfirm()
  const before = toasts.length
  await type(input, ' Govengers Demo GmbH ')
  remove.click()
  await nextTick()
  expect(panel.hasAttribute('open')).toBe(false)
  expect(toasts.length).toBe(before + 1)
  expect(toasts.at(-1)?.message).toBe('Workspace deleted')
})

test('Enter in the name does what the Delete click does: refuses a wrong name, deletes on the right one', async () => {
  const { panel, input } = await openConfirm()
  const before = toasts.length
  await type(input, 'Not the workspace')
  key(input, 'Enter')
  await nextTick()
  expect(panel.hasAttribute('open')).toBe(true)
  expect(error(panel)).toBe('Type the workspace name exactly.')
  expect(document.activeElement).toBe(input)
  await type(input, 'Govengers Demo GmbH')
  key(input, 'Enter', { isComposing: true })
  await nextTick()
  expect(panel.hasAttribute('open')).toBe(true)
  key(input, 'Enter')
  await nextTick()
  expect(panel.hasAttribute('open')).toBe(false)
  expect(toasts.length).toBe(before + 1)
})

test('a notification switch saving at once leaves nothing unsaved: no leave prompt while it saves', async () => {
  view = mount(SettingsPage as Component, () => ({ tab: 'notifications' }))
  await settle()
  const toggle = view.root.querySelector<HTMLButtonElement>('button[role="switch"][data-field="notifyByEmail"]')!
  const before = toggle.getAttribute('aria-checked')
  toggle.click()
  await nextTick()
  // The save is out (the fake engine answers on a later task): the form differs from the server now.
  const unload = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(unload)
  expect(unload.defaultPrevented).toBe(false)
  await settle()
  expect(toggle.getAttribute('aria-checked')).not.toBe(before)
})
