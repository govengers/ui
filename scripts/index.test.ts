import { describe, expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readCards } from './cards'
import { render } from './index'

describe('cards and index', () => {
  test('reads front matter, summary and renders by tier and intent', () => {
    const root = mkdtempSync(join(tmpdir(), 'ui-index-'))
    mkdirSync(join(root, 'ui', 'Button'), { recursive: true })
    writeFileSync(join(root, 'ui', 'Button', 'Button.vue'), '<template><button /></template>')
    writeFileSync(join(root, 'ui', 'Button', 'Button.md'), [
      '---', 'name: Button', 'tier: primitive', 'intent: [button, action]', 'uses: [Icon]', 'livewire: false', 'status: ready', '---',
      '', '# Button', '', 'The one button.', 'Two lines.', '', '## Props',
    ].join('\n'))
    const cards = readCards(root)
    expect(cards).toHaveLength(1)
    const card = cards[0]!
    expect(card.intent).toEqual(['button', 'action'])
    expect(card.uses).toEqual(['Icon'])
    expect(card.component).toBe('ui/Button/Button.vue')
    expect(card.summary).toBe('The one button. Two lines.')
    const text = render(cards)
    expect(text).toContain('| [Button](ui/Button/Button.md) | button, action | Icon | no | ready | The one button. Two lines. |')
    expect(text).toContain('- **action**: [Button](ui/Button/Button.md)')
  })

  test('rejects an unknown tier', () => {
    const root = mkdtempSync(join(tmpdir(), 'ui-index-'))
    mkdirSync(join(root, 'ui', 'X'), { recursive: true })
    writeFileSync(join(root, 'ui', 'X', 'X.md'), '---\nname: X\ntier: widget\n---\n\n# X\n')
    expect(() => readCards(root)).toThrow('tier must be one of')
  })
})
