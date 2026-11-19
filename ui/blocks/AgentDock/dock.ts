// The dock's logic without Vue: the thread order, when the agent is "thinking" or answering, when
// the log follows the stream, and the stops of a guide plan with the page each one lives on.
import type { DrivePlan, DriveStep } from '../../agent/types'

export type AgentMode = 'chat' | 'guide' | 'drive'

/** The fields the dock reads from a conversation row (D26); a generated Message type has them. */
export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  createdAt: string
  /** True while the agent still writes this message (its text grows with each push). */
  streaming?: boolean | undefined
}

/** The thread oldest first, whatever order the read answers in. */
export function thread<Message extends ChatMessage>(messages: readonly Message[]): Message[] {
  return [...messages].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
}

/** The agent owes an answer while the newest message is the user's. */
export function thinking(messages: readonly ChatMessage[]): boolean {
  return messages.at(-1)?.role === 'user'
}

/** The agent is answering: it owes one (thinking) or its newest message still streams. */
export function answering(messages: readonly ChatMessage[]): boolean {
  return thinking(messages) || messages.at(-1)?.streaming === true
}

/** The reader is at the bottom of the log: at most `slack` (about one line) above it, so new text may follow. */
export function nearBottom(scrollTop: number, scrollHeight: number, clientHeight: number, slack: number): boolean {
  return scrollHeight - clientHeight - scrollTop <= slack
}

/**
 * The log still follows after a scroll from `previousTop`: on the way down within `line` (about one
 * line of text) of the bottom; on the way up never, so any scroll up, even 1 px, escapes at once.
 * A log whose box changed size is kept at its bottom by follow.ts's ResizeObserver, not here.
 */
export function following(previousTop: number, scrollTop: number, scrollHeight: number, clientHeight: number, line: number): boolean {
  return scrollTop >= previousTop && nearBottom(scrollTop, scrollHeight, clientHeight, line)
}

/** Milliseconds after Stop turned back into Send in which a click on that button sends nothing: the
 * second click of a double click on Stop, or a press meant for Stop as the answer ends by itself. */
export const switchGuard = 500

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
