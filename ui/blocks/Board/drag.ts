// Pointer dragging for Board, mouse, pen and touch alike: a press on a card (touch: on its grip
// only, so the board still scrolls) lifts it after 4 px of travel; the ghost follows the pointer,
// the column and index under it become the target, release drops, Escape cancels.
import { getCurrentScope, onScopeDispose, shallowRef } from 'vue'
import { indexAt, type Spot } from './board'

export interface Ghost {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface DragOptions {
  /** Lifts the card; false refuses (another move is under way). */
  lift: (id: string) => boolean
  over: (spot: Spot) => void
  drop: () => void
  cancel: () => void
  /** The horizontal scroller, scrolled while the pointer is near its edges. */
  scroller: () => HTMLElement | null
}

const threshold = 4
const ignored = 'a, button, input, textarea, select, label, summary, [contenteditable], [role="menu"]'

export function useBoardDrag(options: DragOptions) {
  const ghost = shallowRef<Ghost | null>(null)
  let press: { id: string; pointerId: number; x: number; y: number; rect: DOMRect } | null = null
  let dragging = false

  function onPointerdown(event: PointerEvent, id: string): void {
    if (press !== null || event.button !== 0 || !event.isPrimary) return
    const target = event.target as Element
    const onGrip = target.closest('[data-board-grip]') !== null
    if (event.pointerType === 'touch' && !onGrip) return
    if (!onGrip && target.closest(ignored) !== null) return
    press = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, rect: (event.currentTarget as HTMLElement).getBoundingClientRect() }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
  }

  function onMove(event: PointerEvent): void {
    if (press === null || event.pointerId !== press.pointerId) return
    if (!dragging) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < threshold) return
      if (!options.lift(press.id)) return end()
      dragging = true
    }
    event.preventDefault()
    const { rect } = press
    ghost.value = { id: press.id, x: event.clientX - (press.x - rect.left), y: event.clientY - (press.y - rect.top), width: rect.width, height: rect.height }
    scrollNear(event.clientX)
    const spot = spotAt(event.clientX, event.clientY)
    if (spot !== undefined) options.over(spot)
  }

  function onUp(event: PointerEvent): void {
    if (press === null || event.pointerId !== press.pointerId) return
    if (dragging) {
      // The release ends a drag, not a click on the card under it.
      const swallow = (click: Event) => click.stopPropagation()
      window.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => window.removeEventListener('click', swallow, true), 0)
      options.drop()
    }
    end()
  }

  function onCancel(): void {
    if (dragging) options.cancel()
    end()
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !dragging) return
    event.preventDefault()
    event.stopPropagation()
    onCancel()
  }

  function end(): void {
    press = null
    dragging = false
    ghost.value = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('keydown', onKey, true)
  }

  /** The column under the pointer and the index among its cards (the hidden origin does not count). */
  function spotAt(x: number, y: number): Spot | undefined {
    const column = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-board-column]')
    const key = column?.dataset['boardColumn']
    if (column == null || key === undefined) return undefined
    const middles = [...column.querySelectorAll<HTMLElement>('[data-board-card]:not([data-origin])')].map((card) => {
      const box = card.getBoundingClientRect()
      return box.top + box.height / 2
    })
    return { column: key, index: indexAt(middles, y) }
  }

  // shortcut: scrolls only while the pointer moves; add a frame loop if holding still at the edge must scroll on.
  function scrollNear(x: number): void {
    const scroller = options.scroller()
    if (scroller === null) return
    const box = scroller.getBoundingClientRect()
    const edge = box.width / 10
    if (x < box.left + edge) scroller.scrollLeft -= edge / 4
    else if (x > box.right - edge) scroller.scrollLeft += edge / 4
  }

  if (getCurrentScope()) onScopeDispose(end)
  return { ghost, onPointerdown }
}
