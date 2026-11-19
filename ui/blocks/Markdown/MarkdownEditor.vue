<script setup lang="ts" generic="Params extends object, Response">
// MarkdownEditor: a Textarea with a format toolbar, a Write and Preview switch (MarkdownView),
// images pasted, dropped or picked uploaded through the pair's Client.upload, and an @ mention
// list fed by the page. The text logic is in editing.ts; this file wires it to the textarea.
import { computed, nextTick, ref, useAttrs, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UploadTarget } from '@/api/runtime'
import { useLivePair } from '@/api/vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import Tabs from '../../Tabs/Tabs.vue'
import Textarea from '../../Textarea/Textarea.vue'
import type { IconName } from '../../Icon/icons'
import { formatBytes } from '../../format'
import MarkdownView from './MarkdownView.vue'
import { applyReplacement, completeMention, format, imageMarkdown, mentionAt, replacePlaceholder, uploadPlaceholder, type Format, type Replacement } from './editing'

export interface MentionOption {
  /** What is inserted after the @, e.g. a user name without spaces. */
  value: string
  label: string
  hint?: string | undefined
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** The textarea's name (D23), the field the agent fills. */
  name: string
  rows?: number | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
  /** The upload descriptor, e.g. `uploads.uploadFile`; its image content types enable images. */
  upload?: UploadTarget<Params, Response, string> | undefined
  uploadParams?: Params | undefined
  /** The URL an uploaded image is shown from, out of the upload's answer; required with `upload`. */
  imageUrl?: ((response: Response) => string) | undefined
  /** Bytes per image. */
  maxSize?: number | undefined
  /** Suggestions for the text after an @; none switches mentions off. */
  mentions?: ((query: string) => MentionOption[] | Promise<MentionOption[]>) | undefined
}>(), { rows: 6 })

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ uploading: [pending: number] }>()
const { t, locale } = useI18n()
const attrs = useAttrs()
const pair = useLivePair()
const uid = useId()
const mode = ref<'write' | 'preview'>('write')
const area = ref<InstanceType<typeof Textarea> | null>(null)
const picker = ref<HTMLInputElement | null>(null)
const problems = ref<string[]>([])
let lastUpload = 0
// Uploads in flight: their placeholders are in the model, so a page must not save meanwhile.
let pending = 0
function track(change: number): void {
  pending += change
  emit('uploading', pending)
}

const textarea = (): HTMLTextAreaElement | null => (area.value?.$el as HTMLTextAreaElement | undefined) ?? null
const passed = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')))

const apple = /Mac|iPhone|iPad/.test(navigator.userAgent)
/** The shortcut as the keyboard labels it: the command sign on Apple platforms, else Ctrl in the locale's word. */
const shortcut = (key: string): string => (apple ? `⌘${key}` : `${t('ui.keyCtrl')}+${key}`)
/** `key`: the letter that formats with Ctrl or Cmd (onKeydown), named in the label and in aria-keyshortcuts. */
const tools: { format: Format; icon: IconName; label: string; key?: string }[] = [
  { format: 'bold', icon: 'bold', label: 'ui.bold', key: 'B' },
  { format: 'italic', icon: 'italic', label: 'ui.italic', key: 'I' },
  { format: 'heading', icon: 'heading', label: 'ui.heading' },
  { format: 'link', icon: 'link', label: 'ui.link' },
  { format: 'code', icon: 'code', label: 'ui.code' },
  { format: 'quote', icon: 'quote', label: 'ui.quote' },
  { format: 'bullets', icon: 'list', label: 'ui.bulletList' },
  { format: 'numbers', icon: 'list-ordered', label: 'ui.numberedList' },
  { format: 'tasks', icon: 'list-checks', label: 'ui.taskList' },
]
const imageTypes = computed(() => props.upload?.contentTypes.filter((type) => type.startsWith('image/')) ?? [])

/** Applies an edit through insertText, so the browser's undo history keeps it. */
function replace(edit: Replacement): void {
  const element = textarea()
  if (element === null) {
    model.value = applyReplacement(model.value, edit)
    return
  }
  element.focus()
  element.setSelectionRange(edit.from, edit.to)
  if (edit.insert === '' || !document.execCommand('insertText', false, edit.insert)) {
    element.setRangeText(edit.insert, edit.from, edit.to)
    model.value = element.value
  }
  element.setSelectionRange(edit.start, edit.end)
}

function applyFormat(kind: Format): void {
  const element = textarea()
  if (element === null || props.disabled) return
  replace(format(element.value, element.selectionStart, element.selectionEnd, kind))
}

// Mentions: the list follows the caret; only the answer to the newest query counts.

const suggestions = ref<MentionOption[]>([])
const active = ref(0)
let query = 0

async function updateMentions(): Promise<void> {
  const element = textarea()
  const mention = element && props.mentions ? mentionAt(element.value, element.selectionStart) : null
  const asked = ++query
  if (mention === null || props.mentions === undefined) {
    suggestions.value = []
    return
  }
  let found: MentionOption[]
  try {
    found = await props.mentions(mention.query)
  } catch {
    found = [] // offline or refused: no suggestions, the text stays as typed
  }
  // A newer query, a blur or Escape outdates this answer.
  if (asked !== query || document.activeElement !== element) return
  suggestions.value = found.slice(0, 8)
  active.value = 0
}

function dismissMentions(): void {
  query++
  suggestions.value = []
}

function choose(option: MentionOption): void {
  const element = textarea()
  const edit = element && completeMention(element.value, element.selectionStart, option.value)
  suggestions.value = []
  if (edit) replace(edit)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.isComposing) return
  const count = suggestions.value.length
  if (count > 0) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      active.value = (active.value + (event.key === 'ArrowDown' ? 1 : count - 1)) % count
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      choose(suggestions.value[active.value]!)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      dismissMentions()
    }
    return
  }
  if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return
  const tool = tools.find((candidate) => candidate.key?.toLowerCase() === event.key.toLowerCase())
  if (tool) {
    event.preventDefault()
    applyFormat(tool.format)
  }
}

// Images: a placeholder at the caret at once, swapped for the image when the upload answers.

function images(files: Iterable<File>): File[] {
  return [...files].filter((file) => imageTypes.value.includes(file.type))
}

/** Uploads the files of an accepted image type; the others are named in the problems. */
function addImages(files: File[]): void {
  if (files.length === 0 || props.upload === undefined) return
  problems.value = []
  for (const file of files) {
    if (!imageTypes.value.includes(file.type)) {
      problems.value.push(t('ui.notAnImage', { name: file.name }))
      continue
    }
    if (props.maxSize !== undefined && file.size > props.maxSize) {
      problems.value.push(t('ui.fileTooLarge', { name: file.name, max: formatBytes(props.maxSize, locale.value) }))
      continue
    }
    const placeholder = uploadPlaceholder(file.name, ++lastUpload)
    const element = textarea()
    const at = element?.selectionEnd ?? model.value.length
    replace({ from: at, to: at, insert: placeholder, start: at + placeholder.length, end: at + placeholder.length })
    void send(file, placeholder)
  }
}

async function send(file: File, placeholder: string): Promise<void> {
  track(1)
  try {
    if (props.upload === undefined || props.imageUrl === undefined) throw new Error('MarkdownEditor: upload needs imageUrl')
    const response = await pair.value.client.upload(props.upload, props.uploadParams ?? ({} as Params), file, { multipart: true, filename: file.name })
    swap(placeholder, imageMarkdown(file.name, props.imageUrl(response)))
  } catch {
    swap(placeholder, '')
    problems.value.push(t('ui.uploadFailed', { name: file.name }))
  } finally {
    track(-1)
  }
}

/** Swaps text in the model and keeps the caret where the user left it. */
function swap(placeholder: string, final: string): void {
  const index = model.value.indexOf(placeholder)
  if (index < 0) return
  const element = textarea()
  const focused = element !== null && document.activeElement === element
  const [start, end] = element ? [element.selectionStart, element.selectionEnd] : [0, 0]
  const shift = final.length - placeholder.length
  model.value = replacePlaceholder(model.value, placeholder, final)
  if (focused) void nextTick(() => element.setSelectionRange(start > index ? start + shift : start, end > index ? end + shift : end))
}

function onPaste(event: ClipboardEvent): void {
  const files = images(event.clipboardData?.files ?? [])
  if (files.length === 0) return
  event.preventDefault()
  addImages(files)
}

const carriesFiles = (event: DragEvent): boolean => props.upload !== undefined && (event.dataTransfer?.types ?? []).includes('Files')

function onDragover(event: DragEvent): void {
  if (carriesFiles(event)) event.preventDefault()
}

// Every file drop is ours once we take files: the browser's own drop would open the file in the
// tab and lose the text. Text drags keep the textarea's native drop.
function onDrop(event: DragEvent): void {
  if (!carriesFiles(event)) return
  event.preventDefault()
  addImages([...(event.dataTransfer?.files ?? [])])
}

function onPick(): void {
  addImages([...(picker.value?.files ?? [])])
  if (picker.value) picker.value.value = ''
}

const modes = computed(() => [{ value: 'write', label: t('ui.write') }, { value: 'preview', label: t('ui.preview') }])
</script>

<template>
  <div class="ui-markdown-editor" :class="attrs.class" :style="attrs.style as never" :data-state="disabled ? 'disabled' : undefined">
    <div class="ui-markdown-editor__bar">
      <Tabs :model-value="mode" :items="modes" size="sm" :label="t('ui.editorMode')" @update:model-value="(value) => (mode = value as 'write' | 'preview')" />
      <div v-show="mode === 'write'" role="group" class="ui-markdown-editor__tools" :aria-label="t('ui.formatting')">
        <Button
          v-for="tool in tools"
          :key="tool.format"
          variant="ghost"
          size="sm"
          :label="tool.key ? `${t(tool.label)} (${shortcut(tool.key)})` : t(tool.label)"
          :aria-keyshortcuts="tool.key ? `Control+${tool.key} Meta+${tool.key}` : undefined"
          :disabled="disabled"
          @mousedown.prevent
          @click="applyFormat(tool.format)"
        >
          <template #icon><Icon :name="tool.icon" /></template>
        </Button>
        <template v-if="upload && imageTypes.length > 0">
          <Button variant="ghost" size="sm" :label="t('ui.insertImage')" :disabled="disabled" @click="picker?.click()">
            <template #icon><Icon name="image" /></template>
          </Button>
          <input ref="picker" type="file" hidden multiple :accept="imageTypes.join(',')" @change="onPick">
        </template>
      </div>
    </div>
    <div v-show="mode === 'write'" class="ui-markdown-editor__write">
      <Textarea
        ref="area"
        v-model="model"
        v-bind="passed"
        :name="name"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-autocomplete="mentions ? 'list' : undefined"
        :aria-controls="suggestions.length > 0 ? `${uid}-mentions` : undefined"
        :aria-activedescendant="suggestions.length > 0 ? `${uid}-mention-${active}` : undefined"
        @keydown="onKeydown"
        @input="updateMentions"
        @click="updateMentions"
        @keyup.left.right.home.end="updateMentions"
        @blur="dismissMentions"
        @paste="onPaste"
        @dragover="onDragover"
        @drop="onDrop"
      />
      <ul v-if="suggestions.length > 0" :id="`${uid}-mentions`" role="listbox" class="ui-markdown-editor__mentions" :aria-label="t('ui.mentions')">
        <li
          v-for="(option, index) in suggestions"
          :id="`${uid}-mention-${index}`"
          :key="option.value"
          role="option"
          class="ui-markdown-editor__mention"
          :aria-selected="index === active"
          @mousedown.prevent="choose(option)"
        >
          <span>{{ option.label }}</span><span v-if="option.hint" class="ui-markdown-editor__hint">{{ option.hint }}</span>
        </li>
      </ul>
    </div>
    <div v-if="mode === 'preview'" class="ui-markdown-editor__preview">
      <MarkdownView v-if="model.trim() !== ''" :source="model" />
      <p v-else class="ui-markdown-editor__empty">{{ t('ui.nothingToPreview') }}</p>
    </div>
    <div v-if="problems.length > 0" class="ui-markdown-editor__problems" role="alert">
      <p v-for="problem in problems" :key="problem">{{ problem }}</p>
    </div>
  </div>
</template>

<style scoped>
.ui-markdown-editor { display: flex; flex-direction: column; gap: var(--ui-space-2); min-width: 0; }
.ui-markdown-editor__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ui-space-2); }
.ui-markdown-editor__tools { display: flex; flex-wrap: wrap; gap: var(--ui-space-1); }
.ui-markdown-editor__write { position: relative; }
.ui-markdown-editor__mentions {
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 100%;
  z-index: var(--ui-z-overlay);
  min-width: 14rem;
  max-width: 100%;
  margin: var(--ui-space-1) 0 0;
  padding: var(--ui-space-1);
  list-style: none;
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-control);
  box-shadow: var(--ui-shadow-md);
}
.ui-markdown-editor__mention {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-3);
  min-height: var(--ui-control-h);
  padding: 0 var(--ui-space-3);
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
}
.ui-markdown-editor__mention[aria-selected="true"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-markdown-editor__hint { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.ui-markdown-editor__mention[aria-selected="true"] .ui-markdown-editor__hint { color: inherit; }
.ui-markdown-editor__preview {
  min-height: calc(var(--ui-control-h) * 3);
  padding: var(--ui-space-2) var(--ui-control-px);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-control);
  background: var(--ui-surface);
}
.ui-markdown-editor__empty { color: var(--ui-muted); }
.ui-markdown-editor__problems { color: var(--ui-danger); font-size: var(--ui-text-sm); }
</style>
