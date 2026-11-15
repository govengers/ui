// The text logic of MarkdownEditor: toolbar formats, the @ mention under the caret, upload
// placeholders. Every edit is a Replacement (one range of the old text and the new selection), so
// the editor can apply it through the textarea's own undo history.

export type Format = 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'quote' | 'bullets' | 'numbers' | 'tasks'

/** Replace `from..to` of the text with `insert`, then select `start..end` of the new text. */
export interface Replacement {
  from: number
  to: number
  insert: string
  start: number
  end: number
}

export function applyReplacement(text: string, edit: Replacement): string {
  return text.slice(0, edit.from) + edit.insert + text.slice(edit.to)
}

const marks: Partial<Record<Format, string>> = { bold: '**', italic: '_', code: '`' }
const prefixes: Partial<Record<Format, (index: number) => string>> = {
  heading: () => '## ',
  quote: () => '> ',
  bullets: () => '- ',
  numbers: (index) => `${index + 1}. `,
  tasks: () => '- [ ] ',
}
const anyPrefix: Partial<Record<Format, RegExp>> = {
  heading: /^#{1,6} /,
  quote: /^> ?/,
  bullets: /^[-*+] (?!\[[ xX]\] )/,
  numbers: /^\d+[.)] /,
  tasks: /^[-*+] \[[ xX]\] /,
}

/** The edit a toolbar button makes on the selection `start..end`. */
export function format(text: string, start: number, end: number, kind: Format): Replacement {
  const selected = text.slice(start, end)
  if (kind === 'link') {
    const label = selected || 'link'
    const insert = `[${label}](https://)`
    const url = start + label.length + 3
    return { from: start, to: end, insert, start: url, end: url + 'https://'.length }
  }
  if (kind === 'code' && selected.includes('\n')) {
    const insert = `\`\`\`\n${selected}\n\`\`\``
    return { from: start, to: end, insert, start: start + 4, end: start + 4 + selected.length }
  }
  const mark = marks[kind]
  if (mark !== undefined) return wrap(text, start, end, mark)
  return prefixLines(text, start, end, kind)
}

/** Wraps the selection in a mark, or takes the mark off when it is wrapped already. */
function wrap(text: string, start: number, end: number, mark: string): Replacement {
  const n = mark.length
  if (text.slice(start - n, start) === mark && text.slice(end, end + n) === mark) {
    return { from: start - n, to: end + n, insert: text.slice(start, end), start: start - n, end: end - n }
  }
  return { from: start, to: end, insert: mark + text.slice(start, end) + mark, start: start + n, end: end + n }
}

/** Prefixes every line the selection touches, or takes the prefix off when every line has it. */
function prefixLines(text: string, start: number, end: number, kind: Format): Replacement {
  const from = text.lastIndexOf('\n', start - 1) + 1
  const lineEnd = text.indexOf('\n', end > start && text[end - 1] === '\n' ? end - 1 : end)
  const to = lineEnd < 0 ? text.length : lineEnd
  const lines = text.slice(from, to).split('\n')
  const pattern = anyPrefix[kind] as RegExp
  const prefix = prefixes[kind] as (index: number) => string
  const remove = lines.every((line) => pattern.test(line))
  const insert = lines.map((line, index) => (remove ? line.replace(pattern, '') : prefix(index) + line)).join('\n')
  // An empty selection keeps the caret on its text; a selection covers the changed lines.
  if (start === end) {
    const shift = remove ? -(lines[0]?.match(pattern)?.[0].length ?? 0) : prefix(0).length
    const caret = Math.max(from, start + shift)
    return { from, to, insert, start: caret, end: caret }
  }
  return { from, to, insert, start: from, end: from + insert.length }
}

/** The @ mention the caret is in: its `@` position and the text typed after it. */
export function mentionAt(text: string, caret: number): { start: number; query: string } | null {
  const match = /(^|\s)@([\p{L}\p{N}._-]*)$/u.exec(text.slice(0, caret))
  if (!match) return null
  return { start: caret - (match[2]?.length ?? 0) - 1, query: match[2] ?? '' }
}

/** Replaces the mention under the caret with `@value ` and puts the caret after it. */
export function completeMention(text: string, caret: number, value: string): Replacement | null {
  const mention = mentionAt(text, caret)
  if (!mention) return null
  const insert = `@${value} `
  const after = mention.start + insert.length
  return { from: mention.start, to: caret, insert, start: after, end: after }
}

/** The markdown of an image; brackets in the name are dropped so the alt text cannot end early. */
export function imageMarkdown(name: string, url: string): string {
  return `![${name.replace(/[[\]]/g, '')}](${url.replace(/[\s()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)})`
}

/** The text an upload holds its place with until it finishes. */
export function uploadPlaceholder(name: string, key: number): string {
  return `![Uploading ${name.replace(/[[\]]/g, '')}...](uploading:${key})`
}

/** Swaps the placeholder for the final text; a placeholder the user deleted stays deleted. */
export function replacePlaceholder(text: string, placeholder: string, final: string): string {
  return text.includes(placeholder) ? text.replace(placeholder, () => final) : text
}
