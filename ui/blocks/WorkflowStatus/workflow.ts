// WorkflowStatus's logic (D33): where each state of the lifecycle stands, and the
// confirm-then-call flow of a transition.
import type { MutationTarget } from '@/api/runtime'

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export interface WorkflowState {
  key: string
  label: string
  /** The Badge tone of the state while it is current; accent by default. */
  tone?: Tone | undefined
}

export interface WorkflowTransition {
  /** The state the transition moves to. */
  to: string
  label: string
  /** Any parameters and body: each transition is typed by its own descriptor. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call: MutationTarget<any, any, unknown>
  params?: object | undefined
  body?: unknown
  danger?: boolean | undefined
  /** Asks first: the dialog's sentence. */
  confirm?: string | undefined
}

export interface WorkflowEntry {
  state: string
  /** ISO time the state was entered. */
  at: string
  by?: string | undefined
}

export type Standing = 'done' | 'current' | 'upcoming'

/**
 * Where each state stands. With a history, a state is done when the record passed it, so a side
 * exit (cancelled after open) leaves the states after open upcoming; without one, every state
 * before the current one is done.
 */
export function standings(states: readonly WorkflowState[], current: string, history?: readonly WorkflowEntry[]): Standing[] {
  const at = states.findIndex((state) => state.key === current)
  const passed = history === undefined ? undefined : new Set(history.map((entry) => entry.state))
  return states.map((state, index) => {
    if (index === at) return 'current'
    if (passed !== undefined) return passed.has(state.key) ? 'done' : 'upcoming'
    return index < at ? 'done' : 'upcoming'
  })
}

export interface TransitionFlow {
  /** The transition whose confirm dialog is open. */
  asking: WorkflowTransition | undefined
  /** The state a running call moves to. */
  saving: string | undefined
  error: string | undefined
}

/**
 * A click on a transition, or the confirm of its dialog (`confirmed`). A transition with a
 * confirm sentence asks first; its call then runs with the dialog open, so the error shows there
 * and the dialog closes only on success. Resolves true when the call succeeded.
 */
export async function runTransition(
  flow: TransitionFlow,
  transition: WorkflowTransition,
  confirmed: boolean,
  call: (transition: WorkflowTransition) => Promise<unknown>,
): Promise<boolean> {
  if (flow.saving !== undefined) return false
  flow.error = undefined
  if (transition.confirm !== undefined && !confirmed) {
    flow.asking = transition
    return false
  }
  flow.saving = transition.to
  try {
    await call(transition)
    flow.asking = undefined
    return true
  } catch (failure) {
    flow.error = failure instanceof Error ? failure.message : String(failure)
    return false
  } finally {
    flow.saving = undefined
  }
}
