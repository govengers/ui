// Stepper mounted (D69, D96): Continue stays enabled; a click while `canContinue` is false emits
// `blocked`, not `update:modelValue`, and the focus goes to the field the page marked.
import { afterEach, expect, test } from 'bun:test'
import { h, ref, type Component } from 'vue'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import Field from '../../Field/Field.vue'
import Input from '../../Input/Input.vue'
import Stepper from './Stepper.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

test('a Continue click while canContinue is false emits blocked and moves nowhere', async () => {
  const canContinue = ref(false)
  const error = ref<string>()
  const blocked: unknown[] = []
  const moved: string[] = []
  view = mount(Stepper as Component, () => ({
    steps: [{ key: 'source', title: 'Source' }, { key: 'review', title: 'Review' }],
    modelValue: 'source',
    canContinue: canContinue.value,
    onBlocked: () => {
      blocked.push(true)
      error.value = 'This name is taken.'
    },
    'onUpdate:modelValue': (key: string) => moved.push(key),
  }), {
    default: () => h(Field, { label: 'Name', error: error.value }, () => h(Input, { name: 'exportName' })),
  })
  await settle(1)
  const next = view.root.querySelector<HTMLButtonElement>('[data-action="continue"]')
  expect(next?.disabled).toBe(false)
  next?.click()
  await settle(1)
  expect(blocked).toHaveLength(1)
  expect(moved).toEqual([])
  expect(document.activeElement).toBe(view.root.querySelector('input[name="exportName"]'))

  canContinue.value = true
  await settle(1)
  next?.click()
  await settle(1)
  expect(blocked).toHaveLength(1)
  expect(moved).toEqual(['review'])
})
