// StatusTile's delta rule: which way the number moved and whether that is good.

export type DeltaTone = 'success' | 'danger' | 'neutral'

/** A rise is good (success) unless `invert` says a rise is bad (errors, churn); no change is neutral. */
export function deltaTone(delta: number, invert = false): DeltaTone {
  if (delta === 0 || Number.isNaN(delta)) return 'neutral'
  return (delta > 0) !== invert ? 'success' : 'danger'
}
