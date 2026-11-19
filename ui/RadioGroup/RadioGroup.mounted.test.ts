// RadioGroup mounted (D69): change events, the shared name, the checked radio, disabled options,
// a refused change and the Field's required.
// The arrow keys are the browser's (jsdom does not move the selection): a browser check in the
// run report, not here.
import { afterEach, expect, test } from 'bun:test'
import { h, nextTick, ref, type Component } from 'vue'
import { mount, type Mounted } from '../../scripts/test/mount'
import Field from '../Field/Field.vue'
import RadioGroup from './RadioGroup.vue'

let view: Mounted | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

const options = [
  { value: 1, label: 'One' },
  { value: 2, label: 'Two', description: 'The second' },
  { value: 3, label: 'Three', disabled: true },
]
const radios = (root: HTMLElement) => [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')]

test('a change on an option emits its own value, and the checked radio follows modelValue', async () => {
  const model = ref<string | number | null>(1)
  const emitted: unknown[] = []
  view = mount(RadioGroup as Component, () => ({
    modelValue: model.value,
    options,
    'onUpdate:modelValue': (value: string | number) => { emitted.push(value); model.value = value },
  }))
  await nextTick()
  expect(radios(view.root).map(radio => radio.checked)).toEqual([true, false, false])
  radios(view.root)[1]!.click()
  await nextTick()
  expect(emitted).toEqual([2])
  expect(radios(view.root).map(radio => radio.checked)).toEqual([false, true, false])
  model.value = 1
  await nextTick()
  expect(radios(view.root).map(radio => radio.checked)).toEqual([true, false, false])
})

test('a parent that keeps its value gets the checked radio back', async () => {
  const emitted: unknown[] = []
  view = mount(RadioGroup as Component, () => ({ modelValue: 1, options, 'onUpdate:modelValue': (value: string | number) => emitted.push(value) }))
  await nextTick()
  radios(view.root)[1]!.click()
  await nextTick()
  await nextTick()
  expect(emitted).toEqual([2])
  expect(radios(view.root).map(radio => radio.checked)).toEqual([true, false, false])
})

test('every radio shares one name, the given one or a generated one', async () => {
  view = mount(RadioGroup as Component, () => ({ options, name: 'theme' }))
  await nextTick()
  expect(radios(view.root).map(radio => radio.name)).toEqual(['theme', 'theme', 'theme'])
  view.unmount()
  view = mount(RadioGroup as Component, () => ({ options }))
  await nextTick()
  const names = new Set(radios(view.root).map(radio => radio.name))
  expect(names.size).toBe(1)
  expect([...names][0]).not.toBe('')
})

test('a disabled option is disabled, a disabled group disables every option', async () => {
  const disabled = ref(false)
  view = mount(RadioGroup as Component, () => ({ options, disabled: disabled.value }))
  await nextTick()
  expect(radios(view.root).map(radio => radio.disabled)).toEqual([false, false, true])
  disabled.value = true
  await nextTick()
  expect(radios(view.root).map(radio => radio.disabled)).toEqual([true, true, true])
})

test('the name is the label alone, the description describes, the Field group marks every radio invalid', async () => {
  view = mount(Field as Component, () => ({ label: 'Count', group: true, error: 'Pick one' }), {
    default: () => h(RadioGroup as Component, { options, modelValue: 1 }),
  })
  await nextTick()
  const [, second] = radios(view.root)
  expect(view.root.querySelector(`#${second!.getAttribute('aria-labelledby')}`)?.textContent).toBe('Two')
  expect(view.root.querySelector(`#${second!.getAttribute('aria-describedby')}`)?.textContent).toBe('The second')
  expect(radios(view.root).every(radio => radio.getAttribute('aria-invalid') === 'true')).toBe(true)
  expect(view.root.querySelector('fieldset legend')?.textContent?.trim()).toBe('Count')
})

test('the Field group\'s required lands on every radio, so an empty group is missing a value', async () => {
  const required = ref(true)
  const model = ref<string | number | null>(null)
  view = mount(Field as Component, () => ({ label: 'Count', group: true, required: required.value }), {
    default: () => h(RadioGroup as Component, { options, modelValue: model.value, 'onUpdate:modelValue': (value: string | number) => { model.value = value } }),
  })
  await nextTick()
  expect(radios(view.root).every(radio => radio.required)).toBe(true)
  expect(radios(view.root)[0]!.validity.valueMissing).toBe(true)
  radios(view.root)[0]!.click()
  await nextTick()
  expect(radios(view.root)[1]!.validity.valueMissing).toBe(false)
  required.value = false
  await nextTick()
  expect(radios(view.root).some(radio => radio.hasAttribute('required'))).toBe(false)
})
