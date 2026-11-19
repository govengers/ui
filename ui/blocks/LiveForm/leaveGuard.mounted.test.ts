// useLeaveGuard mounted (D69, D96): a dirty form asks before another path and holds the unload
// prompt; a clean form, a query-only change, a saved form and an unmounted guard stay silent.
import { afterEach, beforeEach, expect, test } from 'bun:test'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { calls, live, type Customer, type UpdateCustomer } from '../../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import { useLeaveGuard } from './leaveGuard'
import { useLiveForm, type LiveFormState } from './liveForm'

let view: Mounted | undefined
let asked: string[] = []
let answer = false
const confirm = window.confirm
beforeEach(() => {
  asked = []
  answer = false
  window.confirm = (message?: string) => {
    asked.push(message ?? '')
    return answer
  }
})
afterEach(() => {
  view?.unmount()
  view = undefined
  window.confirm = confirm
})

/** True when a page unload would prompt now. */
function unloadAsks(): boolean {
  return !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
}

/** Mounts a component that calls `setup` while `shown`, beside the router; answers the router. */
async function host(setup: () => void, shown: Ref<boolean> = ref(true)): Promise<Router> {
  let router: Router | undefined
  const Guarded = defineComponent({ setup: () => { setup(); return () => null } })
  const Host = defineComponent({ setup: () => { router = useRouter(); return () => (shown.value ? h(Guarded) : null) } })
  view = mount(Host)
  if (router === undefined) throw new Error('no router')
  await router.isReady()
  return router
}

test('a dirty form asks before another path: no stays, yes leaves', async () => {
  const router = await host(() => useLeaveGuard(ref(true)))
  await router.push('/customers')
  expect(asked).toEqual(['You have unsaved changes. Leave this page?'])
  expect(router.currentRoute.value.path).toBe('/')
  answer = true
  await router.push('/customers')
  expect(asked).toHaveLength(2)
  expect(router.currentRoute.value.path).toBe('/customers')
})

test('a clean form and a query-only change do not ask', async () => {
  const dirty = ref(false)
  const router = await host(() => useLeaveGuard(dirty))
  await router.push('/customers')
  expect(router.currentRoute.value.path).toBe('/customers')
  dirty.value = true
  await router.push({ query: { tab: 'orders' } })
  expect(router.currentRoute.value.query).toEqual({ tab: 'orders' })
  expect(asked).toEqual([])
})

test('the unload prompt is there at once when mounted dirty and goes with the edits', async () => {
  const dirty = ref(true)
  await host(() => useLeaveGuard(dirty))
  expect(unloadAsks()).toBe(true)
  dirty.value = false
  await nextTick()
  expect(unloadAsks()).toBe(false)
  dirty.value = true
  await nextTick()
  expect(unloadAsks()).toBe(true)
})

test('after unmount neither the guard nor the unload prompt is left', async () => {
  const shown = ref(true)
  const router = await host(() => useLeaveGuard(ref(true)), shown)
  expect(unloadAsks()).toBe(true)
  shown.value = false
  await nextTick()
  expect(unloadAsks()).toBe(false)
  await router.push('/customers')
  expect(router.currentRoute.value.path).toBe('/customers')
  expect(asked).toEqual([])
})

const pick = (customer: Customer): UpdateCustomer => ({ name: customer.name, email: customer.email, country: customer.country })

async function loadedForm(leaveGuard?: boolean): Promise<{ router: Router; form: LiveFormState<Customer, UpdateCustomer> }> {
  let form: LiveFormState<Customer, UpdateCustomer> | undefined
  const router = await host(() => {
    form = useLiveForm({ target: live['customers.item'], params: { id: 'cus-001' }, call: calls.updateCustomer, pick, leaveGuard })
  })
  await settle()
  if (form?.item.value === undefined) throw new Error('the record did not arrive')
  return { router, form }
}

test('useLiveForm guards its edits and is silent once they are saved', async () => {
  const { router, form } = await loadedForm()
  form.fields.name = 'Ada Lovelace Ltd'
  await router.push('/customers')
  expect(asked).toHaveLength(1)
  expect(router.currentRoute.value.path).toBe('/')
  expect(await form.save()).toBe(true)
  await nextTick()
  expect(unloadAsks()).toBe(false)
  await router.push('/customers')
  expect(asked).toHaveLength(1)
  expect(router.currentRoute.value.path).toBe('/customers')
})

test('useLiveForm with leaveGuard false never asks', async () => {
  const { router, form } = await loadedForm(false)
  form.fields.name = 'Ada Lovelace Ltd'
  await nextTick()
  expect(unloadAsks()).toBe(false)
  await router.push('/customers')
  expect(router.currentRoute.value.path).toBe('/customers')
  expect(asked).toEqual([])
})
