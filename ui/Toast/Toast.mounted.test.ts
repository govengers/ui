// Toast mounted (D69, D93): how long a toast stays, the pause while focus is inside, three per
// live region, the leaving toast and where focus goes when a toast closes. Timers are fake; a
// removal is asserted after the timers ran, never synchronously, because TransitionGroup keeps a
// leaving toast until its fade ends. Animation frames run on the test's clock (the harness's), and
// the harness empties the module-wide queue after every test.
import { afterEach, expect, jest, test } from 'bun:test'
import { nextTick } from 'vue'
import { key, mount, type Mounted } from '../../scripts/test/mount'
import Toast from './Toast.vue'
import { dismiss, toast, toasts } from './toast'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
  // Let jsdom's frame loop run dry on the fake clock: a loop it started there (a pending frame, or
  // the focus fixup after a focused node was removed) would outlive the fake timers and hold every
  // later animation frame, and with it every leave of the next test.
  jest.advanceTimersByTime(100)
  jest.useRealTimers()
})

/** Runs the fake clock, then lets Vue render and a leave finish (two animation frames). */
async function pass(ms: number): Promise<void> {
  jest.advanceTimersByTime(ms)
  for (let round = 0; round < 3; round++) {
    await nextTick()
    jest.advanceTimersByTime(20)
  }
  await nextTick()
}

/** A click as a keyboard press makes it (detail 0) or as a pointer does (detail 1). */
const press = (target: Element | null | undefined, detail = 0) => target?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }))
const closeOf = (message: string) => [...(view?.root.querySelectorAll('.ui-toast__item') ?? [])]
  .find((item) => item.querySelector('.ui-toast__message')?.textContent === message)?.querySelector<HTMLButtonElement>('.ui-toast__close')

const messages = (selector = '.ui-toast__item') => [...(view?.root.querySelectorAll(selector) ?? [])].map((item) => item.querySelector('.ui-toast__message')?.textContent)

test('a neutral toast is gone after five seconds', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  toast({ message: 'Export started.' })
  await pass(4800)
  expect(messages()).toEqual(['Export started.'])
  await pass(300)
  expect(messages()).toEqual([])
})

test('a danger toast stays after a minute and goes on dismiss', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  const id = toast({ message: 'Could not delete the customer.', variant: 'danger' })
  await pass(60_000)
  expect(messages()).toEqual(['Could not delete the customer.'])
  dismiss(id)
  await pass(0)
  expect(messages()).toEqual([])
})

test('the countdown stands while focus is inside the host', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  toast({ message: 'Export started.' })
  await pass(0)
  const close = view.root.querySelector<HTMLButtonElement>('.ui-toast__item button')
  close?.focus()
  expect(document.activeElement).toBe(close)
  await pass(10_000)
  expect(messages()).toEqual(['Export started.'])
  close?.blur()
  await pass(5100)
  expect(messages()).toEqual([])
})

// jsdom matches no :hover and the harness's matchMedia no query: both are stood in for here.
for (const [pointer, hovers] of [['a mouse', true], ['a touch screen', false]] as const) {
  test(`a hovered host ${hovers ? 'pauses' : 'does not pause'} the countdown on ${pointer}`, async () => {
    const { matchMedia } = globalThis
    const { matches } = Element.prototype
    globalThis.matchMedia = ((query: string) => ({ ...matchMedia(query), matches: query === '(hover: hover)' && hovers })) as typeof matchMedia
    Element.prototype.matches = function (this: Element, selectors: string) { return selectors === ':hover' ? this.classList.contains('ui-toast') : matches.call(this, selectors) }
    try {
      jest.useFakeTimers()
      view = mount(Toast)
      toast({ message: 'Export started.' })
      await pass(10_000)
      expect(messages()).toEqual(hovers ? ['Export started.'] : [])
    } finally {
      globalThis.matchMedia = matchMedia
      Element.prototype.matches = matches
    }
  })
}

test('a fourth toast waits until one of the first three of its region closes', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  const ids = ['One', 'Two', 'Three', 'Four'].map((message) => toast({ message, duration: Infinity }))
  await pass(0)
  expect(messages()).toEqual(['One', 'Two', 'Three'])
  dismiss(ids[1] ?? 0)
  await pass(0)
  expect(messages()).toEqual(['One', 'Three', 'Four'])
})

test('an error shows at once while three toasts that stay fill the polite region', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  for (const message of ['Archived 1.', 'Archived 2.', 'Archived 3.', 'Archived 4.']) toast({ message, action: { label: 'Undo', run: () => undefined } })
  toast({ message: 'Could not delete the customer.', variant: 'danger' })
  await pass(0)
  expect(messages()).toEqual(['Archived 1.', 'Archived 2.', 'Archived 3.', 'Could not delete the customer.'])
})

test('a leaving toast is inert, stays for its fade and does not run its action twice', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  let runs = 0
  toast({ message: 'Customer archived.', action: { label: 'Undo', run: () => void runs++ } })
  await pass(0)
  // Vue drops a click stamped with the very moment its listener was attached; the fake clock stands still.
  jest.advanceTimersByTime(1)
  const item = view.root.querySelector('.ui-toast__item')
  const undo = item?.querySelector('button:not(.ui-toast__close)')
  press(undo)
  await nextTick()
  expect(item?.isConnected).toBe(true)
  expect(item?.hasAttribute('inert')).toBe(true)
  press(undo)
  press(item?.querySelector('.ui-toast__close'))
  expect(runs).toBe(1)
  await pass(0)
  expect(item?.isConnected).toBe(false)
})

/** Records the options of every focus() call on `element`, then focuses as before. */
function recordFocus(element: HTMLElement): (FocusOptions | undefined)[] {
  const calls: (FocusOptions | undefined)[] = []
  const focus = element.focus.bind(element)
  element.focus = (options?: FocusOptions) => {
    calls.push(options)
    focus(options)
  }
  return calls
}

test('a keyboard close moves focus to the next toast itself, the last one gives it back in view', async () => {
  jest.useFakeTimers()
  const opener = document.body.appendChild(document.createElement('button'))
  try {
    view = mount(Toast)
    for (const message of ['One', 'Two']) toast({ message, duration: Infinity })
    await pass(1)
    opener.focus()
    const calls = recordFocus(opener)
    closeOf('One')?.focus()
    press(closeOf('One'))
    const two = closeOf('Two')?.closest('.ui-toast__item')
    expect(document.activeElement).toBe(two as Element)
    expect(two?.getAttribute('tabindex')).toBe('-1')
    expect(two?.getAttribute('role')).toBe('group')
    expect(document.getElementById(two?.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Two')
    // A window switch blurs it but leaves it the active element: it stays focusable.
    two?.dispatchEvent(new FocusEvent('blur'))
    expect(two?.getAttribute('tabindex')).toBe('-1')
    await pass(0)
    closeOf('Two')?.focus()
    expect(two?.hasAttribute('tabindex')).toBe(false)
    press(closeOf('Two'))
    expect(document.activeElement).toBe(opener)
    expect(calls).toEqual([{ preventScroll: false }])
  } finally {
    opener.remove()
  }
})

test('after a keyboard close the held key repeats nothing until it comes up', async () => {
  jest.useFakeTimers()
  const opener = document.body.appendChild(document.createElement('button'))
  try {
    view = mount(Toast)
    toast({ message: 'One', duration: Infinity })
    await pass(1)
    opener.focus()
    closeOf('One')?.focus()
    press(closeOf('One'))
    expect(document.activeElement).toBe(opener)
    expect(key(opener, 'Enter', { repeat: true }).defaultPrevented).toBe(true)
    opener.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    expect(key(opener, 'Enter', { repeat: true }).defaultPrevented).toBe(false)
  } finally {
    opener.remove()
  }
})

test('after a Space close or a click without a key, the next held key repeats', async () => {
  jest.useFakeTimers()
  const field = document.body.appendChild(document.createElement('input'))
  try {
    view = mount(Toast)
    for (const message of ['One', 'Two']) toast({ message, duration: Infinity })
    await pass(1)
    field.focus()
    // Space presses on keyup: the key is up when the toast closes.
    closeOf('One')?.focus()
    key(closeOf('One') as Element, ' ')
    closeOf('One')?.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
    press(closeOf('One'))
    await pass(0)
    field.focus()
    expect(key(field, 'Backspace').defaultPrevented).toBe(false)
    expect(key(field, 'Backspace', { repeat: true }).defaultPrevented).toBe(false)
    // A click with detail 0 and no key at all, as an assistive technology's default action sends.
    closeOf('Two')?.focus()
    press(closeOf('Two'))
    expect(document.activeElement).toBe(field)
    expect(key(field, 'ArrowDown').defaultPrevented).toBe(false)
    expect(key(field, 'ArrowDown', { repeat: true }).defaultPrevented).toBe(false)
  } finally {
    field.remove()
  }
})

test('unmounting the host releases a guard still armed', async () => {
  jest.useFakeTimers()
  const opener = document.body.appendChild(document.createElement('button'))
  try {
    view = mount(Toast)
    toast({ message: 'One', duration: Infinity })
    await pass(1)
    opener.focus()
    closeOf('One')?.focus()
    press(closeOf('One'))
    expect(key(opener, 'Enter', { repeat: true }).defaultPrevented).toBe(true)
    view.unmount()
    view = undefined
    expect(key(opener, 'Enter', { repeat: true }).defaultPrevented).toBe(false)
  } finally {
    opener.remove()
  }
})

test('a pointer close gives focus back to where it came from without scrolling', async () => {
  jest.useFakeTimers()
  const opener = document.body.appendChild(document.createElement('button'))
  try {
    view = mount(Toast)
    for (const message of ['One', 'Two']) toast({ message, duration: Infinity })
    await pass(1)
    opener.focus()
    const calls = recordFocus(opener)
    closeOf('One')?.focus()
    press(closeOf('One'), 1)
    expect(document.activeElement).toBe(opener)
    expect(calls).toEqual([{ preventScroll: true }])
    expect(key(opener, 'Enter', { repeat: true }).defaultPrevented).toBe(false)
  } finally {
    opener.remove()
  }
})

test('a preview shows every toast and a press in it moves no focus', async () => {
  jest.useFakeTimers()
  const preview = ['One', 'Two', 'Three', 'Four'].map((message) => ({ message }))
  view = mount(Toast, () => ({ preview }))
  await pass(1)
  expect(messages()).toEqual(['One', 'Two', 'Three', 'Four'])
  // Only a keyboard handoff makes a toast focusable, so a click on its text holds no timer.
  expect(view.root.querySelector('.ui-toast__item[tabindex]')).toBeNull()
  closeOf('One')?.focus()
  press(closeOf('One'))
  expect(document.activeElement).toBe(closeOf('One') as Element)
  expect(messages()).toEqual(['One', 'Two', 'Three', 'Four'])
})

test('a timed toast shown beside three errors still leaves after five seconds', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  for (const message of ['Error 1.', 'Error 2.', 'Error 3.']) toast({ message, variant: 'danger' })
  toast({ message: 'Export started.' })
  await pass(4800)
  expect(messages()).toContain('Export started.')
  await pass(300)
  expect(messages()).toEqual(['Error 1.', 'Error 2.', 'Error 3.'])
})

test('danger goes to the assertive region, the others to the polite one', async () => {
  jest.useFakeTimers()
  view = mount(Toast)
  toast({ message: 'Export started.' })
  toast({ message: 'Could not delete the customer.', variant: 'danger' })
  toast({ message: 'Invoice 2026-0042 sent.', variant: 'success' })
  await pass(0)
  expect(messages('[role="status"][aria-live="polite"] > .ui-toast__item')).toEqual(['Export started.', 'Invoice 2026-0042 sent.'])
  expect(messages('[role="alert"][aria-live="assertive"] > .ui-toast__item')).toEqual(['Could not delete the customer.'])
})
