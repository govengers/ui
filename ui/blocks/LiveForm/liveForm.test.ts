// useLiveForm under the real runtime against the fake engine (latency 0): the socket records
// every frame the runtime sends, and may drop one to lose a call's answer or change it on the way.

import { describe, expect, jest, test } from 'bun:test'
import { effectScope } from 'vue'
import { NetworkError, createLivePair, type RequestFrame } from '@/api/runtime'
import { calls, live, type Customer, type UpdateCustomer } from '@/fake/api'
import { createFakeEngine } from '@/fake/engine'
import { useLiveForm } from './liveForm'

/** One task: settle runs one task after the leave (after the click that ends a press). */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

async function eventually(what: string, condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 2000
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting until ${what}`)
    await new Promise((resolve) => setTimeout(resolve, 2))
  }
}

/** A loaded form over the first customer; `drop` keeps a frame from reaching the engine, and may change it. */
async function setup(drop: (frame: RequestFrame) => boolean = () => false) {
  const engine = createFakeEngine({ latency: 0 })
  const sent: RequestFrame[] = []
  class Recording extends engine.WebSocket {
    override send(data: string): void {
      const frame = JSON.parse(data) as RequestFrame
      sent.push(frame)
      if (!drop(frame)) super.send(JSON.stringify(frame))
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

  test('settle keeps a refused field error while it holds the refused value, clears it on another', async () => {
    const { form, stop } = await setup()
    form.fields.name = ''
    form.fields.email = 'not an address'
    expect(await form.save()).toBe(false)
    expect(Object.keys(form.errors).sort()).toEqual(['email', 'name'])
    form.settle('name')
    await tick()
    expect(Object.keys(form.errors).sort()).toEqual(['email', 'name'])
    form.fields.name = 'Ada'
    form.settle('name')
    await tick()
    expect(Object.keys(form.errors)).toEqual(['email'])
    form.settle('country')
    await tick()
    expect(Object.keys(form.errors)).toEqual(['email'])
    stop()
  })

  // settle waits while a pointer is down (D96). A press whose release never comes must not hold the
  // error: the pointer's cancel, a context menu (it takes the release) and the window's blur end it.
  for (const [ending, end] of [
    ['pointercancel', () => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7 }))],
    ['contextmenu', () => window.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }))],
    ['the window\'s blur', () => window.dispatchEvent(new FocusEvent('blur'))],
  ] as const) {
    test(`a press held when the field is left settles it once ${ending} ends the press`, async () => {
      const { form, stop } = await setup()
      form.fields.name = ''
      expect(await form.save()).toBe(false)
      form.fields.name = 'Ada'
      window.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7 }))
      form.settle('name')
      await tick()
      expect(Object.keys(form.errors)).toEqual(['name'])
      end()
      await tick()
      expect(form.errors).toEqual({})
      // The press is over for good: the next leave settles at once.
      form.fields.name = ''
      expect(await form.save()).toBe(false)
      form.fields.name = 'Bea'
      form.settle('name')
      await tick()
      expect(form.errors).toEqual({})
      stop()
    })
  }

  test('an element\'s blur is not the window\'s: the press still holds settle', async () => {
    const { form, stop } = await setup()
    form.fields.name = ''
    expect(await form.save()).toBe(false)
    form.fields.name = 'Ada'
    const field = document.createElement('input')
    document.body.append(field)
    field.focus()
    window.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7 }))
    field.blur()
    form.settle('name')
    await tick()
    expect(Object.keys(form.errors)).toEqual(['name'])
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7 }))
    await tick()
    expect(form.errors).toEqual({})
    stop()
  })

  test('every window listener the form adds is removed with it', async () => {
    const add = jest.spyOn(window, 'addEventListener')
    const remove = jest.spyOn(window, 'removeEventListener')
    try {
      const { stop } = await setup()
      const added = add.mock.calls.map(([type, listener, options]) => [type, listener, options])
      expect(added.map(([type]) => type).sort()).toEqual(['blur', 'contextmenu', 'pointercancel', 'pointerdown', 'pointerup'])
      stop()
      expect(remove.mock.calls.map(([type, listener, options]) => [type, listener, options])).toEqual(expect.arrayContaining(added))
    } finally {
      add.mockRestore()
      remove.mockRestore()
    }
  })

  test('an edit made while a save ran clears that refusal on settle', async () => {
    const { form, stop } = await setup()
    form.fields.name = ''
    const saved = form.save()
    form.fields.name = 'typed while saving'
    expect(await saved).toBe(false)
    expect(form.errors).toEqual({ name: 'must not be empty' })
    form.settle('name')
    await tick()
    expect(form.errors).toEqual({})
    stop()
  })

  test('a refused field the save did not send keeps its error until its value changes', async () => {
    const { form, stop } = await setup((frame) => {
      if (frame.op === 'call') frame.body = { ...(frame.body as object), email: 'not an address' }
      return false
    })
    form.fields.name = 'Ada'
    expect(await form.save()).toBe(false)
    expect(form.errors).toEqual({ email: 'must be an email address' })
    form.settle('email')
    await tick()
    expect(Object.keys(form.errors)).toEqual(['email'])
    form.fields.email = 'ada@example.com'
    form.settle('email')
    await tick()
    expect(form.errors).toEqual({})
    stop()
  })

  test('a push that changes an untouched refused field clears its error', async () => {
    const { engine, form, id, stop } = await setup((frame) => {
      if (frame.op === 'call') frame.body = { ...(frame.body as object), email: 'not an address' }
      return false
    })
    form.fields.name = 'Ada'
    expect(await form.save()).toBe(false)
    expect(Object.keys(form.errors)).toEqual(['email'])
    engine.store.update('customers', id, { email: 'pushed@example.com' })
    await eventually('the push refilled the email', () => form.fields.email === 'pushed@example.com')
    await tick()
    expect(form.errors).toEqual({})
    expect(form.fields.name).toBe('Ada')
    stop()
  })

  test('a push during the save leaves no error on the untouched field it changed', async () => {
    let push = (): void => undefined
    const { engine, form, id, stop } = await setup((frame) => {
      if (frame.op !== 'call') return false
      frame.body = { ...(frame.body as object), email: 'not an address' }
      push()
      return false
    })
    push = () => engine.store.update('customers', id, { email: 'pushed@example.com' })
    form.fields.name = 'Ada'
    expect(await form.save()).toBe(false)
    expect(form.fields.email).toBe('pushed@example.com')
    expect(form.errors).toEqual({})
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
