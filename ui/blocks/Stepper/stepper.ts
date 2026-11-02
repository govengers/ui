// The Stepper's navigation rules: where each step stands and which step a click may move to.

export interface StepItem {
  key: string
  title: string
  description?: string | undefined
  /** Marks the step "(optional)" in the list; the page still decides canContinue. */
  optional?: boolean | undefined
  /** data-action of Continue while this step is current: the livewire call Continue runs ("save then watch"). */
  action?: string | undefined
}

export type StepState = 'done' | 'current' | 'upcoming'

/** A step before the furthest one reached was left with Continue, so it is done; the current one is current. */
export function stepState(index: number, current: number, furthest: number): StepState {
  if (index === current) return 'current'
  return index < furthest ? 'done' : 'upcoming'
}

/**
 * Whether a click on the step at `target` moves there. Back is always allowed. Forward only to a
 * step reached before, never in linear mode, and only while the current step may be left.
 */
export function canJump(target: number, current: number, furthest: number, linear: boolean, canContinue: boolean): boolean {
  if (target < 0 || target === current) return false
  if (target < current) return true
  return !linear && canContinue && target <= furthest
}
