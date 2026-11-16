// CommandPalette mounted (D69): picks under a refusing storage, recents per identity, the active
// option after a paste, and the order of results and actions.
import { afterEach, describe, expect, jest, test } from 'bun:test'
import type { PaletteGroup, RecentPick } from './palette'
import { mount, type Mounted } from '../../../scripts/test/mount'
import { useAgentAction } from '../../agent/registry'
import CommandPalette from './CommandPalette.vue'
import { defineComponent, h, nextTick } from 'vue'

let palette: Mounted | undefined
afterEach(() => {
  palette?.unmount()
  palette = undefined
  jest.useRealTimers()
  localStorage.clear()
})

const groups: PaletteGroup[] = [{ key: 'tasks', label: 'Tasks', search: async (_, text) => [{ id: 't1', label: `Task ${text}` }] }]
const picks: RecentPick[] = []
let ran = 0

// The page binds a mutating action whose description matches the search text.
const Page = defineComponent({
  setup() {
    useAgentAction({ name: 'createTask', description: 'Adds a card to the backlog.', page: 'test', mutating: true }, () => void ran++)
    return () => h(CommandPalette, { groups, inline: true, hotkey: '', onSelect: (pick: RecentPick) => picks.push(pick) })
  },
})

/** Microtasks and renders only: the timers are fake here. */
async function flush(): Promise<void> {
  for (let round = 0; round < 5; round++) await nextTick()
}

async function type(root: HTMLElement, text: string, wait = 200): Promise<HTMLInputElement> {
  const input = root.querySelector('input[name="palette"]') as HTMLInputElement
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  jest.advanceTimersByTime(wait)
  await flush()
  return input
}

const enter = (input: HTMLInputElement): boolean => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

describe('CommandPalette', () => {
  test('a pasted text makes the top result active, above the quick actions', async () => {
    jest.useFakeTimers()
    palette = mount(Page)
    const input = await type(palette.root, 'back')
    const options = [...palette.root.querySelectorAll('[role="option"]')].map((option) => option.textContent ?? '')
    expect(options[0]).toContain('Task back')
    expect(options[1]).toContain('Create task')
    expect(input.getAttribute('aria-activedescendant')).toBe(palette.root.querySelector('[role="option"]')?.id ?? 'none')
  })

  test('a storage that refuses the pick still opens it', async () => {
    jest.useFakeTimers()
    picks.length = 0
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError')
    }
    try {
      palette = mount(Page)
      await type(palette.root, 'fix')
      ;(palette.root.querySelector('[role="option"]') as HTMLElement).click()
      expect(picks.map((pick) => pick.id)).toEqual(['t1'])
    } finally {
      Storage.prototype.setItem = setItem
    }
  })

  test('recent picks belong to the identity that made them', async () => {
    jest.useFakeTimers()
    palette = mount(Page)
    await type(palette.root, 'secret')
    ;(palette.root.querySelector('[role="option"]') as HTMLElement).click()
    await type(palette.root, '')
    expect(palette.root.textContent).toContain('Task secret')
    palette.pair.value.end()
    palette.pair.value = palette.pairFor('test:bob')
    await flush()
    expect(palette.root.textContent).not.toContain('Task secret')
  })

  test('Enter before the answers arrive runs no action, and opens the top result after', async () => {
    jest.useFakeTimers()
    picks.length = 0
    ran = 0
    palette = mount(Page)
    const input = await type(palette.root, 'back', 30)
    enter(input)
    expect(ran).toBe(0)
    jest.advanceTimersByTime(200)
    await flush()
    enter(input)
    expect(ran).toBe(0)
    expect(picks.map((pick) => pick.id)).toEqual(['t1'])
  })

  test('an ended connection shows no recent pick and removes them, before any new pair', async () => {
    jest.useFakeTimers()
    palette = mount(Page)
    await type(palette.root, 'secret')
    ;(palette.root.querySelector('[role="option"]') as HTMLElement).click()
    await type(palette.root, 'sec', 0)
    palette.pair.value.end()
    await flush()
    expect(palette.root.textContent).not.toContain('Task secret')
    expect((palette.root.querySelector('input[name="palette"]') as HTMLInputElement).value).toBe('')
    expect(localStorage.length).toBe(0)
  })

  test('a pair without an identity keeps no recent picks', async () => {
    jest.useFakeTimers()
    palette = mount(Page)
    palette.pair.value.end()
    palette.pair.value = palette.pairFor('')
    await flush()
    await type(palette.root, 'secret')
    ;(palette.root.querySelector('[role="option"]') as HTMLElement).click()
    expect(localStorage.length).toBe(0)
  })
})
