// MarkdownEditor mounted (D59): file drops, uploads in flight and mention answers.
import { afterEach, describe, expect, test } from 'bun:test'
import { ref } from 'vue'
import { uploads, type FileItem } from '../../../demo/src/fake/api'
import { mount, settle, type Mounted } from '../../../scripts/test/mount'
import MarkdownEditor, { type MentionOption } from './MarkdownEditor.vue'

let editor: Mounted | undefined
afterEach(() => {
  editor?.unmount()
  editor = undefined
})

const text = ref('')
const uploading: number[] = []
function mountEditor(mentions?: (query: string) => Promise<MentionOption[]>): Mounted {
  text.value = 'draft'
  uploading.length = 0
  editor = mount(MarkdownEditor, () => ({
    name: 'comment', modelValue: text.value, 'onUpdate:modelValue': (value: string) => (text.value = value),
    upload: uploads.uploadFile, imageUrl: (file: FileItem) => file.url ?? '', mentions,
    onUploading: (pending: number) => uploading.push(pending),
  }))
  return editor
}

const area = (root: HTMLElement): HTMLTextAreaElement => root.querySelector('textarea') as HTMLTextAreaElement

/** A drop of files, as the browser sends it (jsdom has no DataTransfer). */
function drop(target: Element, files: File[]): Event {
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'], files } })
  target.dispatchEvent(event)
  return event
}

describe('MarkdownEditor file drop', () => {
  test('a dropped file of a type it does not take is refused and never left to the browser', async () => {
    const { root } = mountEditor()
    await settle(1)
    const event = drop(area(root), [new File(['x'], 'anim.gif', { type: 'image/gif' }), new File(['x'], 'doc.pdf', { type: 'application/pdf' })])
    await settle(1)
    expect(event.defaultPrevented).toBe(true)
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('anim.gif is not an image type')
    expect(text.value).toBe('draft')
  })

  test('an accepted image is uploaded and the page hears the uploads in flight', async () => {
    const { root } = mountEditor()
    await settle(1)
    const event = drop(area(root), [new File(['png'], 'shot.png', { type: 'image/png' })])
    expect(event.defaultPrevented).toBe(true)
    expect(text.value).toContain('![Uploading shot.png...]')
    expect(uploading).toEqual([1])
    await settle(30)
    expect(uploading.at(-1)).toBe(0)
    expect(text.value).toContain('![shot.png](')
  })
})

describe('MarkdownEditor mentions', () => {
  test('a rejecting provider closes the suggestions', async () => {
    let fail = false
    const { root } = mountEditor(async () => {
      if (fail) throw new Error('offline')
      return [{ value: 'ada', label: 'Ada' }]
    })
    const textarea = area(root)
    textarea.focus()
    textarea.value = 'hi @a'
    textarea.setSelectionRange(5, 5)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await settle(1)
    expect(root.querySelectorAll('[role="option"]').length).toBe(1)
    fail = true
    textarea.value = 'hi @ad'
    textarea.setSelectionRange(6, 6)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await settle(1)
    expect(root.querySelectorAll('[role="option"]').length).toBe(0)
  })

  test('an answer that arrives after the blur does not reopen the suggestions', async () => {
    let answer: (options: MentionOption[]) => void = () => undefined
    const { root } = mountEditor(() => new Promise((resolve) => (answer = resolve)))
    const textarea = area(root)
    textarea.focus()
    textarea.value = '@a'
    textarea.setSelectionRange(2, 2)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.blur()
    answer([{ value: 'ada', label: 'Ada' }])
    await settle(1)
    expect(root.querySelectorAll('[role="option"]').length).toBe(0)
  })
})
