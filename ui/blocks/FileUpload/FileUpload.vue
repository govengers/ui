<script setup lang="ts" generic="Params extends object, Response, Query extends object, Row extends UploadRow">
// FileUpload: the dropzone (FileDropzone) and the list of files, through the pair's
// Client.upload (D17, multipart with the file name). Client.upload reports no progress (fetch);
// with `files` the server's live rows show it (status 'uploading' with progress 0..100), else an
// indeterminate bar runs until the answer. fileUpload.ts merges the two lists.
import { computed, reactive, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError, type ListResponse, type LiveTarget, type MutationTarget, type UploadTarget } from '@/api/runtime'
import { useLiveList, useLivePair, type UseLiveListOptions } from '@/api/vue'
import Badge from '../../Badge/Badge.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import { formatBytes } from '../../format'
import FileDropzone from './FileDropzone.vue'
import { entriesOf, replaceable, type Entry, type Upload, type UploadRow } from './fileUpload'

const props = defineProps<{
  /** The upload descriptor, e.g. `uploads.uploadFile`; its content types are the picker's `accept`. */
  upload: UploadTarget<Params, Response, string>
  params?: Params | undefined
  /** The live list of uploaded files: its rows, progress included, are what the list shows. Read once. */
  files?: LiveTarget<Query, ListResponse<Row>> | undefined
  /** The filter document of the `files` read, e.g. the files of one customer. Read once. */
  filter?: unknown
  /** Bytes per file. */
  maxSize?: number | undefined
  /** Files in the list, uploading included; 1 makes the picker single. */
  maxFiles?: number | undefined
  /** Deletes an uploaded file by `{ id }`; without it uploaded files have no remove button. */
  remove?: MutationTarget<{ id: string }, undefined, unknown> | undefined
  /** The file input's name (D23), the field the agent sets. */
  name: string
}>()

const emit = defineEmits<{ uploaded: [response: Response] }>()

const { t, locale } = useI18n()
const pair = useLivePair()
const uid = useId()
const list = props.files === undefined ? undefined : useLiveList(props.files, (props.filter === undefined ? {} : { filter: props.filter }) as UseLiveListOptions<Query>)
const uploads = reactive<Upload[]>([])
const problems = ref<string[]>([])
/** Files dropped from the list without a `remove` call: a replaced one. */
const hidden = reactive(new Set<string>())
let lastKey = 0

const accept = computed(() => props.upload.contentTypes.join(','))
const bytes = (size: number): string => formatBytes(size, locale.value)

const entries = computed(() => entriesOf(uploads, list?.items.value).filter((entry) => entry.id === undefined || !hidden.has(entry.id)))

function badge(status: string): { variant: 'accent' | 'success' | 'danger' | 'neutral'; label: string } {
  if (status === 'uploading') return { variant: 'accent', label: t('ui.uploading') }
  if (status === 'ready') return { variant: 'success', label: t('ui.ready') }
  if (status === 'failed') return { variant: 'danger', label: t('ui.failed') }
  return { variant: 'neutral', label: status }
}

/** Checks size and count, then uploads what passes; the rest is said inline. */
function add(chosen: Iterable<File>): void {
  const found: string[] = []
  // One file only: a new pick replaces the finished one, which goes once the new one is in.
  const replacing = replaceable(entries.value, props.maxFiles)
  let room = props.maxFiles === undefined
    ? Infinity
    : props.maxFiles - entries.value.filter((entry) => entry.status !== 'failed').length + (replacing === undefined ? 0 : 1)
  for (const file of chosen) {
    if (props.maxSize !== undefined && file.size > props.maxSize) {
      found.push(t('ui.fileTooLarge', { name: file.name, max: bytes(props.maxSize) }))
    } else if (room <= 0) {
      found.push(t('ui.tooManyFiles', { max: props.maxFiles ?? 0 }))
      break
    } else {
      room -= 1
      void send(file, replacing)
    }
  }
  problems.value = found
}

async function send(file: File, replacing: Entry | undefined): Promise<void> {
  const upload = reactive<Upload>({ key: ++lastKey, name: file.name, size: file.size, state: 'uploading', id: undefined, error: undefined })
  uploads.unshift(upload)
  try {
    const response = await pair.value.client.upload(props.upload, props.params ?? ({} as Params), file, { multipart: true, filename: file.name })
    const id = (response as { id?: unknown } | null)?.id
    upload.id = typeof id === 'string' || typeof id === 'number' ? String(id) : undefined
    upload.state = 'done'
    emit('uploaded', response)
    if (replacing !== undefined) await removeEntry(replacing)
  } catch (failure) {
    upload.state = 'failed'
    upload.error = failure instanceof ApiError ? (Object.values(failure.fields)[0] ?? failure.message) : undefined
  }
}

const removable = (entry: Entry): boolean => entry.status === 'failed' || (props.remove !== undefined && entry.id !== undefined && entry.status !== 'uploading')

async function removeEntry(entry: Entry): Promise<void> {
  if (entry.status !== 'failed' && props.remove !== undefined && entry.id !== undefined) {
    try {
      await pair.value.connection.call(props.remove, { id: entry.id }, undefined)
    } catch (failure) {
      problems.value = [failure instanceof ApiError ? failure.message : t('ui.failed')]
      return
    }
  }
  if (entry.upload !== undefined) uploads.splice(uploads.indexOf(entry.upload), 1)
  if (entry.id !== undefined) hidden.add(entry.id)
}

defineExpose({ add })
</script>

<template>
  <div class="ui-file-upload">
    <FileDropzone
      :name="name"
      :accept="accept"
      :multiple="maxFiles !== 1"
      :hint="maxSize === undefined ? undefined : t('ui.maxFileSize', { max: bytes(maxSize) })"
      :described-by="problems.length > 0 ? `${uid}-problems` : undefined"
      @add="add"
    />
    <div v-if="problems.length > 0" :id="`${uid}-problems`" class="ui-file-upload__problems" role="alert">
      <p v-for="problem in problems" :key="problem">{{ problem }}</p>
    </div>
    <ul v-if="entries.length > 0" class="ui-file-upload__list">
      <li v-for="entry in entries" :key="entry.key" class="ui-file-upload__row">
        <Icon name="file" class="ui-file-upload__icon" />
        <div class="ui-file-upload__file">
          <span :id="`${uid}-${entry.key}`" class="ui-file-upload__name">{{ entry.name }}</span>
          <span class="ui-file-upload__meta">
            {{ bytes(entry.size) }}<span v-if="entry.error" class="ui-file-upload__error">{{ entry.error }}</span>
          </span>
          <progress
            v-if="entry.status === 'uploading'"
            class="ui-file-upload__progress"
            max="100"
            :value="entry.progress"
            :aria-labelledby="`${uid}-${entry.key}`"
          />
        </div>
        <Badge :variant="badge(entry.status).variant" size="sm">{{ badge(entry.status).label }}</Badge>
        <Button
          v-if="removable(entry)"
          variant="ghost"
          size="sm"
          :label="t('ui.removeFile', { name: entry.name })"
          :data-action="entry.status === 'failed' ? undefined : remove?.name"
          @click="removeEntry(entry)"
        >
          <template #icon><Icon name="x" /></template>
        </Button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ui-file-upload { display: flex; flex-direction: column; gap: var(--ui-space-3); }

.ui-file-upload__problems { font-size: var(--ui-text-sm); color: var(--ui-danger); }

.ui-file-upload__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--ui-surface);
  border: var(--ui-border-width) solid var(--ui-border);
  border-radius: var(--ui-radius-card);
}
.ui-file-upload__row { display: flex; align-items: center; gap: var(--ui-space-3); min-height: var(--ui-touch-min); padding: var(--ui-space-2) var(--ui-space-4); }
.ui-file-upload__row + .ui-file-upload__row { border-top: var(--ui-border-width) solid var(--ui-divider); }
.ui-file-upload__icon { flex: none; color: var(--ui-muted); }
.ui-file-upload__file { display: flex; flex: 1; flex-direction: column; gap: var(--ui-space-1); min-width: 0; }
.ui-file-upload__name { overflow: hidden; font-size: var(--ui-text-sm); font-weight: var(--ui-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-file-upload__meta { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); font-size: var(--ui-text-xs); color: var(--ui-muted); }
.ui-file-upload__error { color: var(--ui-danger); }

/* The native <progress>: a determinate bar fills with the accent, an indeterminate one slides. */
.ui-file-upload__progress {
  width: 100%;
  height: var(--ui-space-1);
  appearance: none;
  background: var(--ui-surface-2);
  border: 0;
  border-radius: var(--ui-radius-pill);
  overflow: hidden;
}
.ui-file-upload__progress::-webkit-progress-bar { background: var(--ui-surface-2); }
.ui-file-upload__progress::-webkit-progress-value { background: var(--ui-accent); transition: width var(--ui-duration) var(--ui-ease); }
.ui-file-upload__progress::-moz-progress-bar { background: var(--ui-accent); }
.ui-file-upload__progress:indeterminate,
.ui-file-upload__progress:indeterminate::-webkit-progress-bar {
  background: linear-gradient(90deg, var(--ui-surface-2) 35%, var(--ui-accent) 35% 65%, var(--ui-surface-2) 65%) 100% 0 / 300% 100%;
  animation: ui-file-upload-slide 1.2s linear infinite;
}
.ui-file-upload__progress:indeterminate::-moz-progress-bar { background: transparent; }
@keyframes ui-file-upload-slide { to { background-position: 0 0; } }
/* Without motion the band would rest outside the bar: a dashed bar says "in progress" instead. */
@media (prefers-reduced-motion: reduce) {
  .ui-file-upload__progress:indeterminate,
  .ui-file-upload__progress:indeterminate::-webkit-progress-bar {
    background: repeating-linear-gradient(90deg, var(--ui-accent) 0 0.5rem, var(--ui-surface-2) 0.5rem 1rem);
  }
}
</style>
