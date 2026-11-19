// DetailForm mounted (D69): a refused save puts the focus on the first refused control in DOM
// order (01-I); leaving a refused field with another value clears its error (settle, D96), but
// not while the press that took the focus away is still down.
import { afterEach, expect, test } from 'bun:test'
import { defineComponent, h, type Component } from 'vue'
import { calls, live, type Customer, type UpdateCustomer } from '../../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import Field from '../../Field/Field.vue'
import Input from '../../Input/Input.vue'
import { useLiveForm } from '../LiveForm/liveForm'
import DetailForm from './DetailForm.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

type Fields = Record<string, string>

// Country renders before name, against the order of `pick` and of the server's errors.
const Host = defineComponent({
  setup() {
    const form = useLiveForm({
      target: live['customers.item'], params: { id: 'cus-001' }, call: calls.updateCustomer,
      pick: (customer: Customer): UpdateCustomer => ({ name: customer.name, country: customer.country }),
    })
    const control = (fields: Fields, errors: Fields, name: string) => h(Field, { label: name, error: errors[name] }, () => h(Input, {
      name, modelValue: fields[name], 'onUpdate:modelValue': (value: string | number | null) => (fields[name] = String(value)),
    }))
    return () => h(DetailForm as Component, { form, title: 'Customer', action: 'updateCustomer' }, {
      default: ({ fields, errors }: { fields: Fields; errors: Fields }) => [control(fields, errors, 'country'), control(fields, errors, 'name')],
    })
  },
})

function input(root: HTMLElement, name: string): HTMLInputElement {
  const element = root.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (element === null) throw new Error(`no input ${name}`)
  return element
}

function type(element: HTMLInputElement, value: string): void {
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

/** Empties name and country and saves with a click on Save; the fake refuses both. */
async function refusedSave(): Promise<HTMLElement> {
  view = mount(Host)
  await settle()
  const { root } = view
  type(input(root, 'name'), '')
  type(input(root, 'country'), ' ')
  await settle(1)
  const save = root.querySelector<HTMLButtonElement>('[data-action="updateCustomer"]')
  save?.focus()
  save?.click()
  await settle()
  return root
}

test('a refused save focuses the first refused control in DOM order', async () => {
  const root = await refusedSave()
  expect(root.querySelectorAll('[aria-invalid="true"]')).toHaveLength(2)
  expect(document.activeElement).toBe(input(root, 'country'))
})

test('leaving a refused field clears its error only when its value changed', async () => {
  const root = await refusedSave()
  input(root, 'name').dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  await settle(1)
  expect(input(root, 'name').getAttribute('aria-invalid')).toBe('true')
  type(input(root, 'country'), 'FR')
  input(root, 'country').dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  await settle(1)
  expect(input(root, 'country').hasAttribute('aria-invalid')).toBe(false)
  expect(input(root, 'name').getAttribute('aria-invalid')).toBe('true')
})

test('a corrected field keeps its error line while the press on Save is down', async () => {
  const root = await refusedSave()
  const save = root.querySelector<HTMLButtonElement>('[data-action="updateCustomer"]')
  if (save === null) throw new Error('no Save')
  type(input(root, 'country'), 'FR')
  save.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }))
  input(root, 'country').dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  await settle()
  expect(input(root, 'country').getAttribute('aria-invalid')).toBe('true')
  save.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }))
  await settle()
  expect(input(root, 'country').hasAttribute('aria-invalid')).toBe(false)
})
