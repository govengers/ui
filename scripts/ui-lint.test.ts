import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lintDirectories, lintSource } from './ui-lint'

const options = { page: false, strict: false, insideUi: true }

describe('ui-lint', () => {
  test('flags hex, px and font-family inside style blocks only', () => {
    const source = `<template><div style="color: #fff">#abc 12px</div></template>\n<style scoped>\n.a { color: #ff0000; }\n.b { padding: 12px 1px; border: 1px solid var(--ui-border); }\n.c { font-family: Inter; }\n</style>`
    const rules = lintSource('x.vue', source, options).map(finding => `${finding.rule}@${finding.line}`)
    expect(rules).toEqual(['UL-001@3', 'UL-002@4', 'UL-003@5'])
  })

  test('page rules: data-page, Page and PageHeader, data-action on submit and danger buttons', () => {
    const bad = `<template>\n<div>\n<Button type="submit">Save</Button>\n<Button variant="danger" data-action="deleteX">Delete</Button>\n</div>\n</template>`
    const rules = lintSource('pages/X/X.vue', bad, { ...options, page: true }).map(finding => finding.rule)
    expect(rules).toEqual(['UL-010', 'UL-011', 'UL-012'])
    const good = `<template>\n<Page data-page="x.list">\n<PageHeader title="X" />\n<Button type="submit" data-action="saveX">Save</Button>\n</Page>\n</template>`
    expect(lintSource('pages/X/X.vue', good, { ...options, page: true })).toEqual([])
  })

  test('a page finding names the line in the file, below a script block', () => {
    const page = `<script setup lang="ts">\nimport Page from '../../ui/Page/Page.vue'\n</script>\n\n<template>\n<Page data-page="x.edit">\n<PageHeader title="X" />\n<Button type="submit">Save</Button>\n</Page>\n</template>`
    expect(lintSource('pages/X/X.vue', page, { ...options, page: true }).map(finding => `${finding.rule}@${finding.line}`)).toEqual(['UL-012@8'])
  })

  test('a finding in a component .css file names its line in that file', () => {
    const root = mkdtempSync(join(tmpdir(), 'ui-lint-'))
    try {
      mkdirSync(join(root, 'ui', 'X'), { recursive: true })
      writeFileSync(join(root, 'ui', 'X', 'X.phone.css'), '/* X phone layout. */\n.a {\n  color: #fff;\n}\n')
      writeFileSync(join(root, 'ui', 'tokens.css'), ':root { --ui-x: #fff; }\n')
      expect(lintDirectories(root, ['ui'], { strict: false, uiDirectory: 'ui' }).map(finding => `${finding.file}:${finding.line} ${finding.rule}`)).toEqual([`${join('ui', 'X', 'X.phone.css')}:3 UL-001`])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('page rules see past nested slot templates', () => {
    const page = `<template>\n<AppShell bare>\n<template #brand><span>Logo</span></template>\n<Page data-page="auth.login">\n<PageHeader title="Sign in" />\n<template #actions><Button type="submit">Go</Button></template>\n</Page>\n</AppShell>\n</template>`
    expect(lintSource('pages/X/X.vue', page, { ...options, page: true }).map(finding => finding.rule)).toEqual(['UL-012'])
  })

  test('strict forbids style blocks outside ui', () => {
    const source = `<template><div /></template>\n<style scoped>\n.a { gap: var(--ui-space-2); }\n</style>`
    expect(lintSource('src/pages/X/X.vue', source, { page: false, strict: true, insideUi: false }).map(finding => finding.rule)).toEqual(['UL-020'])
    expect(lintSource('src/pages/X/X.vue', source, { page: false, strict: false, insideUi: false })).toEqual([])
  })

  test('comments are prose, not values', () => {
    expect(rules(`/* 16px on touch, #fff, rgb(0 0 0), 100vh, .a:hover { } */\n.a { gap: var(--ui-space-2); }`)).toEqual([])
  })

  test('quoted strings are prose, not values or braces', () => {
    expect(rules('.a::after { content: "16px #fff {"; }\n.b::after { content: \'}\'; }')).toEqual([])
    // Comment delimiters inside strings open no comment, so the colour between them is read.
    expect(rules('.a::before { content: "/*"; color: #fff; }\n.a::after { content: "*/"; }')).toEqual(['UL-001@3'])
  })

  test.each([
    ['UL-004 colour function', '.a { box-shadow: 0 1px 2px rgb(0 0 0 / 0.2); }', ['UL-004@3']],
    ['UL-004 oklch', '.a { color: OKLCH(70% 0.1 200); }', ['UL-004@3']],
    ['UL-004 token', '.a { box-shadow: var(--ui-shadow-md); }', []],
    ['UL-004 color-mix of tokens', '.a { background: color-mix(in srgb, var(--ui-x) 50%, var(--ui-y)); }', []],
    ['UL-005 rem', '.a { font-size: 0.875rem; }', ['UL-005@3']],
    ['UL-005 pt', '.a { font-size: 10pt; }', ['UL-005@3']],
    ['UL-005 token, em, %, inherit and the field floor', '.a { font-size: var(--ui-text-sm); }\n.b { font-size: 1.25em; }\n.c { font-size: 90%; }\n.d { font-size: inherit; }\n.e { font-size: max(var(--ui-field-text-min), 1em); }', []],
    ['UL-005 a custom property is not font-size', '.a { --x-font-size: 1rem; }', []],
    ['UL-005 a value on the next line', '.a {\n  font-size:\n    1rem;\n}', ['UL-005@4']],
    ['UL-005 a clamp() over several lines', '.a {\n  font-size: clamp(\n    var(--ui-text-sm),\n    2vw,\n    var(--ui-text-lg)\n  );\n}', ['UL-005@4']],
    ['UL-005 the font shorthand', '.a { font: 600 1rem/1.2 var(--ui-font-sans); }', ['UL-005@3']],
    ['UL-005 the font shorthand with tokens or inherit', '.a { font: inherit; }\n.b { font: var(--ui-weight-medium) var(--ui-text-sm)/1.5 var(--ui-font-sans); }', []],
    ['UL-006 vh', '.a { min-height: 100vh; }', ['UL-006@3']],
    ['UL-006 dvh, svh and vw', '.a { min-height: 100dvh; height: 50svh; width: 90vw; }', []],
  ])('%s', (_name, css, expected) => {
    expect(rules(css)).toEqual(expected)
  })

  test.each([
    ['bare', '.a:hover { color: var(--ui-ink); }', ['UL-007@3']],
    ['guarded', '@media (hover: hover) {\n  .a:hover { color: var(--ui-ink); }\n}', []],
    ['guarded with a second feature', '@media (hover: hover) and (pointer: fine) { .a:hover { color: var(--ui-ink); } }', []],
    ['any-hover is not the guard', '@media (any-hover: hover) { .a:hover { color: var(--ui-ink); } }', ['UL-007@3']],
    ['inside a container query only', '@container (max-width: 48rem) {\n  .a { gap: 0; }\n  .a:hover { color: var(--ui-ink); }\n}', ['UL-007@5']],
    ['guarded inside a container query', '@container (max-width: 48rem) {\n  @media (hover: hover) { .a:hover { color: var(--ui-ink); } }\n}', []],
    ['container query inside the guard', '@media (hover: hover) {\n  @container (max-width: 48rem) { .a:hover { color: var(--ui-ink); } }\n}', []],
    ['a guard that closed before', '@media (hover: hover) { .a:hover { color: var(--ui-ink); } }\n.b:hover { color: var(--ui-ink); }', ['UL-007@4']],
    ['nested rule', '.a {\n  color: var(--ui-ink-2);\n  &:hover { color: var(--ui-ink); }\n}', ['UL-007@5']],
    ['a list that joins hover', '.a:focus-visible,\n.a:hover { color: var(--ui-ink); }', ['UL-007@4']],
    ['focus-visible only', '.a:focus-visible, .a[aria-pressed="true"] { color: var(--ui-ink); }', []],
    ['a negated guard', '@media not (hover: hover) { .a:hover { color: var(--ui-ink); } }', ['UL-007@3']],
    ['a comma branch without the feature', '@media (hover: hover), (pointer: coarse) { .a:hover { color: var(--ui-ink); } }', ['UL-007@3']],
    ['an or branch without the feature', '@media (hover: hover) or (pointer: coarse) { .a:hover { color: var(--ui-ink); } }', ['UL-007@3']],
    ['every comma branch holds the feature', '@media screen and (hover: hover), print and (hover: hover) { .a:hover { color: var(--ui-ink); } }', []],
    ['a quoted brace inside the guard', '@media (hover: hover) {\n  .x::after { content: "{"; }\n}\n.a:hover { color: var(--ui-ink); }', ['UL-007@6']],
    ['a quoted closing brace inside the guard', '@media (hover: hover) {\n  .x::after { content: "}"; }\n  .a:hover { color: var(--ui-ink); }\n}', []],
  ])('UL-007 %s', (_name, css, expected) => {
    expect(rules(css)).toEqual(expected)
  })

  test.each([
    ['icon only, no label', '<Button variant="ghost">\n  <template #icon><Icon name="x" /></template>\n</Button>', ['UL-013@2']],
    ['icon only, aria-label only', '<Button aria-label="Close"><template #icon><Icon name="x" /></template></Button>', ['UL-013@2']],
    ['icon only, label', '<Button label="Close"><template #icon><Icon name="x" /></template></Button>', []],
    ['icon only, bound label', `<Button :label="t('ui.close')"><template #icon><Icon name="x" /></template></Button>`, []],
    ['icon and text', '<Button><template #icon><Icon name="plus" /></template>Add</Button>', []],
    ['text only', '<Button type="submit">Save</Button>', []],
    ['a self-closing Button before an icon-only one', '<Button label="A" />\n<Button size="sm"><template #icon><Icon name="x" /></template></Button>', ['UL-013@3']],
    ['a comment beside the icon', '<Button>\n  <!-- close the panel -->\n  <template #icon><Icon name="x" /></template>\n</Button>', ['UL-013@2']],
    ['a commented-out Button', '<!-- <Button><template #icon><Icon name="x" /></template></Button> -->\n<Button>Save</Button>', []],
    ['a nested template in the icon slot', '<Button>\n  <template #icon>\n    <template v-if="busy"><Icon name="loader" /></template>\n    <Icon v-else name="x" />\n  </template>\n</Button>', ['UL-013@2']],
    ['a nested template in the icon slot, label', '<Button label="Close">\n  <template #icon>\n    <template v-if="busy"><Icon name="loader" /></template>\n    <Icon v-else name="x" />\n  </template>\n</Button>', []],
    ['v-slot:icon', '<Button><template v-slot:icon><Icon name="x" /></template></Button>', ['UL-013@2']],
    ['label inside another attribute', '<Button title="x label=y"><template #icon><Icon name="x" /></template></Button>', ['UL-013@2']],
    ['a spaced bound label', '<Button :label = "t(\'ui.close\')"><template #icon><Icon name="x" /></template></Button>', []],
  ])('UL-013 %s', (_name, markup, expected) => {
    const source = `<template>\n${markup}\n</template>`
    expect(lintSource('ui/X/X.demo.vue', source, options).map(finding => `${finding.rule}@${finding.line}`)).toEqual(expected)
  })
})

/** Rules found in a style block whose first rule sits on line 3. */
function rules(css: string): string[] {
  return lintSource('x.vue', `<template><div /></template>\n<style scoped>\n${css}\n</style>`, options).map(finding => `${finding.rule}@${finding.line}`)
}
