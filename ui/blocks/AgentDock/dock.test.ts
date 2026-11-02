import { describe, expect, test } from 'bun:test'
import { guideStops, thinking, thread, type ChatMessage } from './dock'

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
