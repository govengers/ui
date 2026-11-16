// Board mounted (D69): focus, lift ends, announcements and live state that only show with the
// component. Pointer drag geometry and auto-scroll need a real browser and stay with the probes.
import { afterEach, describe, expect, test } from 'bun:test'
import { nextTick, ref } from 'vue'
import { calls, live, type Task, type TasksFilter } from '../../../demo/src/fake/api'
import { key, mount, settle, type Mounted } from '../../../scripts/test/mount'
import Board from './Board.vue'
import type { BoardColumn, Placement } from './board'

const columns: BoardColumn[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'Doing' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]
const filter = ref<TasksFilter | undefined>()
const events: string[] = []
let board: Mounted | undefined
afterEach(() => {
  board?.unmount()
  board = undefined
  filter.value = undefined
  events.length = 0
})

async function mountBoard(): Promise<Mounted> {
  board = mount(Board, () => ({
    target: live.tasks, sort: ['position'], filter: filter.value, columns, columnField: 'status', rankField: 'position',
    itemLabel: (task: Task) => task.title, move: calls.moveTask,
    moveArgs: (task: Task, placement: Placement) => ({ parameters: { id: task.id }, body: { status: placement.column, position: placement.rank } }),
    label: 'Board',
    onMoved: (task: Task) => events.push(`moved ${task.title}`),
    'onMove-error': (_: unknown, task: Task) => events.push(`move-error ${task.title}`),
  }))
  await settle()
  return board
}

const cardsIn = (root: HTMLElement, column: string): string[] =>
  [...root.querySelectorAll(`[data-board-column="${column}"] [data-board-card]`)].map((card) => (card as HTMLElement).dataset['boardCard'] ?? '')
const grip = (root: HTMLElement, id: string): HTMLElement => root.querySelector(`[data-board-card="${id}"] [data-board-grip]`) as HTMLElement
const live_ = (root: HTMLElement): string => root.querySelector('[aria-live]')?.textContent ?? ''

describe('Board keyboard path', () => {
  test('Escape after a move to another column puts focus back on the card grip', async () => {
    const { root } = await mountBoard()
    const id = cardsIn(root, 'backlog')[0]!
    grip(root, id).focus()
    key(grip(root, id), ' ')
    await settle(1)
    key(grip(root, id), 'ArrowRight')
    await settle(1)
    expect(cardsIn(root, 'todo')).toContain(id)
    key(grip(root, id), 'Escape')
    await settle(1)
    expect(cardsIn(root, 'backlog')).toContain(id)
    expect(document.activeElement).toBe(grip(root, id))
  })

  test('an arrow to another column keeps the lift when the remount blurs the grip (Chrome)', async () => {
    const { root } = await mountBoard()
    const id = cardsIn(root, 'backlog')[0]!
    grip(root, id).focus()
    key(grip(root, id), ' ')
    await settle(1)
    key(grip(root, id), 'ArrowRight')
    // Chrome fires focusout when the patch removes the focused grip; jsdom does not.
    grip(root, id).dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await settle(1)
    expect(grip(root, id).getAttribute('aria-pressed')).toBe('true')
    expect(cardsIn(root, 'todo')).toContain(id)
    expect(document.activeElement).toBe(grip(root, id))
  })

  test('a move announces the position among the column without counting the card twice', async () => {
    const { root } = await mountBoard()
    const backlog = cardsIn(root, 'backlog')
    const id = backlog[0]!
    grip(root, id).focus()
    key(grip(root, id), ' ')
    await settle(1)
    key(grip(root, id), 'ArrowDown')
    await settle(1)
    key(grip(root, id), ' ')
    await settle(1)
    expect(live_(root)).toContain(`position 2 of ${backlog.length}`)
    expect(document.activeElement).toBe(grip(root, id))
  })

  test('focus leaving the lifted grip cancels the lift, and another card can lift then', async () => {
    const { root } = await mountBoard()
    const [first, second] = cardsIn(root, 'backlog') as [string, string]
    grip(root, first).focus()
    key(grip(root, first), ' ')
    await settle(1)
    key(grip(root, first), 'ArrowRight')
    await settle(1)
    // A click on plain text: focus goes to the body, no relatedTarget.
    grip(root, first).blur()
    await settle(1)
    expect(root.querySelector('.ui-board')?.getAttribute('data-state')).toBeNull()
    expect(cardsIn(root, 'backlog')).toContain(first)
    grip(root, second).focus()
    key(grip(root, second), ' ')
    await settle(1)
    expect(grip(root, second).getAttribute('aria-pressed')).toBe('true')
  })

  test('a click on the grip lifts and a second click drops (screen reader activation)', async () => {
    const { root } = await mountBoard()
    const id = cardsIn(root, 'backlog')[0]!
    grip(root, id).click()
    await settle(1)
    expect(grip(root, id).getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(grip(root, id))
    key(grip(root, id), 'ArrowRight')
    await settle(1)
    grip(root, id).click()
    await settle()
    expect(cardsIn(root, 'todo')).toContain(id)
    expect(grip(root, id).getAttribute('aria-pressed')).toBe('false')
  })

  test('a lifted card removed by a push ends the lift', async () => {
    const { root, engine } = await mountBoard()
    const [first, second] = cardsIn(root, 'backlog') as [string, string]
    grip(root, first).focus()
    key(grip(root, first), ' ')
    await settle(1)
    engine.store.remove('tasks', first)
    await settle()
    expect(root.querySelector('.ui-board')?.getAttribute('data-state')).toBeNull()
    grip(root, second).focus()
    key(grip(root, second), ' ')
    await settle(1)
    expect(grip(root, second).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('Board pointer path', () => {
  const press = (target: EventTarget, type: string, x: number): void =>
    void target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1, pointerType: 'touch', button: 0, clientX: x, clientY: 0 }))

  test('a drag by the grip takes over the lift a tap on a grip began', async () => {
    const { root } = await mountBoard()
    const [first, second] = cardsIn(root, 'backlog') as [string, string]
    // A tap is a click: it lifts by keyboard and leaves focus on the grip.
    grip(root, first).click()
    await settle(1)
    expect(grip(root, first).getAttribute('aria-pressed')).toBe('true')
    for (const id of [first, second]) {
      press(grip(root, id), 'pointerdown', 0)
      press(window, 'pointermove', 10)
      await settle(1)
      expect(document.querySelector('.ui-board__ghost')).not.toBeNull()
      expect(grip(root, id).getAttribute('aria-pressed')).toBe('true')
      press(window, 'pointercancel', 10)
      await settle(1)
      expect(root.querySelector('.ui-board')?.getAttribute('data-state')).toBeNull()
    }
  })
})

describe('Board menu path', () => {
  test('Move to <column> keeps focus on the moved card', async () => {
    const { root } = await mountBoard()
    const id = cardsIn(root, 'backlog')[0]!
    const item = [...root.querySelectorAll(`[data-board-card="${id}"] [role="menu"] button`)].find((button) => button.textContent?.includes('Review')) as HTMLElement
    item.click()
    await settle()
    expect(cardsIn(root, 'review')).toContain(id)
    expect(document.activeElement).toBe(grip(root, id))
  })

  test('after the move settled, a push of another change never takes focus back', async () => {
    const { root, engine } = await mountBoard()
    const [id, other] = cardsIn(root, 'backlog') as [string, string]
    const item = [...root.querySelectorAll(`[data-board-card="${id}"] [role="menu"] button`)].find((button) => button.textContent?.includes('Review')) as HTMLElement
    item.click()
    await settle()
    expect(document.activeElement).toBe(grip(root, id))
    // A click on blank page: focus goes to the body. Then another user renames a card, twice.
    grip(root, id).blur()
    for (const title of ['Renamed', 'Renamed again']) {
      engine.store.update('tasks', other, { title })
      await settle()
      expect(document.activeElement).toBe(document.body)
    }
  })
})

describe('Board live state', () => {
  test('a new filter reloads the cards without a remount', async () => {
    const { root, engine } = await mountBoard()
    const target = engine.store.tables.tasks.find((task) => task.status === 'done')!
    filter.value = { where: { field: 'id', op: 'eq', value: target.id } } as TasksFilter
    await settle()
    expect([...root.querySelectorAll('[data-board-card]')].map((card) => (card as HTMLElement).dataset['boardCard'])).toEqual([target.id])
  })

  test('no card of the old identity stays on screen after an account switch', async () => {
    const mounted = await mountBoard()
    expect(mounted.root.querySelectorAll('[data-board-card]').length).toBeGreaterThan(0)
    // Logout ends the old pair, the login installs the new one; before its first answer the
    // board must show nothing of the old identity.
    mounted.pair.value.end()
    mounted.pair.value = mounted.pairFor('test:bob')
    await nextTick()
    expect(mounted.root.querySelectorAll('[data-board-card]').length).toBe(0)
  })

  test('an ended connection keeps no card on screen, before any new pair', async () => {
    const mounted = await mountBoard()
    expect(mounted.root.querySelectorAll('[data-board-card]').length).toBeGreaterThan(0)
    mounted.pair.value.end()
    await settle()
    expect(mounted.root.querySelectorAll('[data-board-card]').length).toBe(0)
  })

  test('no announcement naming a card of the old identity stays after an account switch', async () => {
    const mounted = await mountBoard()
    const id = cardsIn(mounted.root, 'backlog')[0]!
    grip(mounted.root, id).focus()
    key(grip(mounted.root, id), ' ')
    await settle(1)
    expect(live_(mounted.root)).not.toBe('')
    mounted.pair.value.end()
    mounted.pair.value = mounted.pairFor('test:bob')
    await settle()
    expect(live_(mounted.root)).toBe('')
    expect(mounted.root.querySelector('.ui-board')?.getAttribute('data-state')).toBeNull()
  })

  test('a move in flight at an account switch announces and emits nothing of the old identity', async () => {
    const mounted = await mountBoard()
    const id = cardsIn(mounted.root, 'backlog')[0]!
    grip(mounted.root, id).focus()
    key(grip(mounted.root, id), ' ')
    await settle(1)
    key(grip(mounted.root, id), 'ArrowRight')
    await nextTick()
    key(grip(mounted.root, id), ' ')
    // The call is sent, not answered: the end rejects it.
    mounted.pair.value.end()
    mounted.pair.value = mounted.pairFor('test:bob')
    await settle()
    expect(live_(mounted.root)).toBe('')
    expect(events).toEqual([])
  })
})
