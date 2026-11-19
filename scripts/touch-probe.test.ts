// The touch probe's verdict (D87) without a browser: what fails, what a known entry waives, and when
// an entry is stale.
import { describe, expect, test } from 'bun:test'
import { judge, known as recordedKnown, type Exempt, type Known, type Offender } from './touch-probe'

const known: Known[] = [
  { route: '/ui/blocks/FacetFilter', selector: '.remove', size: [30, 44], why: 'icon button' },
  { route: '/ui/blocks/AgentDock', selector: '.composer', size: [255, 42], why: 'one-row textarea' },
  { route: '/pages/LoginPage', selector: '.imprint', size: [51, 24], compact: [48.2, 22.5], why: 'text link' },
]
const exempt: Exempt[] = [{ selector: '.inline', why: 'a link in a sentence' }]
const at = (route: string, density: Offender['density'], width: number, height: number, lists: { known?: number; exempt?: number } = {}): Offender =>
  ({ route, density, selector: 'x', width, height, ...lists })

describe('touch probe verdict', () => {
  const buckets = ['failing', 'shrunk', 'waived', 'exempted'] as const
  const cases: [string, Offender, (typeof buckets)[number]][] = [
    ['a target in neither list fails', at('/ui/Button', 'comfortable', 36, 36), 'failing'],
    ['a known target at its recorded size is waived', at('/ui/blocks/FacetFilter', 'comfortable', 30, 44, { known: 0 }), 'waived'],
    ['a known target smaller than recorded fails', at('/ui/blocks/FacetFilter', 'comfortable', 12, 12, { known: 0 }), 'shrunk'],
    ['half a pixel under the record is layout rounding', at('/ui/blocks/FacetFilter', 'compact', 29.6, 44, { known: 0 }), 'waived'],
    ['a side at 44 px or more may change', at('/ui/blocks/AgentDock', 'comfortable', 200, 42, { known: 1 }), 'waived'],
    ['a side that drops under 44 px fails', at('/ui/blocks/AgentDock', 'comfortable', 40, 42, { known: 1 }), 'shrunk'],
    ['compact is held to its own record', at('/pages/LoginPage', 'compact', 48.2, 22.5, { known: 2 }), 'waived'],
    ['comfortable is held to its own record', at('/pages/LoginPage', 'comfortable', 51, 22.5, { known: 2 }), 'shrunk'],
    ['an exempt target is not judged by size', at('/ui/EmptyState', 'comfortable', 10, 10, { exempt: 0 }), 'exempted'],
  ]
  for (const [name, offender, bucket] of cases) {
    test(name, () => {
      const verdict = judge([offender], { known, exempt }, false)
      for (const other of buckets) expect(verdict[other]).toEqual(other === bucket ? [offender] : [])
    })
  }

  test('over every demo an entry that matched nothing is stale and fails', () => {
    const found = [at('/ui/blocks/FacetFilter', 'comfortable', 30, 44, { known: 0 }), at('/pages/LoginPage', 'compact', 48.2, 22.5, { known: 2 })]
    expect(judge(found, { known, exempt }, true).stale).toEqual(['known /ui/blocks/AgentDock .composer', 'exempt * .inline'])
  })

  test('a run of one demo judges no entry stale', () => {
    expect(judge([], { known, exempt }, false).stale).toEqual([])
  })

  test('every recorded known target is under 44 px on at least one side', () => {
    for (const entry of recordedKnown) expect(Math.min(...entry.size, ...(entry.compact ?? [])), entry.selector).toBeLessThan(44)
  })
})
