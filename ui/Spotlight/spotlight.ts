// Where the Spotlight's bubble goes: below the target if it fits, else above, else the roomier
// side; its left edge on the target's (like Menu) and kept inside the viewport. Viewport
// coordinates in px.

export interface Box { top: number; left: number; width: number; height: number }
export interface Size { width: number; height: number }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)))

/** The bubble's top-left beside `target`; with no target, centred in the viewport. */
export function placeBubble(target: Box | null, bubble: Size, viewport: Size, gap = 12): { top: number; left: number } {
  if (target === null) return { top: (viewport.height - bubble.height) / 2, left: (viewport.width - bubble.width) / 2 }
  const bottom = target.top + target.height
  const roomBelow = viewport.height - bottom - gap
  const roomAbove = target.top - gap
  const below = bubble.height + gap <= roomBelow || roomBelow >= roomAbove
  const top = below ? bottom + gap : target.top - gap - bubble.height
  return {
    top: clamp(top, gap, viewport.height - bubble.height - gap),
    left: clamp(target.left, gap, viewport.width - bubble.width - gap),
  }
}
