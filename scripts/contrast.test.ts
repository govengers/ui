import { describe, expect, test } from 'bun:test'
import { contrast, readTokens, resolve, undeclaredPairs } from './contrast'

describe('contrast', () => {
  test('black on white is 21, white on white is 1', () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0)
    expect(contrast([255, 255, 255], [255, 255, 255])).toBe(1)
  })

  test('resolves var() through light-dark() per scheme', () => {
    const tokens = readTokens(`
      :root {
        --ui-gray-0: #ffffff;
        --ui-gray-900: #111111;
        --ui-bg: light-dark(var(--ui-gray-0), var(--ui-gray-900));
      }
    `)
    expect(resolve(tokens, '--ui-bg', 'light')).toEqual([255, 255, 255])
    expect(resolve(tokens, '--ui-bg', 'dark')).toEqual([17, 17, 17])
  })

  test('a later declaration wins, as in the cascade', () => {
    const tokens = readTokens(':root { --ui-bg: #000000; } :root { --ui-bg: #ffffff; }')
    expect(resolve(tokens, '--ui-bg', 'light')).toEqual([255, 255, 255])
  })

  test('refuses what it cannot measure', () => {
    const tokens = readTokens(':root { --ui-scrim: rgb(0 0 0 / 0.5); }')
    expect(() => resolve(tokens, '--ui-scrim', 'light')).toThrow('cannot measure')
    expect(() => resolve(tokens, '--ui-nope', 'light')).toThrow('not declared')
  })

  test('mixes two colours channel by channel in srgb, per scheme', () => {
    const tokens = readTokens(`
      :root {
        --ui-a: light-dark(#ff0000, #0000ff);
        --ui-b: #ffffff;
        --ui-pressed: color-mix(in srgb, var(--ui-a) 75%, var(--ui-b));
        --ui-second: color-mix(in srgb, #000000, #ffffff 25%);
        --ui-half: color-mix(in srgb, #000000, #ffffff);
        --ui-scaled: color-mix(in srgb, #000000 60%, #ffffff 60%);
        --ui-thin: color-mix(in srgb, #000000 40%, #ffffff 40%);
        --ui-oklch: color-mix(in oklch, #000000 50%, #ffffff);
        --ui-over: color-mix(in srgb, #000000 101%, #ffffff);
        --ui-over-second: color-mix(in srgb, #000000, #ffffff 130%);
      }
    `)
    expect(resolve(tokens, '--ui-pressed', 'light')).toEqual([255, 63.75, 63.75])
    expect(resolve(tokens, '--ui-pressed', 'dark')).toEqual([63.75, 63.75, 255])
    expect(resolve(tokens, '--ui-second', 'light')).toEqual([63.75, 63.75, 63.75])
    expect(resolve(tokens, '--ui-half', 'light')).toEqual([127.5, 127.5, 127.5])
    expect(resolve(tokens, '--ui-scaled', 'light')).toEqual([127.5, 127.5, 127.5])
    expect(() => resolve(tokens, '--ui-thin', 'light')).toThrow('translucent')
    expect(() => resolve(tokens, '--ui-oklch', 'light')).toThrow('cannot measure')
    expect(() => resolve(tokens, '--ui-over', 'light')).toThrow('over 100%')
    expect(() => resolve(tokens, '--ui-over-second', 'light')).toThrow('over 100%')
  })

  test('Button paints the pressed grounds the pairs measure, from the first frame (D104)', async () => {
    const button = await Bun.file(`${import.meta.dir}/../ui/Button/Button.vue`).text()
    const pressed = (variants: string) => new RegExp(`\\.ui-button${variants}:active:not\\(:disabled, \\[aria-disabled\\]\\) \\{ ([^}]*) \\}`).exec(button)?.[1]
    expect(pressed('')).toBe('transition: none;')
    expect(pressed('\\[data-variant="primary"\\]')).toBe('background: var(--ui-accent-active);')
    expect(pressed(':is\\(\\[data-variant="secondary"\\], \\[data-variant="ghost"\\]\\)')).toBe('background: var(--ui-surface-3); color: var(--ui-ink);')
    expect(pressed('\\[data-variant="danger"\\]')).toBe('background: var(--ui-danger-active);')
  })

  test('the pressed rules win over hover by order and hold on touch screens (D104)', async () => {
    const button = await Bun.file(`${import.meta.dir}/../ui/Button/Button.vue`).text()
    // Every @media block with its body, braces counted.
    const blocks: { start: number; end: number }[] = []
    for (const match of button.matchAll(/@media[^{]*\{/g)) {
      let depth = 1
      let index = match.index + match[0].length
      while (depth > 0) depth += button[index] === '{' ? 1 : button[index] === '}' ? -1 : 0, index += 1
      blocks.push({ start: match.index, end: index })
    }
    const hover = blocks.find(block => button.slice(block.start, block.end).startsWith('@media (hover: hover)'))!
    const firstPressed = button.indexOf(':active:not(')
    expect(firstPressed).toBeGreaterThan(hover.end)
    expect(blocks.filter(block => button.slice(block.start, block.end).includes(':active'))).toEqual([])
  })

  test('a press is a step past hover in every preset and theme (D104)', async () => {
    const tokensCss = await Bun.file(`${import.meta.dir}/../ui/tokens.css`).text()
    const presets = [...new Bun.Glob('*.css').scanSync(`${import.meta.dir}/../ui/presets`)].sort()
    expect(presets.length).toBeGreaterThan(0)
    for (const preset of presets) {
      const tokens = readTokens(tokensCss + '\n' + await Bun.file(`${import.meta.dir}/../ui/presets/${preset}`).text())
      for (const scheme of ['light', 'dark'] as const) {
        for (const [pressed, hover] of [['--ui-accent-active', '--ui-accent-hover'], ['--ui-danger-active', '--ui-danger-hover'], ['--ui-surface-3', '--ui-surface-2']]) {
          const step = contrast(resolve(tokens, pressed!, scheme), resolve(tokens, hover!, scheme))
          expect([preset, scheme, pressed, step > 1.03]).toEqual([preset, scheme, pressed, true])
        }
      }
    }
  })

  test('the scan reports a colour and ground pair of one rule that nobody declared', () => {
    const source = `<template><p /></template>
<style scoped>
/* declared: ink on surface */
.a { color: var(--ui-ink); background: var(--ui-surface); }
/* exempt: a disabled control */
.b:disabled { background-color: var(--ui-sunk); color: var(--ui-disabled-ink); }
@media (hover: hover) {
  .c:hover { color: var(--ui-muted); background: var(--ui-accent-soft) !important; }
}
/* one side only, or in two rules: not a pair the scan can see */
.d { color: var(--ui-muted); border-color: var(--ui-border); }
.e { background: var(--ui-sunk); }
</style>`
    expect(undeclaredPairs(source)).toEqual([{ fg: '--ui-muted', bg: '--ui-accent-soft', selector: '.c:hover' }])
  })

  test('the Tooltip panel inverts the page: ink ground, surface text (D106)', async () => {
    const tooltip = await Bun.file(`${import.meta.dir}/../ui/Tooltip/Tooltip.vue`).text()
    expect(tooltip).toContain('  background: var(--ui-ink);\n  color: var(--ui-surface);\n  border: var(--ui-border-width) solid var(--ui-surface);\n')
  })

  // One undeclared pair (muted on accent-soft) written in each form the scan has to read.
  const forms: [string, string, string][] = [
    ['var() with spaces', '.s { color: var( --ui-muted ); background: var(  --ui-accent-soft ); }', '.s'],
    ['var() with a fallback', '.f { color: var(--ui-muted, currentColor); background-color: var(--ui-accent-soft, var(--ui-surface)); }', '.f'],
    ['a background shorthand that starts with the token', '.b { color: var(--ui-muted); background: var(--ui-accent-soft) no-repeat; }', '.b'],
    ['the own declarations of a rule that nests', '.n { color: var(--ui-muted); .child { color: var(--ui-ink); } background: var(--ui-accent-soft); }', '.n'],
    ['a nested rule with &', '.p { color: var(--ui-ink); &:hover { color: var(--ui-muted); background: var(--ui-accent-soft); } }', '.p:hover'],
    ['a nested descendant rule', '.d { .row { color: var(--ui-muted); background: var(--ui-accent-soft); } }', '.d .row'],
    ['an at-rule inside a rule', '.m { @media (hover: hover) { color: var(--ui-muted); background: var(--ui-accent-soft); } }', '.m'],
    ['the rules of an at-rule', '@media (hover: hover) { .h:hover { background: var(--ui-accent-soft); color: var(--ui-muted); } }', '.h:hover'],
  ]
  for (const [name, css, selector] of forms) {
    test(`the scan reads ${name}`, () => {
      expect(undeclaredPairs(`<style>${css}</style>`)).toEqual([{ fg: '--ui-muted', bg: '--ui-accent-soft', selector }])
    })
  }

  test('ghost Buttons on the top bar change their ground without a fade, so the ink never crosses it', async () => {
    const shell = await Bun.file(`${import.meta.dir}/../ui/AppShell/AppShell.vue`).text()
    expect(shell).toContain('.ui-app-shell__actions :deep(.ui-button[data-variant="ghost"]:where(:not([popover] *, dialog *))) { transition: none; }')
  })

  test('the scan sees no pair where the cascade paints none', () => {
    const css = `
      .later { background: var(--ui-accent-soft); color: var(--ui-muted); background: none; }
      .mix { color: var(--ui-muted); background: color-mix(in srgb, var(--ui-accent-soft) 50%, var(--ui-surface)); }
      .gradient { color: var(--ui-muted); background: linear-gradient(var(--ui-accent-soft), var(--ui-surface)); }
      .outer { background: var(--ui-accent-soft); .inner { color: var(--ui-muted); } }
    `
    expect(undeclaredPairs(css)).toEqual([])
  })
})
