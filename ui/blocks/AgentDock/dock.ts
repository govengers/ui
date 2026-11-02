// The dock's logic without Vue: the thread order, when the agent is "thinking", and the stops of
// a guide plan with the page each one lives on.
import type { DrivePlan, DriveStep } from '../../agent/types'

export type AgentMode = 'chat' | 'guide' | 'drive'

/** The fields the dock reads from a conversation row (D26); a generated Message type has them. */
export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  createdAt: string
}

/** The thread oldest first, whatever order the read answers in. */
export function thread<Message extends ChatMessage>(messages: readonly Message[]): Message[] {
  return [...messages].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
}

/** The agent owes an answer while the newest message is the user's. */
export function thinking(messages: readonly ChatMessage[]): boolean {
  return messages.at(-1)?.role === 'user'
}

export interface GuideStop {
  step: Exclude<DriveStep, { kind: 'navigate' }>
  /** The route the step lives on: the last navigate before it. */
  path: string | undefined
}

/** A guide plan as the user walks it: navigate steps are not stops, they move with Next and Back. */
export function guideStops(plan: DrivePlan): GuideStop[] {
  let path: string | undefined
  const stops: GuideStop[] = []
  for (const step of plan.steps) {
    if (step.kind === 'navigate') path = step.path
    else stops.push({ step, path })
  }
  return stops
}
