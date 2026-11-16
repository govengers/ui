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
const placements: Placement[] = []
let board: Mounted | undefined
afterEach(() => {
  board?.unmount()
  board = undefined
  filter.value = undefined
  events.length = 0
  placements.length = 0
})

async function mountBoard(): Promise<Mounted> {
  board = mount(Board, () => ({
    target: live.tasks, sort: ['position'], filter: filter.value, columns, columnField: 'status', rankField: 'position',
    itemLabel: (task: Task) => task.title, move: calls.moveTask,
    moveArgs: (task: Task, placement: Placement) => ({ parameters: { id: task.id }, body: { status: placement.column, position: placement.rank } }),
    label: 'Board',
    onMoved: (task: Task, placement: Placement) => {
      events.push(`moved ${task.title}`)
      placements.push(placement)
    },
    'onMove-error': (_: unknown, task: Task) => events.push(`move-error ${task.title}`),
  }))
  await settle()
  return board
}

const cardsIn = (root: HTMLElement, column: string): string[] =>
  [...root.querySelectorAll(`[data-board-column="${column}"] [data-board-card]`)].map((card) => (card as HTMLElement).dataset['boardCard'] ?? '')
const grip = (root: HTMLElement, id: string): HTMLElement => root.querySelector(`[data-board-card="${id}"] [data-board-grip]`) as HTMLElement
const live_ = (root: HTMLElement): string => root.querySelector('[aria-live]')?.textContent ?? ''

/** Runs a push and counts the moves of a node holding focus, blurring it first as Chrome does (jsdom keeps the focus). */
async function blurringMoves(push: () => unknown): Promise<number> {
  const insertBefore = Node.prototype.insertBefore
  let blurred = 0
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null): T {
    const focused = document.activeElement as HTMLElement | null
    if (node.isConnected && focused !== null && focused !== document.body && node.contains(focused)) {
      blurred++
      focused.blur()
    }
    return insertBefore.call(this, node, child) as T
  }
  try {
    await push()
    await settle()
  } finally {
    Node.prototype.insertBefore = insertBefore
  }
  return blurred
}

/** Another user moves card `id` to the top of To do. */
function pushToTop(engine: Mounted['engine'], id: string): void {
  const top = Math.min(...engine.store.tables.tasks.filter((task) => task.status === 'todo').map((task) => task.position))
  engine.store.update('tasks', id, { status: 'todo', position: top - 1024 })
}

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

  test('a card pushed above a keyboard lift keeps the spot the user picked and the lifted element in place', async () => {
    const { root, engine } = await mountBoard()
    const [, id, below] = cardsIn(root, 'todo') as [string, string, string]
    grip(root, id).focus()
    key(grip(root, id), ' ')
    await settle(1)
    // Aim at the end of the column: under its last card.
    key(grip(root, id), 'End')
    await settle()
    const blurred = await blurringMoves(() => pushToTop(engine, cardsIn(root, 'backlog')[0]!))
    expect(blurred).toBe(0)
    expect(grip(root, id).getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(grip(root, id))
    expect(cardsIn(root, 'todo').at(-1)).toBe(id)
    key(grip(root, id), ' ')
    await settle()
    expect(cardsIn(root, 'todo').at(-1)).toBe(id)
    expect(placements.at(-1)).toMatchObject({ column: 'todo', before: below, after: undefined })
    expect(live_(root)).not.toContain('cancelled')
  })

  test('a push that moves the lifted card in the DOM keeps the lift and its focus (Chrome blurs moved nodes)', async () => {
    const { root, engine } = await mountBoard()
    const todo = (): number[] => engine.store.tables.tasks.filter((task) => task.status === 'todo').map((task) => task.position)
    // Five cards, so the three below outnumber the two the push moves and Vue moves those two.
    for (const other of cardsIn(root, 'backlog').slice(0, 2)) engine.store.update('tasks', other, { status: 'todo', position: Math.max(...todo()) + 1024 })
    await settle()
    const [id, above] = cardsIn(root, 'todo') as [string, string]
    grip(root, id).focus()
    key(grip(root, id), ' ')
    await settle(1)
    key(grip(root, id), 'ArrowDown')
    await settle()
    // Another user moves the card the lift is aimed under to the bottom: the lifted card follows it.
    const blurred = await blurringMoves(() => engine.store.update('tasks', above, { position: Math.max(...todo()) + 1024 }))
    expect(blurred).toBeGreaterThan(0)
    expect(grip(root, id).getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(grip(root, id))
    expect(cardsIn(root, 'todo').slice(-2)).toEqual([above, id])
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

  test('the answer of a move never pulls focus out of the card menu the user reopened meanwhile', async () => {
    const { root } = await mountBoard()
    const id = cardsIn(root, 'backlog')[0]!
    const moveTo = (column: string): HTMLElement => [...root.querySelectorAll(`[data-board-card="${id}"] [role="menu"] button`)].find((button) => button.textContent?.includes(column)) as HTMLElement
    moveTo('Review').click()
    await nextTick()
    expect(cardsIn(root, 'review')).toContain(id)
    // Before the call answered: the user opens the same card's menu again and walks to an item.
    // jsdom hides a closed popover (display none, not focusable) and has no :popover-open: show it inline.
    const item = moveTo('To do')
    item.closest<HTMLElement>('[popover]')!.style.display = 'block'
    item.focus()
    expect(document.activeElement).toBe(item)
    await settle()
    expect(document.activeElement).toBe(item)
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
