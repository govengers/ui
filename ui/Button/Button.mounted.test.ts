// Button mounted (D69, D91): a loading Button keeps its focus and swallows every click, so a second
// press, Enter in a field of its form (the browser's synthetic click on the submit button) and a
// scripted click fire nothing; a disabled link does not navigate; an icon-only Button shows its
// label through Tooltip. Spinner timing, width and the accessibility tree are browser checks.
import { afterEach, expect, jest, test } from 'bun:test'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import type { Router } from 'vue-router'
import { mount, settle, type Mounted } from '../../scripts/test/mount'
import Icon from '../Icon/Icon.vue'
import Button from './Button.vue'
import ButtonDemo from './Button.demo.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

async function flush(): Promise<void> {
  for (let round = 0; round < 4; round++) await nextTick()
}

/** Names the focused element, so a failure prints a word instead of a whole DOM node. */
const focused = () => document.activeElement?.tagName.toLowerCase()

/**
 * Vue drops an event stamped in the millisecond a listener was attached (the first listener stamps
 * it), so a "reached nobody" would pass by accident: every click here waits for the clock to move.
 */
const clock = () => new Promise((resolve) => setTimeout(resolve, 2))

async function click(target: Element): Promise<MouseEvent> {
  await clock()
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

/** A form with a field and a submit Button inside a parent that listens; counts what each received. */
function form(initial: { loading?: boolean; disabled?: boolean } = {}) {
  const loading = ref(initial.loading ?? false)
  const disabled = ref(initial.disabled ?? false)
  const counts = { submit: 0, parent: 0, own: 0 }
  const Host = defineComponent(() => () => h('form', { onSubmit: (event: Event) => { event.preventDefault(); counts.submit += 1 } }, [
    h('input', { name: 'name' }),
    h('div', { onClick: () => { counts.parent += 1 } }, [
      h(Button, { type: 'submit', loading: loading.value, disabled: disabled.value, onClick: () => { counts.own += 1 } }, { default: () => 'Save' }),
    ]),
  ]))
  view = mount(Host as Component)
  return { loading, disabled, counts, button: view.root.querySelector('button')!, field: view.root.querySelector('input')! }
}

test('a focused submit keeps the focus when loading starts and when it ends; it is busy, not natively disabled', async () => {
  const { loading, button } = form()
  button.focus()
  loading.value = true
  await flush()
  expect(focused()).toBe('button')
  expect([button.disabled, button.getAttribute('aria-disabled'), button.getAttribute('aria-busy'), button.dataset['state']]).toEqual([false, 'true', 'true', 'loading'])
  loading.value = false
  await flush()
  expect(focused()).toBe('button')
  expect([button.disabled, button.getAttribute('aria-disabled'), button.getAttribute('aria-busy'), button.dataset['state']]).toEqual([false, null, null, undefined])
})

test('while loading a press, a double click and a held key reach neither the caller, nor a parent, nor the form; afterwards a press goes through', async () => {
  const { loading, counts, button } = form({ loading: true })
  const presses = [await click(button), await click(button), await click(button)]
  expect(presses.map(event => event.defaultPrevented)).toEqual([true, true, true])
  expect(counts).toEqual({ submit: 0, parent: 0, own: 0 })
  loading.value = false
  await flush()
  expect((await click(button)).defaultPrevented).toBe(false)
  expect(counts).toEqual({ submit: 1, parent: 1, own: 1 })
})

test('Enter in a field while loading submits nothing: the implicit submit is a synthetic click on the submit button', async () => {
  // jsdom does no implicit submission; the browser's form of it is this click (a real key press is a browser check).
  const { loading, counts, button, field } = form({ loading: true })
  await clock()
  field.focus()
  button.click()
  expect(counts).toEqual({ submit: 0, parent: 0, own: 0 })
  expect(focused()).toBe('input')
  loading.value = false
  await flush()
  await clock()
  button.click()
  expect(counts).toEqual({ submit: 1, parent: 1, own: 1 })
})

test('loading wins over disabled: focusable and inert while loading; a Button without the focus is natively disabled once it ends', async () => {
  const { loading, counts, button } = form({ loading: true, disabled: true })
  expect([button.disabled, button.getAttribute('aria-disabled')]).toEqual([false, 'true'])
  expect((await click(button)).defaultPrevented).toBe(true)
  expect(counts).toEqual({ submit: 0, parent: 0, own: 0 })
  loading.value = false
  await flush()
  expect([button.disabled, button.getAttribute('aria-disabled'), button.dataset['state']]).toEqual([true, null, undefined])
})

test('a Button disabled while it holds the focus keeps it, disabled in every way but focus, until the focus leaves', async () => {
  const { loading, counts, button, field } = form({ loading: true, disabled: true })
  button.focus()
  loading.value = false
  await flush()
  expect(focused()).toBe('button')
  expect([button.disabled, button.getAttribute('aria-disabled'), button.getAttribute('aria-busy'), button.dataset['state']]).toEqual([false, 'true', null, undefined])
  expect((await click(button)).defaultPrevented).toBe(true)
  button.click() // the implicit submit of Enter in a field
  expect(counts).toEqual({ submit: 0, parent: 0, own: 0 })
  field.focus()
  await flush()
  expect([button.disabled, button.getAttribute('aria-disabled')]).toEqual([true, null])
})

test('the hold survives a window switch, ends when disabled turns false and comes back when it turns true again; blur ends it', async () => {
  const { disabled, counts, button } = form()
  button.focus()
  disabled.value = true
  await flush()
  expect([button.disabled, button.getAttribute('aria-disabled')]).toEqual([false, 'true'])
  // The window lost the focus: the Button gets blur but stays the document's focus.
  button.dispatchEvent(new FocusEvent('blur'))
  await flush()
  expect([focused(), button.disabled, button.getAttribute('aria-disabled')]).toEqual(['button', false, 'true'])
  disabled.value = false
  await flush()
  expect([button.disabled, button.getAttribute('aria-disabled')]).toEqual([false, null])
  await click(button)
  expect(counts).toEqual({ submit: 1, parent: 1, own: 1 })
  disabled.value = true
  await flush()
  expect([button.disabled, button.getAttribute('aria-disabled')]).toEqual([false, 'true'])
  button.blur()
  await flush()
  expect([button.disabled, button.getAttribute('aria-disabled')]).toEqual([true, null])
})

test('a press in the task that ends the hold does nothing: the guard does not wait for the render', async () => {
  for (const leave of ['blur', 'field'] as const) {
    const { loading, counts, button, field } = form({ loading: true, disabled: true })
    button.focus()
    loading.value = false
    await flush()
    await clock()
    if (leave === 'blur') button.blur()
    else field.focus()
    button.click()
    expect([leave, counts]).toEqual([leave, { submit: 0, parent: 0, own: 0 }])
    view?.unmount()
  }
})

test('a Button disabled without the focus is natively disabled at once', async () => {
  const { disabled, button, field } = form()
  button.focus()
  field.focus()
  disabled.value = true
  await flush()
  expect([button.disabled, button.getAttribute('aria-disabled')]).toEqual([true, null])
})

test('a disabled or loading anchor does not navigate and its click reaches no parent', async () => {
  for (const state of [{ disabled: true }, { loading: true }]) {
    let parent = 0
    const Host = defineComponent(() => () => h('div', { onClick: () => { parent += 1 } }, [h(Button, { href: '/elsewhere', ...state }, { default: () => 'Open' })]))
    view = mount(Host as Component)
    const link = view.root.querySelector('a')!
    expect([link.getAttribute('href'), link.getAttribute('aria-disabled'), link.hasAttribute('disabled')]).toEqual(['/elsewhere', 'true', false])
    expect((await click(link)).defaultPrevented).toBe(true)
    expect(parent).toBe(0)
    view.unmount()
    view = undefined
  }
})

test('a disabled router link stays where it is; enabled it navigates', async () => {
  const disabled = ref(true)
  view = mount(Button as Component, () => ({ to: '/next', disabled: disabled.value }), { default: () => 'Next' })
  const router = (view.root as unknown as { __vue_app__: { config: { globalProperties: { $router: Router } } } }).__vue_app__.config.globalProperties.$router
  await router.isReady()
  const link = view.root.querySelector('a')!
  expect(link.getAttribute('aria-disabled')).toBe('true')
  expect((await click(link)).defaultPrevented).toBe(true)
  await settle()
  expect(router.currentRoute.value.path).toBe('/')
  disabled.value = false
  await settle()
  await click(link)
  await settle()
  expect(router.currentRoute.value.path).toBe('/next')
})

test('a middle click on a loading or disabled link is swallowed, in both link forms; on an idle link it is not', async () => {
  for (const [link, state, swallowed] of [[{ href: '/elsewhere' }, { loading: true }, true], [{ href: '/elsewhere' }, { disabled: true }, true], [{ to: '/next' }, { loading: true }, true], [{ to: '/next' }, { disabled: true }, true], [{ href: '/elsewhere' }, {}, false], [{ to: '/next' }, {}, false]] as const) {
    let parent = 0
    const Host = defineComponent(() => () => h('div', { onAuxclick: () => { parent += 1 } }, [h(Button, { ...link, ...state }, { default: () => 'Open' })]))
    view = mount(Host as Component)
    await clock()
    const event = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })
    view.root.querySelector('a')!.dispatchEvent(event)
    expect([JSON.stringify([link, state]), event.defaultPrevented, parent]).toEqual([JSON.stringify([link, state]), swallowed, swallowed ? 0 : 1])
    view.unmount()
    view = undefined
  }
})

test('the spinner joins the content while loading: the icon and the label stay, they are the name', async () => {
  const loading = ref(false)
  view = mount(Button as Component, () => ({ loading: loading.value }), { icon: () => h(Icon, { name: 'download' }), default: () => 'Export' })
  const button = view.root.querySelector('button')!
  expect(button.querySelector('.ui-button__spinner')).toBeNull()
  loading.value = true
  await flush()
  expect([...button.children].map(child => child.getAttribute('class'))).toEqual(['ui-icon', 'ui-button__label', 'ui-icon ui-button__spinner'])
  expect([button.textContent, button.querySelector('.ui-button__spinner')?.getAttribute('aria-hidden')]).toEqual(['Export', 'true'])
})

test('an icon-only Button shows its label as a tooltip on keyboard focus, hidden from assistive technology; a Button with text has none', async () => {
  view = mount(Button as Component, () => ({ label: 'Settings' }), { icon: () => h(Icon, { name: 'settings' }) })
  const button = view.root.querySelector('button')!
  button.focus()
  await flush()
  const panel = button.querySelector('[role="tooltip"]')
  expect([panel?.textContent, panel?.getAttribute('aria-hidden'), button.getAttribute('aria-label'), button.hasAttribute('aria-describedby')]).toEqual(['Settings', 'true', 'Settings', false])
  button.blur()
  await flush()
  expect(button.querySelector('[role="tooltip"]')).toBeNull()
  view.unmount()

  view = mount(Button as Component, () => ({ label: 'Save the customer' }), { default: () => 'Save' })
  const text = view.root.querySelector('button')!
  text.focus()
  await flush()
  expect([text.querySelector('.ui-tooltip') === null, document.querySelector('[role="tooltip"]') === null]).toEqual([true, true])
})

test('the content is hidden by opacity, which forced colours keep; a colour they would override', async () => {
  // Styles are not compiled here (D69): the rule is read as text, the forced-colours render is a browser check.
  const source = await Bun.file(new URL('./Button.vue', import.meta.url)).text()
  const cover = /@keyframes ui-button-cover \{([^}]*)\}/.exec(source)?.[1] ?? ''
  expect([cover.includes('opacity: 0'), /color\s*:/.test(cover)]).toEqual([true, false])
})

test('the demo form counts one submit while it loads, also through requestSubmit(), which passes no button', async () => {
  jest.useFakeTimers()
  view = mount(ButtonDemo as Component)
  const form = view.root.querySelector('form')!
  form.requestSubmit()
  await flush()
  form.requestSubmit()
  await flush()
  expect(view.root.querySelector('output')?.textContent).toBe('Submits: 1')
  jest.advanceTimersByTime(1500)
  await flush()
  form.requestSubmit()
  await flush()
  expect(view.root.querySelector('output')?.textContent).toBe('Submits: 2')
})

test('a focused disabled Button is not dimmed as a whole, so its focus ring keeps full strength', async () => {
  // As the cover keyframe: the rules are read as text, the ring's contrast is a browser check.
  const source = await Bun.file(new URL('./Button.vue', import.meta.url)).text()
  const held = '.ui-button[aria-disabled]:focus-visible:not([data-state="loading"])'
  expect([source.includes(`${held} { opacity: 1; }`), /\[data-variant="primary"\]\[aria-disabled\]:focus-visible[^{]*\{ background: color-mix\(/.test(source)]).toEqual([true, true])
})
