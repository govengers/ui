// place (D51, D90): every branch on fake boxes in a 1000 by 800 viewport, gap 4.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { place, type PlaceOptions } from './place'

const root = document.documentElement
beforeAll(() => {
  Object.defineProperty(root, 'clientWidth', { value: 1000, configurable: true })
  Object.defineProperty(root, 'clientHeight', { value: 800, configurable: true })
})
afterAll(() => {
  delete (root as unknown as Record<string, unknown>)['clientWidth']
  delete (root as unknown as Record<string, unknown>)['clientHeight']
})

type Box = { left: number; top: number; width: number; height: number }
function fake(box: Box, style = ''): HTMLElement {
  const node = document.createElement('div')
  node.setAttribute('style', style)
  node.getBoundingClientRect = () => ({ ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => box })
  document.body.append(node)
  return node
}

const defaults: PlaceOptions = { placement: 'auto', align: 'start', matchWidth: false, gap: 4 }
function run(anchor: Box, panel: { width: number; height: number }, options: Partial<PlaceOptions> = {}, style = '') {
  const node = fake({ left: 0, top: 0, ...panel })
  place(fake(anchor, style), node, { ...defaults, ...options })
  const { top, left, maxHeight, minWidth } = node.style
  return { placement: node.dataset['placement'], top, left, maxHeight, minWidth }
}

describe('above and below', () => {
  test('auto: below when it fits', () => {
    expect(run({ left: 100, top: 100, width: 80, height: 40 }, { width: 200, height: 100 }))
      .toEqual({ placement: 'bottom', top: '144px', left: '100px', maxHeight: '652px', minWidth: '' })
  })
  test('auto: above when only that fits', () => {
    expect(run({ left: 100, top: 700, width: 80, height: 40 }, { width: 200, height: 100 }))
      .toEqual({ placement: 'top', top: '596px', left: '100px', maxHeight: '692px', minWidth: '' })
  })
  test('auto: the roomier side when neither fits, the panel capped to its room', () => {
    expect(run({ left: 100, top: 300, width: 80, height: 40 }, { width: 200, height: 600 }))
      .toEqual({ placement: 'bottom', top: '344px', left: '100px', maxHeight: '452px', minWidth: '' })
    expect(run({ left: 100, top: 500, width: 80, height: 40 }, { width: 200, height: 600 }))
      .toEqual({ placement: 'top', top: '4px', left: '100px', maxHeight: '492px', minWidth: '' })
  })
  test('bottom and top never flip', () => {
    expect(run({ left: 100, top: 700, width: 80, height: 40 }, { width: 200, height: 100 }, { placement: 'bottom' }).placement).toBe('bottom')
    expect(run({ left: 100, top: 10, width: 80, height: 40 }, { width: 200, height: 100 }, { placement: 'top' }).placement).toBe('top')
  })
  test('align end lines the right edges up; the viewport clamps; matchWidth sets the least width', () => {
    expect(run({ left: 500, top: 100, width: 80, height: 40 }, { width: 200, height: 100 }, { align: 'end' }).left).toBe('380px')
    expect(run({ left: 900, top: 100, width: 80, height: 40 }, { width: 200, height: 100 }).left).toBe('796px')
    expect(run({ left: 100, top: 100, width: 80, height: 40 }, { width: 200, height: 100 }, { matchWidth: true }).minWidth).toBe('80px')
  })
})

describe('end', () => {
  test('beside the anchor at its inline end, centred on it', () => {
    expect(run({ left: 10, top: 100, width: 44, height: 44 }, { width: 80, height: 24 }, { placement: 'end' }))
      .toEqual({ placement: 'end', top: '110px', left: '58px', maxHeight: '', minWidth: '' })
  })
  test('right to left: the inline end is the left side', () => {
    expect(run({ left: 900, top: 100, width: 44, height: 44 }, { width: 80, height: 24 }, { placement: 'end' }, 'direction: rtl'))
      .toEqual({ placement: 'end', top: '110px', left: '816px', maxHeight: '', minWidth: '' })
  })
  test('at the inline-end edge it takes the start side instead of covering its anchor', () => {
    expect(run({ left: 940, top: 100, width: 44, height: 44 }, { width: 80, height: 24 }, { placement: 'end' }))
      .toEqual({ placement: 'start', top: '110px', left: '856px', maxHeight: '', minWidth: '' })
    expect(run({ left: 10, top: 100, width: 44, height: 44 }, { width: 80, height: 24 }, { placement: 'end' }, 'direction: rtl'))
      .toEqual({ placement: 'start', top: '110px', left: '58px', maxHeight: '', minWidth: '' })
  })
})

test('a display: contents anchor is looked through to its first element with a box', () => {
  const wrapper = fake({ left: 0, top: 0, width: 0, height: 0 }, 'display: contents')
  wrapper.append(fake({ left: 100, top: 100, width: 80, height: 40 }))
  const panel = fake({ left: 0, top: 0, width: 200, height: 100 })
  place(wrapper, panel, defaults)
  expect([panel.style.top, panel.style.left]).toEqual(['144px', '100px'])
})
