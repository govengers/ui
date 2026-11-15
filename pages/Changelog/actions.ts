// The changelog page reads only: no actions for the agent (D24, D48). The empty list keeps the
// recipe's shape, so app-map.ts imports it like every other page.
import type { AgentAction } from '../../ui/agent/types'

export const actions: AgentAction[] = []
