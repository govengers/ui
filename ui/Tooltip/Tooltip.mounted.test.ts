// Tooltip mounted (D69, D90): when it shows and hides, the one-at-a-time rule, what it sets on its
// trigger in both forms, cleanup, and the end placement. Hover delay and grace run on fake timers.
import { afterEach, expect, jest, test } from 'bun:test'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import { key, mount, type Mounted } from '../../scripts/test/mount'
import Popover from '../Popover/Popover.vue'
import Tooltip from './Tooltip.vue'
import { tooltipDelay, tooltipGrace } from './tooltip'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
  jest.useRealTimers()
})

/** Microtasks and renders only, so it works under fake timers too. */
async function flush(): Promise<void> {
  for (let round = 0; round < 4; round++) await nextTick()
}

const button = (name: string) => [...(view?.root.querySelectorAll('button') ?? [])].find(element => element.textContent?.startsWith(name)) as HTMLButtonElement
const panels = () => [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')]
const pointer = (target: Element, type: 'pointerover' | 'pointerout' | 'pointerdown', pointerType = 'mouse', relatedTarget: Element | null = null) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType, relatedTarget }))
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Counts the animation frames requested and not yet run or cancelled. */
function frames() {
  const pending = new Set<number>()
  const request = globalThis.requestAnimationFrame
  const cancel = globalThis.cancelAnimationFrame
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    const id = request(time => {
      pending.delete(id)
      callback(time)
    })
    pending.add(id)
    return id
  }
  globalThis.cancelAnimationFrame = (id: number) => {
    pending.delete(id)
    cancel(id)
  }
  return { pending, restore: () => Object.assign(globalThis, { requestAnimationFrame: request, cancelAnimationFrame: cancel }) }
}

function wrapped(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}): Mounted {
  return mount(Tooltip as Component, () => ({ text: 'Exports the rows.', ...props }), { default: () => h('button', { type: 'button', ...attrs }, 'Export') })
}

test('keyboard focus opens the panel as a popover at once; blur hides it', async () => {
  const opened: Element[] = []
  const proto = HTMLElement.prototype as unknown as { showPopover: () => void }
  const showPopover = proto.showPopover
  proto.showPopover = function (this: Element) {
    opened.push(this)
  }
  try {
    view = wrapped()
    button('Export').focus()
    await flush()
    expect(panels().map(panel => panel.textContent)).toEqual(['Exports the rows.'])
    expect(opened).toEqual(panels())
    button('Export').blur()
    await flush()
    expect(panels()).toHaveLength(0)
  } finally {
    proto.showPopover = showPopover
  }
})

test('focus that is not :focus-visible (a mouse click) shows nothing', async () => {
  view = wrapped()
  const trigger = button('Export')
  trigger.matches = (selector: string) => selector !== ':focus-visible' && Element.prototype.matches.call(trigger, selector)
  trigger.focus()
  await flush()
  expect(panels()).toHaveLength(0)
})

test('shown by focus, it stays while the pointer passes over the trigger and leaves', async () => {
  jest.useFakeTimers()
  view = wrapped()
  button('Export').focus()
  await flush()
  pointer(button('Export'), 'pointerover')
  pointer(button('Export'), 'pointerout', 'mouse', document.body)
  jest.advanceTimersByTime(tooltipGrace * 5)
  await flush()
  expect(panels()).toHaveLength(1)
})

test('after Escape, a tooltip the pointer shows again leaves with the pointer', async () => {
  jest.useFakeTimers()
  view = wrapped()
  button('Export').focus()
  await flush()
  key(button('Export'), 'Escape')
  pointer(button('Export'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  expect(panels()).toHaveLength(1)
  pointer(button('Export'), 'pointerout', 'mouse', document.body)
  jest.advanceTimersByTime(tooltipGrace)
  await flush()
  expect(panels()).toHaveLength(0)
})

test('a press by key (a click) hides it', async () => {
  view = wrapped()
  button('Export').focus()
  await flush()
  button('Export').click()
  await flush()
  expect(panels()).toHaveLength(0)
})

test('after a pointer press, hover shows nothing until the pointer left the trigger', async () => {
  jest.useFakeTimers()
  view = mount(Tooltip as Component, () => ({ text: 'Filters' }), { default: () => h('button', { type: 'button' }, [h('span', { class: 'icon' }), 'Filter']) })
  const trigger = button('Filter')
  const icon = trigger.querySelector('.icon')!
  pointer(trigger, 'pointerdown')
  pointer(icon, 'pointerover')
  jest.advanceTimersByTime(tooltipDelay * 2)
  await flush()
  expect(panels()).toHaveLength(0)
  pointer(trigger, 'pointerout', 'mouse', document.body)
  pointer(trigger, 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  expect(panels()).toHaveLength(1)
})

test('a press on the panel inside its trigger hides it and leaves hover working', async () => {
  jest.useFakeTimers()
  view = mount(defineComponent({ render: () => h('button', { type: 'button', 'aria-label': 'Bold' }, ['B', h(Tooltip, { text: 'Bold', kind: 'label' })]) }))
  pointer(button('B'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  pointer(panels()[0]!, 'pointerdown')
  await flush()
  expect(panels()).toHaveLength(0)
  pointer(button('B'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  expect(panels()).toHaveLength(1)
})

test('around a display: contents element the trigger is its first element with a box', async () => {
  view = mount(Tooltip as Component, () => ({ text: 'Hint' }), { default: () => h('span', { style: 'display: contents' }, [h('button', { type: 'button' }, 'Inner')]) })
  button('Inner').focus()
  await flush()
  expect(button('Inner').getAttribute('aria-describedby')).toBe(panels()[0]?.id ?? 'none')
})

test('a press on the panel hides it', async () => {
  view = wrapped()
  button('Export').focus()
  await flush()
  pointer(panels()[0]!, 'pointerdown')
  await flush()
  expect(panels()).toHaveLength(0)
})

test('focus that a modal dialog moves in while it opens shows nothing; Tab inside the dialog does', async () => {
  view = mount(defineComponent({
    render: () => h('div', [
      h('button', { type: 'button' }, 'Opener'),
      h('dialog', { open: true }, [h(Tooltip, { text: 'Close' }, { default: () => h('button', { type: 'button' }, 'Close') }), h('button', { type: 'button' }, 'Cancel')]),
    ]),
  }))
  // An open dialog that is not modal (Dialog's inline form) leaves the page reachable: focus from outside shows it.
  button('Opener').focus()
  button('Close').focus()
  await flush()
  expect(panels()).toHaveLength(1)
  const dialog = view.root.querySelector('dialog')!
  dialog.matches = (selector: string) => selector === ':modal' || Element.prototype.matches.call(dialog, selector)
  button('Opener').focus()
  button('Close').focus()
  await flush()
  expect(panels()).toHaveLength(0)
  // From nowhere (a shortcut opened it while nothing had focus): the same.
  button('Close').blur()
  button('Close').focus()
  await flush()
  expect(panels()).toHaveLength(0)
  button('Cancel').focus()
  button('Close').focus()
  await flush()
  expect(panels()).toHaveLength(1)
})

test('Escape hides it and closes nothing under it', async () => {
  view = wrapped()
  button('Export').focus()
  await flush()
  const event = key(button('Export'), 'Escape')
  await flush()
  expect(panels()).toHaveLength(0)
  expect(event.defaultPrevented).toBe(true)
  // Hidden, the tooltip leaves the next Escape alone.
  expect(key(button('Export'), 'Escape').defaultPrevented).toBe(false)
})

test('Escape reaches it even when the trigger stops the key', async () => {
  view = wrapped({}, { onKeydown: (event: KeyboardEvent) => event.stopPropagation() })
  button('Export').focus()
  await flush()
  key(button('Export'), 'Escape')
  await flush()
  expect(panels()).toHaveLength(0)
})

test('a press on the trigger hides it', async () => {
  view = wrapped()
  button('Export').focus()
  await flush()
  pointer(button('Export'), 'pointerdown')
  await flush()
  expect(panels()).toHaveLength(0)
})

test('description adds the panel to aria-describedby while shown and keeps the trigger\'s own ids', async () => {
  view = wrapped({}, { 'aria-describedby': 'hint' })
  button('Export').focus()
  await flush()
  const [panel] = panels()
  expect(button('Export').getAttribute('aria-describedby')).toBe(`hint ${panel?.id}`)
  expect(panel?.hasAttribute('aria-hidden')).toBe(false)
  button('Export').blur()
  await flush()
  expect(button('Export').getAttribute('aria-describedby')).toBe('hint')
})

test('a kind that changes while shown leaves no id behind', async () => {
  const kind = ref<'description' | 'label'>('description')
  view = mount(defineComponent({ render: () => h(Tooltip, { text: 'Hint', kind: kind.value }, { default: () => h('button', { type: 'button' }, 'Export') }) }))
  button('Export').focus()
  await flush()
  kind.value = 'label'
  await flush()
  button('Export').blur()
  await flush()
  expect(button('Export').hasAttribute('aria-describedby')).toBe(false)
})

test('label sets nothing on the trigger and hides the panel from assistive technology', async () => {
  view = wrapped({ kind: 'label' })
  button('Export').focus()
  await flush()
  expect(button('Export').hasAttribute('aria-describedby')).toBe(false)
  expect(panels()[0]?.getAttribute('aria-hidden')).toBe('true')
})

test('inside its trigger a description panel is hidden from assistive technology, so it joins no name', async () => {
  view = mount(defineComponent({ render: () => h('button', { type: 'button' }, ['Strong', h(Tooltip, { text: 'Bold' })]) }))
  button('Strong').focus()
  await flush()
  const [panel] = panels()
  expect(panel?.getAttribute('aria-hidden')).toBe('true')
  expect(button('Strong').getAttribute('aria-describedby')).toBe(panel?.id ?? 'none')
})

test('without a slot the element it sits in is the trigger', async () => {
  view = mount(defineComponent({
    render: () => h('button', { type: 'button', 'aria-label': 'Bold' }, ['B', h(Tooltip, { text: 'Bold', kind: 'label' })]),
  }))
  const trigger = button('B')
  trigger.focus()
  await flush()
  expect(panels()).toHaveLength(1)
  expect(trigger.contains(panels()[0]!)).toBe(true)
  trigger.blur()
  await flush()
  expect(panels()).toHaveLength(0)
})

test('a slot that swaps its element keeps the tooltip on the new one', async () => {
  const which = ref('One')
  view = mount(defineComponent({
    render: () => h(Tooltip, { text: 'Hint' }, { default: () => h('button', { key: which.value, type: 'button' }, which.value) }),
  }))
  which.value = 'Two'
  await flush()
  button('Two').focus()
  await flush()
  expect(panels().map(panel => panel.textContent)).toEqual(['Hint'])
})

test('a press on a trigger the slot then swaps leaves hover working on the new one', async () => {
  jest.useFakeTimers()
  const which = ref('One')
  view = mount(defineComponent({
    render: () => h(Tooltip, { text: 'Hint' }, { default: () => h('button', { key: which.value, type: 'button' }, which.value) }),
  }))
  pointer(button('One'), 'pointerdown')
  which.value = 'Two'
  await flush()
  pointer(button('Two'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  expect(panels()).toHaveLength(1)
})

test('nothing shows while the trigger\'s own popover is open, around its trigger or around the whole Popover', async () => {
  jest.useFakeTimers()
  const open = ref(false)
  type Scope = { toggle: () => void; expanded: Record<string, unknown> }
  const trigger = (name: string) => ({ toggle, expanded }: Scope) => h('button', { type: 'button', ...expanded, onClick: toggle }, name)
  const model = { modelValue: open.value, 'onUpdate:modelValue': (value: boolean) => (open.value = value) }
  view = mount(defineComponent({
    render: () => [
      h(Popover, { ...model, modelValue: open.value, label: 'One' }, {
        trigger: (scope: Scope) => h(Tooltip, { text: 'Around the trigger' }, { default: () => trigger('One')(scope) }),
        default: () => 'Panel one',
      }),
      // The Popover's root is display: contents in the browser; the harness compiles no styles.
      h(Tooltip, { text: 'Around the popover' }, {
        default: () => h(Popover, { ...model, modelValue: open.value, label: 'Two', style: 'display: contents' }, { trigger: trigger('Two'), default: () => 'Panel two' }),
      }),
    ],
  }))
  for (const [name, text] of [['One', 'Around the trigger'], ['Two', 'Around the popover']] as const) {
    open.value = true
    await flush()
    expect(button(name).getAttribute('aria-expanded')).toBe('true')
    button(name).focus()
    pointer(button(name), 'pointerover')
    jest.advanceTimersByTime(tooltipDelay)
    await flush()
    expect(panels()).toHaveLength(0)
    pointer(button(name), 'pointerout', 'mouse', document.body)
    // Closed, focus still there: hover shows it, and the focus that came while it was open holds nothing.
    open.value = false
    await flush()
    pointer(button(name), 'pointerover')
    jest.advanceTimersByTime(tooltipDelay)
    await flush()
    expect(panels().map(panel => panel.textContent)).toEqual([text])
    pointer(button(name), 'pointerout', 'mouse', document.body)
    jest.advanceTimersByTime(tooltipGrace)
    await flush()
    expect(panels()).toHaveLength(0)
  }
})

test('an expanded disclosure without a popup still shows it', async () => {
  view = wrapped({}, { 'aria-expanded': 'true' })
  button('Export').focus()
  await flush()
  expect(panels()).toHaveLength(1)
})

test('a mouse shows it after tooltipDelay, a touch never', async () => {
  jest.useFakeTimers()
  view = wrapped()
  pointer(button('Export'), 'pointerover', 'touch')
  jest.advanceTimersByTime(tooltipDelay * 2)
  await flush()
  expect(panels()).toHaveLength(0)
  pointer(button('Export'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay - 1)
  await flush()
  expect(panels()).toHaveLength(0)
  jest.advanceTimersByTime(1)
  await flush()
  expect(panels()).toHaveLength(1)
})

test('leaving before the delay shows nothing', async () => {
  jest.useFakeTimers()
  view = wrapped()
  pointer(button('Export'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay / 2)
  pointer(button('Export'), 'pointerout', 'mouse', document.body)
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  expect(panels()).toHaveLength(0)
})

test('a move between children of the trigger is no leave', async () => {
  jest.useFakeTimers()
  view = mount(Tooltip as Component, () => ({ text: 'Filters' }), { default: () => h('button', { type: 'button' }, [h('span', { class: 'icon' }), 'Filter']) })
  const trigger = button('Filter')
  const icon = trigger.querySelector('.icon')!
  pointer(trigger, 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  pointer(trigger, 'pointerout', 'mouse', icon)
  pointer(icon, 'pointerout', 'mouse', trigger)
  jest.advanceTimersByTime(tooltipGrace * 3)
  await flush()
  expect(panels()).toHaveLength(1)
})

test('it hides tooltipGrace after the pointer left, unless the pointer reaches the panel', async () => {
  jest.useFakeTimers()
  view = wrapped()
  pointer(button('Export'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  const [panel] = panels()
  // Across the gap onto the panel within the grace: it stays.
  pointer(button('Export'), 'pointerout', 'mouse', document.body)
  jest.advanceTimersByTime(tooltipGrace - 1)
  pointer(panel!, 'pointerover', 'mouse', document.body)
  jest.advanceTimersByTime(tooltipGrace * 3)
  await flush()
  expect(panels()).toHaveLength(1)
  // Off the panel and away: gone after the grace.
  pointer(panel!, 'pointerout', 'mouse', document.body)
  jest.advanceTimersByTime(tooltipGrace - 1)
  await flush()
  expect(panels()).toHaveLength(1)
  jest.advanceTimersByTime(1)
  await flush()
  expect(panels()).toHaveLength(0)
})

test('showing a second tooltip hides the first', async () => {
  jest.useFakeTimers()
  view = mount(defineComponent({
    render: () => [
      h(Tooltip, { text: 'First' }, { default: () => h('button', { type: 'button' }, 'One') }),
      h(Tooltip, { text: 'Second' }, { default: () => h('button', { type: 'button' }, 'Two') }),
    ],
  }))
  button('One').focus()
  await flush()
  expect(panels().map(panel => panel.textContent)).toEqual(['First'])
  pointer(button('Two'), 'pointerover')
  jest.advanceTimersByTime(tooltipDelay)
  await flush()
  expect(panels().map(panel => panel.textContent)).toEqual(['Second'])
})

test('placement end puts the panel at the trigger\'s inline end, centred on it', async () => {
  const rect = Element.prototype.getBoundingClientRect
  const root = document.documentElement
  Object.defineProperty(root, 'clientWidth', { value: 1280, configurable: true })
  Object.defineProperty(root, 'clientHeight', { value: 800, configurable: true })
  Element.prototype.getBoundingClientRect = function (this: Element) {
    if (this.matches('[role="tooltip"]')) return { top: 0, bottom: 24, left: 0, right: 80, width: 80, height: 24 } as DOMRect
    if (this.matches('button')) return { top: 100, bottom: 144, left: 8, right: 52, width: 44, height: 44 } as DOMRect
    return rect.call(this)
  }
  try {
    view = wrapped({ kind: 'label', placement: 'end' })
    button('Export').focus()
    await flush()
    const [panel] = panels()
    expect(panel?.dataset['placement']).toBe('end')
    expect([panel?.style.top, panel?.style.left]).toEqual(['110px', '56px'])
  } finally {
    Element.prototype.getBoundingClientRect = rect
    delete (root as unknown as Record<string, unknown>)['clientWidth']
    delete (root as unknown as Record<string, unknown>)['clientHeight']
  }
})

test('one frame loop while shown, even after focus, blur, focus in one task; none after blur or unmount', async () => {
  const loop = frames()
  try {
    view = wrapped()
    button('Export').focus()
    button('Export').blur()
    button('Export').focus()
    await flush()
    await wait(50)
    expect(loop.pending.size).toBe(1)
    button('Export').blur()
    await flush()
    expect(loop.pending.size).toBe(0)
    button('Export').focus()
    await flush()
    view.unmount()
    view = undefined
    await wait(50)
    expect(loop.pending.size).toBe(0)
    // The key listener went with it: Escape is nobody's.
    expect(key(document.body, 'Escape').defaultPrevented).toBe(false)
  } finally {
    loop.restore()
  }
})
