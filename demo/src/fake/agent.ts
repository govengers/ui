// The scripted fake agent (D30): no model, no backend. It watches the conversation table of the
// fake engine and answers every new user message after a short pause with a canned,
// keyword-matched reply; replies that can show or do something carry a DrivePlan, kept in
// `plans` by message id (a real backend puts the plan on the message). The plans target what the
// AgentDock demo page renders (search field, filter button, a facet chip) and the demo app's
// theme select, because the dock lives on that route: navigating elsewhere would unmount it.

import type { DrivePlan } from '../../../ui/agent/types'
import { uuidv7 } from '../api/runtime'
import type { Message } from './data'
import type { FakeStore } from './engine'

/** The plan of each agent message that has one, by message id. */
export const plans = new Map<string, DrivePlan>()

/** For AgentDock's `planOf`. */
export function planOf(message: { id: string }): DrivePlan | undefined {
  return plans.get(message.id)
}

/** The AgentDock demo's route: the page whose targets the plans point at. */
export const demoPath = '/ui/blocks/AgentDock'

export interface Reply {
  text: string
  plan?: DrivePlan
}

const create = /\b(?:create|add|new)\s+(?:a\s+)?(?:new\s+)?customer\b(?:\s+(?:called|named))?\s*(.*)$/i

/** The canned answer to a user message. */
export function replyTo(text: string): Reply {
  const creating = create.exec(text.trim())
  if (creating) {
    const name = (creating[1] ?? '').replace(/["'.!?]/g, '').trim() || 'Globex'
    return {
      text: `Let's create ${name}. I'll search for it first so we don't add it twice.`,
      plan: {
        goal: `Create the customer ${name}`,
        steps: [
          { kind: 'navigate', path: demoPath, say: 'Opening the customer list' },
          { kind: 'fill', target: { field: 'search' }, value: name, say: `Searching for ${name}` },
          { kind: 'pause', target: { action: 'filter' }, say: `No ${name} yet. Narrow the list with the filter if you like, then press Go.` },
        ],
      },
    }
  }
  if (/\bfilter/i.test(text)) {
    return {
      text: 'The filter sits next to the search field; every active filter shows as a chip below it.',
      plan: {
        goal: 'Show the filter',
        steps: [
          { kind: 'navigate', path: demoPath },
          { kind: 'spotlight', target: { action: 'filter' }, say: 'This opens the fields you can filter by.' },
          { kind: 'spotlight', target: { selector: '[data-facet]' }, say: 'Each active filter is a chip: click it to change or remove it.' },
        ],
      },
    }
  }
  if (/\b(dark mode|dark|theme)\b/i.test(text)) {
    return {
      text: 'The theme switch is in the top bar.',
      plan: {
        goal: 'Switch to dark mode',
        steps: [{ kind: 'fill', target: { selector: '.controls label:nth-of-type(2) select' }, value: 'dark', say: 'Pick dark here, or auto to follow your system.' }],
      },
    }
  }
  return { text: 'I can create a customer ("create a customer Globex"), show you where the filter is ("where is the filter") or switch the theme ("dark mode").' }
}

function insertReply(store: FakeStore, reply: Reply, id = uuidv7()): void {
  if (reply.plan) plans.set(id, reply.plan)
  store.insert('conversation', { id, role: 'agent', text: reply.text, createdAt: new Date().toISOString() })
}

/** One exchange with a plan, inserted once, so the dock shows a conversation on load. */
export function seedExchange(store: FakeStore): void {
  const text = 'create a customer Globex'
  if (store.tables.conversation.some(message => message.id === 'demo-user-1')) return
  store.insert('conversation', { id: 'demo-user-1', role: 'user', text, createdAt: new Date(Date.now() - 60_000).toISOString() })
  insertReply(store, replyTo(text), 'demo-agent-1')
}

/** Answers every user message that arrives after the start; returns the stop function. */
export function startFakeAgent(store: FakeStore, options: { delay?: number; interval?: number } = {}): () => void {
  const seen = new Set(store.tables.conversation.map(message => message.id))
  const timers = new Set<ReturnType<typeof setTimeout>>()
  // ponytail: polls the table; the store has no subscribe, add one if a second watcher appears.
  const poll = setInterval(() => {
    const fresh: Message[] = store.tables.conversation.filter(message => !seen.has(message.id))
    for (const message of fresh) {
      seen.add(message.id)
      if (message.role !== 'user') continue
      const timer = setTimeout(() => {
        timers.delete(timer)
        insertReply(store, replyTo(message.text))
      }, options.delay ?? 600)
      timers.add(timer)
    }
  }, options.interval ?? 300)
  return () => {
    clearInterval(poll)
    for (const timer of timers) clearTimeout(timer)
  }
}
