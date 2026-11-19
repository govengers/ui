// The reset of setup.ts: what one test leaves behind, the next one does not see. In a run that
// shuffles the order the second test may come first; it then finds the clean start it checks.
import { expect, jest, test } from 'bun:test'
import { defineComponent, h, onBeforeUnmount } from 'vue'
import { toast, toasts } from '../../ui/Toast/toast'
import { mount } from './mount'

let leaked = false
let unmounted = false
const Leaky = defineComponent({
  setup() {
    onBeforeUnmount(() => (unmounted = true))
    return () => h('button', 'Leak')
  },
})

test('a test leaves a view mounted and focused, a toast, storage, a node and fake timers', () => {
  jest.useFakeTimers()
  const view = mount(Leaky)
  view.root.querySelector('button')?.focus()
  toast({ message: 'Left behind.' })
  localStorage.setItem('left', '1')
  sessionStorage.setItem('left', '1')
  document.body.append(document.createElement('aside'))
  expect(document.activeElement?.textContent).toBe('Leak')
  leaked = true
})

test('the next test starts with none of it, and a frame runs on its clock', () => {
  expect(toasts).toHaveLength(0)
  expect(localStorage.length + sessionStorage.length).toBe(0)
  expect(document.body.children).toHaveLength(0)
  expect(document.activeElement).toBe(document.body)
  expect(unmounted).toBe(leaked)
  jest.useFakeTimers()
  let ran = false
  requestAnimationFrame(() => (ran = true))
  jest.advanceTimersByTime(20)
  expect(ran).toBe(true)
  jest.useRealTimers()
})
