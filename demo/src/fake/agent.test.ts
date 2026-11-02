import { describe, expect, test } from 'bun:test'
import { planOf, replyTo, seedExchange, startFakeAgent } from './agent'
import { createFakeEngine } from './engine'

describe('fake agent', () => {
  test('create a customer: fill the search with the name, pause on the filter', () => {
    const reply = replyTo('Create a customer called "Globex".')
    expect(reply.plan?.steps.map(step => step.kind)).toEqual(['navigate', 'fill', 'pause'])
    expect(reply.plan?.steps[1]).toMatchObject({ target: { field: 'search' }, value: 'Globex' })
    expect(replyTo('new customer').plan?.goal).toBe('Create the customer Globex')
  })

  test('filter and theme questions get guide plans, anything else the three skills', () => {
    expect(replyTo('Where is the filter?').plan?.steps.filter(step => step.kind === 'spotlight')).toHaveLength(2)
    expect(replyTo('how do I filter').plan).toBeDefined()
    expect(replyTo('dark mode please').plan?.steps[0]).toMatchObject({ kind: 'fill', value: 'dark' })
    expect(replyTo('change the theme').plan).toBeDefined()
    expect(replyTo('hello').plan).toBeUndefined()
  })

  test('answers new user messages only, with the plan by message id', async () => {
    const { store } = createFakeEngine({ latency: 0 })
    seedExchange(store)
    seedExchange(store)
    const before = store.tables.conversation.length
    const stop = startFakeAgent(store, { delay: 1, interval: 1 })
    store.insert('conversation', { id: 'u1', role: 'user', text: 'new customer Initech', createdAt: new Date().toISOString() })
    await new Promise(resolve => setTimeout(resolve, 30))
    stop()
    const added = store.tables.conversation.slice(before)
    expect(added.map(message => message.role)).toEqual(['user', 'agent'])
    expect(planOf(added[1]!)?.goal).toBe('Create the customer Initech')
    expect(planOf(store.tables.conversation.find(message => message.id === 'demo-agent-1')!)?.goal).toBe('Create the customer Globex')
  })
})
