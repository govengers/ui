// MarkdownEditor mounted (D69): file drops, uploads in flight, mention answers and the format keys.
import { afterEach, describe, expect, test } from 'bun:test'
import { defineComponent, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploads, type FileItem } from '../../../demo/src/fake/api'
import { key, mount, settle, type Mounted } from '../../../scripts/test/mount'
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

describe('MarkdownEditor format keys', () => {
  /** Selects all of the textarea and presses `name` with the modifiers. */
  function press(root: HTMLElement, name: string, init: KeyboardEventInit): KeyboardEvent {
    const textarea = area(root)
    textarea.focus()
    textarea.setSelectionRange(0, textarea.value.length)
    return key(textarea, name, init)
  }

  test('bold and italic name their keys in the label and in aria-keyshortcuts', async () => {
    const { root } = mountEditor()
    await settle(1)
    expect(root.querySelector('button[aria-label="Bold (Ctrl+B)"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+B Meta+B')
    expect(root.querySelector('button[aria-label="Italic (Ctrl+I)"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+I Meta+I')
    expect(root.querySelector('button[aria-label="Heading"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
  })

  test('the key is named in the locale (Strg in German) and by the command sign on Apple platforms', async () => {
    const German = defineComponent({
      setup() {
        useI18n().locale.value = 'de'
        return () => h(MarkdownEditor, { name: 'comment', modelValue: '' })
      },
    })
    const german = mount(German)
    await settle(1)
    expect(german.root.querySelector('button[aria-label="Fett (Strg+B)"]')).not.toBeNull()
    german.unmount()
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)' })
    try {
      const { root } = mount(MarkdownEditor, () => ({ name: 'comment', modelValue: '' }))
      await settle(1)
      expect(root.querySelector('button[aria-label="Bold (⌘B)"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+B Meta+B')
    } finally {
      delete (navigator as unknown as Record<string, unknown>)['userAgent']
    }
  })

  test('Ctrl+B and Cmd+I wrap the selection, also under Caps Lock', async () => {
    const { root } = mountEditor()
    await settle(1)
    expect(press(root, 'b', { ctrlKey: true }).defaultPrevented).toBe(true)
    await settle(1)
    expect(text.value).toBe('**draft**')
    press(root, 'i', { metaKey: true })
    await settle(1)
    expect(text.value).toBe('_**draft**_')
    press(root, 'B', { ctrlKey: true })
    await settle(1)
    expect(text.value).toBe('**_**draft**_**')
  })

  test('Shift, Alt or no modifier leave the text alone', async () => {
    const { root } = mountEditor()
    await settle(1)
    for (const init of [{ ctrlKey: true, shiftKey: true }, { metaKey: true, altKey: true }, {}]) {
      expect(press(root, 'b', init).defaultPrevented).toBe(false)
    }
    await settle(1)
    expect(text.value).toBe('draft')
  })
})
