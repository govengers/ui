// Menu mounted (D69): type-ahead moves focus to the next item starting with the typed letter,
// wrapping and skipping disabled items; Space still activates a link item.
import { afterEach, expect, test } from 'bun:test'
import { mount, key, type Mounted } from '../../scripts/test/mount'
import Menu, { type MenuItem } from './Menu.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

const ran: string[] = []
const items: MenuItem[] = [
  { label: 'Open', to: { path: '/customers/1' }, run: () => void ran.push('Open') },
  { label: 'Edit', icon: 'pencil', run: () => void ran.push('Edit') },
  { label: 'Duplicate', icon: 'copy', run: () => void ran.push('Duplicate') },
  { label: '-' },
  { label: 'Archive', disabled: true },
  { label: 'Delete', icon: 'trash', danger: true, run: () => void ran.push('Delete') },
]

function setup(): HTMLElement {
  view = mount(Menu, () => ({ items }))
  // jsdom hides a closed popover and the harness stubs showPopover(): show the panel by hand, or
  // its items cannot take focus.
  view.root.querySelector<HTMLElement>('[popover]')?.style.setProperty('display', 'block')
  const first = view.root.querySelector<HTMLElement>('[role="menuitem"]')
  first?.focus()
  return first as HTMLElement
}
const focused = () => document.activeElement?.textContent?.trim()

test('a letter moves to the next item starting with it, again to the next, wrapping', () => {
  setup()
  key(document.activeElement as Element, 'd')
  expect(focused()).toBe('Duplicate')
  key(document.activeElement as Element, 'd')
  expect(focused()).toBe('Delete')
  key(document.activeElement as Element, 'D')
  expect(focused()).toBe('Duplicate')
  key(document.activeElement as Element, 'o')
  expect(focused()).toBe('Open')
})

test('a disabled item, an unknown letter and a modified key leave focus where it is', () => {
  setup()
  key(document.activeElement as Element, 'a')
  expect(focused()).toBe('Open')
  key(document.activeElement as Element, 'z')
  expect(focused()).toBe('Open')
  key(document.activeElement as Element, 'd', { ctrlKey: true })
  key(document.activeElement as Element, 'd', { metaKey: true })
  key(document.activeElement as Element, 'd', { altKey: true })
  expect(focused()).toBe('Open')
})

test('Space still activates a link item', () => {
  ran.length = 0
  const open = setup()
  expect(open).toBeInstanceOf(HTMLAnchorElement)
  const event = key(open, ' ')
  expect(event.defaultPrevented).toBe(true)
  expect(ran).toEqual(['Open'])
})
