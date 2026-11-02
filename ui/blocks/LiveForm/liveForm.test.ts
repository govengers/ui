// useLiveForm under the real runtime against the fake engine (latency 0): the socket records
// every frame the runtime sends, and may drop one to lose a call's answer.

import { describe, expect, test } from 'bun:test'
import { effectScope } from 'vue'
import { NetworkError, createLivePair, type RequestFrame } from '@/api/runtime'
import { calls, live, type Customer, type UpdateCustomer } from '@/fake/api'
import { createFakeEngine } from '@/fake/engine'
import { useLiveForm } from './liveForm'

async function eventually(what: string, condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 2000
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
    await new Promise((resolve) => setTimeout(resolve, 2))
  }
}

/** A loaded form over the first customer; `drop` keeps a frame from reaching the engine. */
async function setup(drop: (frame: RequestFrame) => boolean = () => false) {
  const engine = createFakeEngine({ latency: 0 })
  const sent: RequestFrame[] = []
  class Recording extends engine.WebSocket {
    override send(data: string): void {
      const frame = JSON.parse(data) as RequestFrame
      sent.push(frame)
      if (!drop(frame)) super.send(data)
    }
  }
  const pair = createLivePair({
    identity: () => 'demo:ada',
    client: { baseURL: 'http://fake/api/v1', fetch: engine.fetch },
    connection: { url: 'ws://fake/api/v1/socket', WebSocket: Recording, requestTimeout: 50 },
  })
  const id = (engine.store.tables.customers[0] as Customer).id
  const scope = effectScope()
  const form = scope.run(() => useLiveForm({
    target: live['customers.item'],
    params: { id },
    call: calls.updateCustomer,
    pick: (customer: Customer): UpdateCustomer => ({ name: customer.name, email: customer.email, country: customer.country }),
    connection: pair.connection,
  }))
  if (form === undefined) throw new Error('no form')
  await eventually('the record arrived', () => form.fields.name !== undefined)
  const calledWith = () => sent.filter((frame) => frame.op === 'call')
  const stop = () => {
    scope.stop()
    pair.end()
  }
  return { engine, form, id, calledWith, stop }
}

describe('useLiveForm', () => {
  test('save sends only the touched fields and settles them', async () => {
    const { engine, form, id, calledWith, stop } = await setup()
    form.fields.name = 'Ada Lovelace'
    expect(form.touched.value).toEqual(['name'])
    expect(form.dirty.value).toBe(true)
    expect(await form.save()).toBe(true)
    expect(calledWith().map((frame) => frame.body)).toEqual([{ name: 'Ada Lovelace' }])
    expect(engine.store.tables.customers.find((customer) => customer.id === id)?.name).toBe('Ada Lovelace')
    expect(form.touched.value).toEqual([])
    stop()
  })

  test('a push refills the untouched fields; a touched one keeps its text and shows the conflict', async () => {
    const { engine, form, id, stop } = await setup()
    form.fields.name = 'Mine'
    engine.store.update('customers', id, { name: 'Theirs', email: 'theirs@example.com' })
    await eventually('the push refilled the email', () => form.fields.email === 'theirs@example.com')
    expect(form.fields.name).toBe('Mine')
    expect(form.touched.value).toEqual(['name'])
    expect(form.conflicts.value).toEqual(['name'])

    engine.store.update('customers', id, { name: 'Mine' })
    await eventually('the server agreed with the edit', () => form.touched.value.length === 0)
    expect(form.conflicts.value).toEqual([])
    stop()
  })

  test('a validation error lands in errors by field name, not in saveError', async () => {
    const { form, stop } = await setup()
    form.fields.name = ''
    expect(await form.save()).toBe(false)
    expect(form.errors).toEqual({ name: 'must not be empty' })
    expect(form.saveError.value).toBeUndefined()
    expect(form.touched.value).toEqual(['name'])
    form.reset()
    expect(form.errors).toEqual({})
    expect(form.touched.value).toEqual([])
    stop()
  })

  test('a save after a NetworkError sends the same Idempotency-Key, the next patch a new one', async () => {
    let lost = false
    const { form, calledWith, stop } = await setup((frame) => {
      if (frame.op !== 'call' || lost) return false
      lost = true
      return true
    })
    form.fields.country = 'FR'
    expect(await form.save()).toBe(false)
    expect(form.saveError.value).toBeInstanceOf(NetworkError)
    expect(await form.save()).toBe(true)
    form.fields.country = 'AT'
    expect(await form.save()).toBe(true)
    const keys = calledWith().map((frame) => frame.idempotencyKey)
    expect(keys).toHaveLength(3)
    expect(keys[1]).toBe(keys[0])
    expect(keys[2]).not.toBe(keys[0])
    stop()
  })
})
