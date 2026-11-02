import { describe, expect, test } from 'bun:test'
import { lintSource } from './ui-lint'

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

  test('page rules see past nested slot templates', () => {
    const page = `<template>\n<AppShell bare>\n<template #brand><span>Logo</span></template>\n<Page data-page="auth.login">\n<PageHeader title="Sign in" />\n<template #actions><Button type="submit">Go</Button></template>\n</Page>\n</AppShell>\n</template>`
    expect(lintSource('pages/X/X.vue', page, { ...options, page: true }).map(finding => finding.rule)).toEqual(['UL-012'])
  })

  test('strict forbids style blocks outside ui', () => {
    const source = `<template><div /></template>\n<style scoped>\n.a { gap: var(--ui-space-2); }\n</style>`
    expect(lintSource('src/pages/X/X.vue', source, { page: false, strict: true, insideUi: false }).map(finding => finding.rule)).toEqual(['UL-020'])
    expect(lintSource('src/pages/X/X.vue', source, { page: false, strict: false, insideUi: false })).toEqual([])
  })
})
