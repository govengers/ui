import { describe, expect, test } from 'bun:test'
import { mutation } from '@/api/runtime'
import { runTransition, standings, type TransitionFlow, type WorkflowTransition } from './workflow'

const states = ['draft', 'open', 'paid', 'shipped', 'cancelled'].map((key) => ({ key, label: key }))
const call = mutation<{ id: string }, { status: string }, unknown>({ name: 'updateOrder', method: 'PATCH', path: '/orders/{id}', pathParameters: ['id'], body: true, content: true })
const pay: WorkflowTransition = { to: 'paid', label: 'Mark as paid', call }
const cancel: WorkflowTransition = { to: 'cancelled', label: 'Cancel', call, danger: true, confirm: 'Cancel the order?' }
const fresh = (): TransitionFlow => ({ asking: undefined, saving: undefined, error: undefined })

describe('standings', () => {
  test('without history: before current is done', () => {
    expect(standings(states, 'paid')).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming'])
    expect(standings(states, 'unknown')).toEqual(['upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'])
  })

  test('with history: done is what the record passed, so a side exit skips the rest', () => {
    const history = [{ state: 'draft', at: '' }, { state: 'open', at: '' }, { state: 'cancelled', at: '' }]
    expect(standings(states, 'cancelled', history)).toEqual(['done', 'done', 'upcoming', 'upcoming', 'current'])
  })
})

describe('runTransition', () => {
  test('without confirm it calls at once', async () => {
    const flow = fresh()
    const calls: string[] = []
    expect(await runTransition(flow, pay, false, async (transition) => calls.push(transition.to))).toBe(true)
    expect(calls).toEqual(['paid'])
    expect(flow).toEqual(fresh())
  })

  test('with confirm it asks first, then calls and closes on success', async () => {
    const flow = fresh()
    const calls: string[] = []
    const run = async (transition: WorkflowTransition) => calls.push(transition.to)
    expect(await runTransition(flow, cancel, false, run)).toBe(false)
    expect(flow.asking).toBe(cancel)
    expect(calls).toEqual([])
    expect(await runTransition(flow, cancel, true, run)).toBe(true)
    expect(calls).toEqual(['cancelled'])
    expect(flow.asking).toBeUndefined()
  })

  test('a failed call keeps the dialog open with the message', async () => {
    const flow = fresh()
    flow.asking = cancel
    expect(await runTransition(flow, cancel, true, async () => { throw new Error('The order was paid meanwhile') })).toBe(false)
    expect(flow).toEqual({ asking: cancel, saving: undefined, error: 'The order was paid meanwhile' })
  })

  test('nothing runs while a call is saving', async () => {
    const flow = fresh()
    flow.saving = 'paid'
    let called = false
    expect(await runTransition(flow, pay, false, async () => { called = true })).toBe(false)
    expect(called).toBe(false)
  })
})
