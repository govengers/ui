// Tabs mounted (D69): the active tab of a strip wider than its box is scrolled into it on mount and
// on a new active tab, and again on a change of the items or of the strip's size unless the user has
// scrolled the strip since; a position the browser moved by itself (a clamp) and a tap on a tab are
// no user scroll.
// jsdom has no layout: the strip (150 px) and its tabs (100 px each) get their boxes from the
// stand-ins below, and the harness's ResizeObserver is a stand-in whose `report()` is the browser's notice.
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { nextTick, reactive, type Component } from 'vue'
import { key, mount } from '../../scripts/test/mount'
import { TestResizeObserver } from '../../scripts/test/resize'
import Tabs from './Tabs.vue'

const strips = new WeakMap<Element, number>()
const isStrip = (element: Element): boolean => element.classList.contains('ui-tabs')
const width = (element: Element): number => element.children.length * 100
const proto = HTMLElement.prototype
const shadowed = ['scrollLeft', 'scrollWidth', 'clientWidth', 'getBoundingClientRect'] as const
beforeAll(() => {
  Object.defineProperty(proto, 'scrollLeft', {
    configurable: true,
    get(this: HTMLElement) { return strips.get(this) ?? 0 },
    // The browser's clamp: never before the start, never past the end.
    set(this: HTMLElement, value: number) { if (isStrip(this)) strips.set(this, Math.max(0, Math.min(value, width(this) - 150))) },
  })
  Object.defineProperty(proto, 'scrollWidth', { configurable: true, get(this: HTMLElement) { return isStrip(this) ? width(this) : 0 } })
  Object.defineProperty(proto, 'clientWidth', { configurable: true, get(this: HTMLElement) { return isStrip(this) ? 150 : 0 } })
  Object.defineProperty(proto, 'getBoundingClientRect', {
    configurable: true,
    value(this: HTMLElement) {
      if (isStrip(this)) return { left: 0, right: 150, top: 0, bottom: 44, width: 150, height: 44 }
      const parent = this.parentElement!
      const left = [...parent.children].indexOf(this) * 100 - (strips.get(parent) ?? 0)
      return { left, right: left + 100, top: 0, bottom: 44, width: 100, height: 44 }
    },
  })
})
afterAll(() => {
  for (const name of shadowed) delete (proto as unknown as Record<string, unknown>)[name]
})

test('the active tab is placed on mount and on every new active tab; items and size place it again unless the user scrolled', async () => {
  const state = reactive({ value: 'd', items: ['a', 'b', 'c', 'd'].map(value => ({ value, label: value })) })
  const view = mount(Tabs as Component, () => ({ items: state.items, modelValue: state.value, label: 'Views' }))
  const strip = view.root.querySelector<HTMLElement>('.ui-tabs')!
  const settle = async () => { await nextTick(); await nextTick() }
  await settle()
  expect(strip.scrollLeft).toBe(250) // "d" at 300..400 in a 150 px strip
  state.value = 'a'
  await settle()
  expect(strip.scrollLeft).toBe(0)

  // The user scrolls the strip: new counts and a new size leave it where the user put it.
  state.value = 'c'
  await settle()
  expect(strip.scrollLeft).toBe(150)
  strip.dispatchEvent(new Event('wheel'))
  strip.scrollLeft = 0
  state.items = state.items.map(item => ({ ...item, count: 12 }))
  await settle()
  TestResizeObserver.last!.report()
  expect(strip.scrollLeft).toBe(0)

  // A new active tab ends the user's scroll; a position the browser moved by itself (a clamp after
  // counts shrank, or a rotation in which nothing overflowed) is placed again by the items and the size.
  state.value = 'a'
  await settle()
  state.value = 'c'
  await settle()
  expect(strip.scrollLeft).toBe(150)
  strip.scrollLeft = 100
  state.items = state.items.map(item => ({ ...item, count: 13 }))
  await settle()
  expect(strip.scrollLeft).toBe(150)
  strip.scrollLeft = 0
  TestResizeObserver.last!.report()
  expect(strip.scrollLeft).toBe(150)

  // A tap on a tab and the Tab key scroll nothing (the next size change places the active tab
  // again); a press on the strip itself (its scrollbar) is the user's scroll.
  const active = strip.querySelector<HTMLElement>('[aria-selected="true"]')!
  active.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  key(active, 'Tab')
  strip.scrollLeft = 0
  TestResizeObserver.last!.report()
  expect(strip.scrollLeft).toBe(150)
  strip.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  strip.scrollLeft = 0
  TestResizeObserver.last!.report()
  expect(strip.scrollLeft).toBe(0)
  view.unmount()
})

test('in a nav of links the arrow, Home and End keys are the user\'s scroll, the Tab key is not', async () => {
  const items = ['a', 'b', 'c', 'd'].map(value => ({ value, label: value, to: `/views/${value}` }))
  const view = mount(Tabs as Component, () => ({ items, modelValue: 'c', label: 'Views' }))
  await nextTick()
  await nextTick()
  const strip = view.root.querySelector<HTMLElement>('nav.ui-tabs')!
  expect(strip.scrollLeft).toBe(150)
  const link = strip.querySelector<HTMLElement>('[aria-current="page"]')!
  key(link, 'Tab')
  strip.scrollLeft = 0
  TestResizeObserver.last!.report()
  expect(strip.scrollLeft).toBe(150)
  key(link, 'ArrowRight')
  strip.scrollLeft = 0
  TestResizeObserver.last!.report()
  expect(strip.scrollLeft).toBe(0)
  view.unmount()
})
