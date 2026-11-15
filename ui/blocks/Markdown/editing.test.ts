import { describe, expect, test } from 'bun:test'
import { applyReplacement, completeMention, format, imageMarkdown, mentionAt, replacePlaceholder, uploadPlaceholder, type Format } from './editing'

/** Runs a format on `text` where { and } mark the selection; answers the result with the new selection marked. */
function run(marked: string, kind: Format): string {
  const start = marked.indexOf('{')
  const end = marked.indexOf('}') - 1
  const text = marked.replace('{', '').replace('}', '')
  const edit = format(text, start, end, kind)
  const out = applyReplacement(text, edit)
  return `${out.slice(0, edit.start)}{${out.slice(edit.start, edit.end)}}${out.slice(edit.end)}`
}

describe('format', () => {
  test('wraps and unwraps inline marks', () => {
    expect(run('a {word} b', 'bold')).toBe('a **{word}** b')
    expect(run('a **{word}** b', 'bold')).toBe('a {word} b')
    expect(run('a {} b', 'italic')).toBe('a _{}_ b')
    expect(run('x {y} z', 'code')).toBe('x `{y}` z')
  })

  test('code over several lines becomes a fenced block', () => {
    expect(run('{a\nb}', 'code')).toBe('```\n{a\nb}\n```')
  })

  test('link selects the URL to type over', () => {
    expect(run('see {docs}', 'link')).toBe('see [docs]({https://})')
    expect(run('{}', 'link')).toBe('[link]({https://})')
  })

  test('prefixes every touched line and numbers them', () => {
    expect(run('{one\ntwo}', 'bullets')).toBe('{- one\n- two}')
    expect(run('{one\ntwo}', 'numbers')).toBe('{1. one\n2. two}')
    expect(run('{one}', 'tasks')).toBe('{- [ ] one}')
    expect(run('intro\nti{}tle', 'heading')).toBe('intro\n## ti{}tle')
  })

  test('takes prefixes off when every line has one', () => {
    expect(run('{- one\n- two}', 'bullets')).toBe('{one\ntwo}')
    expect(run('> quo{}ted', 'quote')).toBe('quo{}ted')
    expect(run('{- [ ] one}', 'tasks')).toBe('{one}')
  })

  test('a task line is not a bullet line', () => {
    expect(run('{- [ ] one}', 'bullets')).toBe('{- - [ ] one}')
  })

  test('a selection ending at a line start leaves the next line alone', () => {
    expect(run('{a\n}b', 'quote')).toBe('{> a}\nb')
  })
})

describe('mentions', () => {
  test('finds the mention under the caret', () => {
    expect(mentionAt('hi @ad', 6)).toEqual({ start: 3, query: 'ad' })
    expect(mentionAt('@', 1)).toEqual({ start: 0, query: '' })
    expect(mentionAt('mail a@b', 8)).toBeNull()
    expect(mentionAt('hi @ada now', 11)).toBeNull()
  })

  test('completes it with a trailing space', () => {
    const edit = completeMention('hi @ad', 6, 'ada')!
    expect(applyReplacement('hi @ad', edit)).toBe('hi @ada ')
    expect(edit.start).toBe(8)
    expect(completeMention('no mention', 10, 'x')).toBeNull()
  })
})

describe('uploads', () => {
  test('placeholder swaps for the image; a deleted one stays deleted', () => {
    const holder = uploadPlaceholder('shot [1].png', 3)
    expect(holder).toBe('![Uploading shot 1.png...](uploading:3)')
    expect(replacePlaceholder(`a ${holder} b`, holder, imageMarkdown('shot.png', '/files/a b)'))).toBe('a ![shot.png](/files/a%20b%29) b')
    expect(replacePlaceholder('gone', holder, 'x')).toBe('gone')
  })
})
