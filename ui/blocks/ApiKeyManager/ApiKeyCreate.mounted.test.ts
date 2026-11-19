// ApiKeyCreate mounted (D69): Copy says what happened (a toast, a line under the field when the
// clipboard refuses), and a write that settles for a closed dialog or an older copy does nothing.
import { afterAll, afterEach, beforeAll, expect, jest, test } from 'bun:test'
import { nextTick, ref, type Component } from 'vue'
import { calls } from '../../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import { toasts } from '../../Toast/toast'
import ApiKeyCreate from './ApiKeyCreate.vue'

// jsdom has no clipboard. Shimmed for this file only, so no other test file sees it (the harness
// provides the modal dialog).
/** The clipboard's writes, settled by the test. */
const writes: { text: string; resolve(): void; reject(error: Error): void }[] = []
beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: (text: string) => new Promise<void>((resolve, reject) => writes.push({ text, resolve, reject })) },
  })
})
afterAll(() => {
  delete (navigator as unknown as Record<string, unknown>)['clipboard']
})

let view: Mounted | undefined
const open = ref(true)
afterEach(() => {
  view?.unmount()
  view = undefined
  jest.useRealTimers()
  writes.length = 0
  open.value = true
})

/** Microtasks and renders only: the timers may be fake. */
async function flush(): Promise<void> {
  for (let round = 0; round < 5; round++) await nextTick()
}

/** Mounts the dialog open and creates a key, so the secret shows with its Copy button. */
async function created(): Promise<Mounted> {
  const mounted = mount(ApiKeyCreate as Component, () => ({
    modelValue: open.value,
    'onUpdate:modelValue': (value: boolean) => (open.value = value),
    create: calls.createApiKey,
    scopes: [{ value: 'customers:read', label: 'Read customers' }],
    expiryDays: [90, 0],
  }))
  await createKey(mounted)
  return mounted
}

async function createKey(mounted: Mounted): Promise<void> {
  await settle()
  const name = mounted.root.querySelector('input[name="name"]') as HTMLInputElement
  name.value = 'CI'
  name.dispatchEvent(new Event('input', { bubbles: true }))
  mounted.root.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))
  await settle()
  expect((mounted.root.querySelector('input[name="secret"]') as HTMLInputElement | null)?.value).toStartWith('demo_')
  // Vue drops a click stamped in the millisecond its button's listener was attached: let the clock move.
  await new Promise((resolve) => setTimeout(resolve, 2))
}

const button = (label: string): HTMLButtonElement | undefined =>
  [...view!.root.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === label)
const failedLine = (): string | undefined => view!.root.querySelector('[role="alert"]')?.textContent ?? undefined
const toasted = (): string[] => toasts.map((item) => item.message)

test('a copy toasts Copied and the button turns back after 2000 ms', async () => {
  view = await created()
  jest.useFakeTimers()
  button('Copy')?.click()
  expect(writes.map((write) => write.text)).toEqual([(view.root.querySelector('input[name="secret"]') as HTMLInputElement).value])
  writes[0]?.resolve()
  await flush()
  expect(toasted()).toEqual(['Copied'])
  expect(button('Copied')).toBeDefined()
  jest.advanceTimersByTime(1999)
  await flush()
  expect(button('Copied')).toBeDefined()
  jest.advanceTimersByTime(1)
  await flush()
  expect(button('Copy')).toBeDefined()
  expect(failedLine()).toBeUndefined()
})

test('a refused write shows the line under the field and turns Copied back; the next copy clears it', async () => {
  view = await created()
  button('Copy')?.click()
  writes[0]?.resolve()
  await flush()
  button('Copied')?.click()
  writes[1]?.reject(new DOMException('denied', 'NotAllowedError'))
  await flush()
  expect(failedLine()).toBe('Copy failed. Select the key and copy it by hand.')
  expect(view.root.querySelector('.ui-field')?.contains(view.root.querySelector('[role="alert"]'))).toBe(true)
  expect(toasted()).toEqual(['Copied'])
  expect(button('Copied')).toBeUndefined()
  expect(button('Copy')).toBeDefined()
  button('Copy')?.click()
  await flush()
  expect(failedLine()).toBeUndefined()
})

test('two quick copies: only the last write counts and one timer runs', async () => {
  view = await created()
  jest.useFakeTimers()
  button('Copy')?.click()
  button('Copy')?.click()
  writes[0]?.resolve()
  await flush()
  expect(toasted()).toEqual([])
  writes[1]?.resolve()
  await flush()
  expect(toasted()).toEqual(['Copied'])
  jest.advanceTimersByTime(1500)
  button('Copied')?.click()
  writes[2]?.resolve()
  await flush()
  jest.advanceTimersByTime(600)
  await flush()
  expect(button('Copied')).toBeDefined()
  jest.advanceTimersByTime(1400)
  await flush()
  expect(button('Copy')).toBeDefined()
  expect(jest.getTimerCount()).toBe(0)
})

test('closing forgets the line, and a write that settles after the dialog closed changes nothing', async () => {
  view = await created()
  const secret = (view.root.querySelector('input[name="secret"]') as HTMLInputElement).value
  button('Copy')?.click()
  button('Done')?.click()
  await flush()
  // The secret is gone at once; its layout stays, emptied, while the dialog fades out (D94).
  expect((view.root.querySelector('input[name="secret"]') as HTMLInputElement).value).toBe('')
  expect(view.root.innerHTML).not.toContain(secret)
  expect(view.root.querySelector('.ui-dialog__title')?.textContent).toBe('Your new API key')
  expect(view.root.querySelector('form')).toBeNull()
  // The same panel leaves: no X turns up, the secret's actions stay.
  expect(view.root.querySelector('.ui-dialog__close')).toBeNull()
  expect([...view.root.querySelectorAll('.ui-dialog__actions button')].map((item) => item.textContent?.trim())).toEqual(['Copy', 'Done'])
  writes[0]?.resolve()
  await flush()
  expect(toasted()).toEqual([])
  open.value = true
  await createKey(view)
  button('Copy')?.click()
  writes[1]?.reject(new Error('denied'))
  await flush()
  expect(failedLine()).toBeDefined()
  button('Done')?.click()
  await flush()
  open.value = true
  await createKey(view)
  expect(failedLine()).toBeUndefined()
  button('Copy')?.click()
  button('Done')?.click()
  writes[2]?.reject(new Error('denied'))
  await flush()
  open.value = true
  await createKey(view)
  expect(failedLine()).toBeUndefined()
  expect(button('Copy')).toBeDefined()
})

test('a write that settles after the unmount changes nothing and starts no timer', async () => {
  view = await created()
  jest.useFakeTimers()
  button('Copy')?.click()
  view.unmount()
  view = undefined
  const timers = jest.getTimerCount()
  writes[0]?.resolve()
  await flush()
  expect(toasted()).toEqual([])
  expect(jest.getTimerCount()).toBe(timers)
})

test('a copied key is forgotten under another identity; the next key starts clean', async () => {
  view = await created()
  const secret = (view.root.querySelector('input[name="secret"]') as HTMLInputElement).value
  button('Copy')?.click()
  writes[0]?.resolve()
  await flush()
  expect(button('Copied')).toBeDefined()
  view.pair.value.end()
  view.pair.value = view.pairFor('test:bob')
  await settle()
  expect(open.value).toBe(false)
  expect((view.root.querySelector('input[name="secret"]') as HTMLInputElement).value).toBe('')
  expect(view.root.innerHTML).not.toContain(secret)
  open.value = true
  await createKey(view)
  expect(button('Copy')).toBeDefined()
  expect(failedLine()).toBeUndefined()
})
