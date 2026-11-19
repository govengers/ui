// DetailPage mounted (D69, D96): deleting a record with unsaved edits goes back to the list
// without the leave guard asking about edits to a record that no longer exists.
import { afterEach, expect, test } from 'bun:test'
import { defineComponent, h, type Component } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { mount, settle, type Mounted } from '../../scripts/test/mount'
import DetailPage from './DetailPage.vue'

let view: Mounted | undefined
const confirm = window.confirm
afterEach(() => {
  view?.unmount()
  view = undefined
  window.confirm = confirm
})

test('a confirmed delete with a touched field goes to the list and never asks to leave', async () => {
  let asked = 0
  window.confirm = () => {
    asked += 1
    return false
  }
  let router: Router | undefined
  // The page links to the list routes by name; the harness router has a catch-all only.
  const Host = defineComponent({
    setup() {
      router = useRouter()
      const empty = { render: () => null }
      router.addRoute({ name: 'customers.list', path: '/customers', component: empty })
      router.addRoute({ name: 'orders.list', path: '/orders', component: empty })
      return () => h(DetailPage as Component, { id: 'cus-001' })
    },
  })
  view = mount(Host)
  if (router === undefined) throw new Error('no router')
  await router.push('/customers/cus-001')
  await settle()

  const name = view.root.querySelector<HTMLInputElement>('input[name="name"]')
  if (name === null) throw new Error('the form did not render')
  name.value = 'Edited, not saved'
  name.dispatchEvent(new Event('input', { bubbles: true }))
  await settle(1)
  expect(view.root.textContent).toContain('Unsaved changes')

  // The Dialog's confirm button, pressed without opening the dialog first.
  view.root.querySelector<HTMLButtonElement>('dialog [data-action="deleteCustomer"]')?.click()
  await settle()
  expect(view.engine.store.tables.customers.some((customer) => customer.id === 'cus-001')).toBe(false)
  expect(router.currentRoute.value.path).toBe('/customers')
  expect(asked).toBe(0)
})
