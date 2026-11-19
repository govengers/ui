// Tooltip timing and the one-at-a-time rule (D90): module state, shared by every Tooltip.

/** Milliseconds a hovering mouse or pen waits before the tooltip shows. */
export const tooltipDelay = 500
/** Milliseconds a tooltip survives after the pointer left, so the pointer can cross the gap to the panel. */
export const tooltipGrace = 100

let hideShown: (() => void) | undefined

/** Only one tooltip is shown at a time: the one that shows hides the one before. */
export function claim(hide: () => void): void {
  if (hideShown !== hide) hideShown?.()
  hideShown = hide
}

export function release(hide: () => void): void {
  if (hideShown === hide) hideShown = undefined
}

/**
 * Focus that arrives in an open modal dialog from outside it, or from nowhere, is the dialog
 * moving focus while it opens: everything outside it is inert, so the user cannot have come from
 * there. Its first control shows no tooltip then, and one Escape closes the dialog.
 */
export function modalOpening(element: Element, from: Node | null): boolean {
  const dialog = element.closest('dialog')
  try {
    return !!dialog?.matches(':modal') && !dialog.contains(from)
  } catch {
    return false
  }
}

/** True where the browser does not know `:focus-visible`, so keyboard users are never left out. */
export function focusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}
