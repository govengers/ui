// Runtime binding of declared actions (D24): a block or page binds a handler to an action for
// as long as it is mounted; the dock and the fake agent look actions up by name.
import { getCurrentScope, onScopeDispose, reactive } from 'vue'
import type { AgentAction } from './types'

export interface BoundAction extends AgentAction {
  run: (params: Record<string, unknown>) => Promise<unknown> | unknown
}

const bound = reactive(new Map<string, BoundAction>())

/** Binds `run` to a declared action while the calling scope lives. */
export function useAgentAction(action: AgentAction, run: BoundAction['run']): void {
  bound.set(action.name, { ...action, run })
  if (getCurrentScope()) onScopeDispose(() => { if (bound.get(action.name)?.run === run) bound.delete(action.name) })
}

export function boundActions(): BoundAction[] {
  return [...bound.values()]
}

export function findAction(name: string): BoundAction | undefined {
  return bound.get(name)
}

/** For tests and the fake agent. */
export function resetActions(): void {
  bound.clear()
}
