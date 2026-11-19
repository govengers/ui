import { describe, expect, test } from 'bun:test'
import { answering, following, guideStops, nearBottom, thinking, thread, type ChatMessage } from './dock'

const message = (id: string, role: ChatMessage['role'], createdAt: string): ChatMessage => ({ id, role, text: id, createdAt })

describe('dock', () => {
  test('the thread is oldest first', () => {
    const late = message('b', 'agent', '2026-11-02T10:00:01Z')
    const early = message('a', 'user', '2026-11-02T11:00:00+02:00')
    expect(thread([late, early]).map(item => item.id)).toEqual(['a', 'b'])
  })

  test('thinking while the newest message is the user\'s', () => {
    expect(thinking([])).toBe(false)
    expect(thinking([message('a', 'user', '1')])).toBe(true)
    expect(thinking([message('a', 'user', '1'), message('b', 'agent', '2')])).toBe(false)
  })

  test('answering while the agent owes an answer or its newest message streams', () => {
    const streaming = { ...message('b', 'agent', '2'), streaming: true }
    expect(answering([])).toBe(false)
    expect(answering([message('a', 'user', '1')])).toBe(true)
    expect(answering([message('a', 'user', '1'), streaming])).toBe(true)
    expect(answering([message('a', 'user', '1'), { ...streaming, streaming: false }])).toBe(false)
    expect(answering([streaming, message('c', 'agent', '3')])).toBe(false)
  })

  test.each([
    ['at the bottom', 600, 1000, 400, 20, true],
    ['within one line', 585, 1000, 400, 20, true],
    ['one line and a bit above it', 579, 1000, 400, 20, false],
    ['scrolled to the top', 0, 1000, 400, 20, false],
    ['a log shorter than its box', 0, 300, 400, 20, true],
  ])('near the bottom: %s', (_, scrollTop, scrollHeight, clientHeight, slack, near) => {
    expect(nearBottom(scrollTop, scrollHeight, clientHeight, slack)).toBe(near)
  })

  test.each([
    ['down to within a line of the bottom', 500, 590, 1000, 400, true],
    ['down, still more than a line above it', 0, 570, 1000, 400, false],
    ['not moved, at the bottom', 600, 600, 1000, 400, true],
    ['up by less than a line', 600, 590, 1000, 400, false],
    ['up by 1 px from the bottom', 600, 599, 1000, 400, false],
    ['up by half a pixel', 600, 599.5, 1000, 400, false],
    ['up, clamped to the bottom of a box 1 px taller (the observer re-pins)', 600, 599, 1000, 401, false],
    ['up, clamped to the bottom of a box 52 px taller (the observer re-pins)', 600, 548, 1000, 452, false],
  ])('following after a scroll %s', (_, previousTop, scrollTop, scrollHeight, clientHeight, follows) => {
    expect(following(previousTop, scrollTop, scrollHeight, clientHeight, 24)).toBe(follows)
  })

  test('guide stops carry the page they live on', () => {
    const stops = guideStops({
      goal: 'x',
      steps: [
        { kind: 'spotlight', target: { action: 'a' }, say: 'here' },
        { kind: 'navigate', path: '/customers' },
        { kind: 'fill', target: { field: 'search' }, value: 'Globex' },
        { kind: 'navigate', path: '/orders' },
        { kind: 'pause', target: { action: 'filter' }, say: 'filter' },
      ],
    })
    expect(stops.map(stop => [stop.step.kind, stop.path])).toEqual([['spotlight', undefined], ['fill', '/customers'], ['pause', '/orders']])
  })
})
