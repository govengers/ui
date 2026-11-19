// place: puts an anchored panel next to its anchor (D51). Popover and Tooltip share it, so a
// placement fix lands once. Inline style straight on the element: placing every frame must not
// re-render the component.

export interface PlaceOptions {
  /** auto: below if it fits, above if only that fits, else the roomier side. `end`: beside the anchor, Tooltip only. */
  placement: 'auto' | 'bottom' | 'top' | 'end'
  /** Which edge of the panel lines up with the anchor (above and below). */
  align: 'start' | 'end'
  /** The panel is at least as wide as the anchor. */
  matchWidth: boolean
  /** Px between anchor and panel, and between panel and the viewport's edge. */
  gap: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

/** A `display: contents` element (the root of Popover or Tooltip) has no box: take the first element inside it that has one. */
export function boxed(element: Element): Element {
  while (element.firstElementChild && getComputedStyle(element).display === 'contents') element = element.firstElementChild
  return element
}

export function place(anchor: Element, panel: HTMLElement, options: PlaceOptions): void {
  const { placement, align, matchWidth, gap } = options
  const target = boxed(anchor)
  const box = target.getBoundingClientRect()
  if (matchWidth) panel.style.minWidth = `${box.width}px`
  const size = panel.getBoundingClientRect()
  const { clientWidth: width, clientHeight: height } = document.documentElement
  if (placement === 'end') {
    // At the inline end of the anchor, centred on it. Where only the inline start has room it goes
    // there, so it never covers its own anchor; where neither has, the viewport's edge holds it.
    const rtl = getComputedStyle(target).direction === 'rtl'
    const right = box.right + gap
    const left = box.left - gap - size.width
    const fits = (x: number) => x >= gap && x + size.width <= width - gap
    const end = rtl ? left : right
    const start = rtl ? right : left
    const flip = !fits(end) && fits(start)
    panel.dataset.placement = flip ? 'start' : 'end'
    panel.style.top = `${clamp(box.top + (box.height - size.height) / 2, gap, height - size.height - gap)}px`
    panel.style.left = `${clamp(flip ? start : end, gap, width - size.width - gap)}px`
    return
  }
  const roomBelow = height - box.bottom - 2 * gap
  const roomAbove = box.top - 2 * gap
  // auto: below if it fits, above if only that fits, else the roomier side with a scrolling panel.
  const below = placement === 'bottom'
    || (placement === 'auto' && (size.height <= roomBelow || roomBelow >= roomAbove))
  const room = below ? roomBelow : roomAbove
  const left = align === 'end' ? box.right - size.width : box.left
  panel.dataset.placement = below ? 'bottom' : 'top'
  panel.style.maxHeight = `${room}px`
  panel.style.top = `${below ? box.bottom + gap : box.top - gap - Math.min(size.height, room)}px`
  panel.style.left = `${clamp(left, gap, width - size.width - gap)}px`
}
