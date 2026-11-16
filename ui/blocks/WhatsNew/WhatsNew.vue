<script setup lang="ts">
// WhatsNew (D34, D62): the release notes dialog of the running minor line, once per user. On mount
// it reads the stored line, asks changelog.ts's decideWhatsNew, stores a first visit silently and
// opens for a newer line with features; it stores the line when it closes, however it closes.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import Button from '../../Button/Button.vue'
import Dialog from '../../Dialog/Dialog.vue'
import { decideWhatsNew, mergedGroups, versionLine, type ChangeGroup, type ReleaseLine } from '../../changelog'
import { defaultStorageKey, readSeen as readLocal, writeSeen as writeLocal } from './whatsNew'

type Maybe<T> = T | Promise<T>

const props = withDefaults(defineProps<{
  /** The running build's version, e.g. import.meta.env.VITE_APP_VERSION. */
  version: string
  /** The parsed changelog (parseChangelogs(...).lines). */
  releases: readonly ReleaseLine[]
  /** The line the user saw last; localStorage under storageKey by default. */
  readSeen?: (() => Maybe<string | null | undefined>) | undefined
  /** Stores the line the user saw; localStorage under storageKey by default. */
  writeSeen?: ((line: string) => Maybe<void>) | undefined
  storageKey?: string
  title?: string | undefined
  /** The changelog page, shown as "All changes". */
  to?: RouteLocationRaw | undefined
  /** Items shown per group; the rest is counted. */
  limit?: number
  /** Opens the running line's notes (the newest line on a dev build) whatever is stored: a "What's new" menu entry. */
  force?: boolean | undefined
  /** In the page flow through Dialog's inline; decides and stores nothing. Docs and previews only. */
  inline?: boolean | undefined
}>(), { storageKey: defaultStorageKey, limit: 6 })

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const open = ref(false)
const notes = shallowRef<ReleaseLine>()
let remember: string | undefined
let unmounted = false

const groupLabels: Record<ChangeGroup, string> = { Features: 'ui.groupFeatures', Fixes: 'ui.groupFixes', Changes: 'ui.groupChanges', Security: 'ui.groupSecurity' }
const groups = computed(() => (notes.value ? mergedGroups(notes.value) : []))

function lineToShow(): ReleaseLine | undefined {
  const running = versionLine(props.version)
  return props.releases.find((line) => line.line === running) ?? props.releases[0]
}

function store(line: string): void {
  // A failed write shows the notes once more; nothing to tell the user.
  Promise.resolve()
    .then(() => (props.writeSeen ? props.writeSeen(line) : writeLocal(line, props.storageKey)))
    .catch(() => undefined)
}

onMounted(async () => {
  if (props.inline || props.force) {
    notes.value = lineToShow()
    open.value = !props.inline && notes.value !== undefined
    remember = props.inline ? undefined : versionLine(props.version)
    return
  }
  let seen: string | null | undefined
  try {
    seen = await (props.readSeen ? props.readSeen() : readLocal(props.storageKey))
  } catch {
    return // unknown: stay silent rather than show the notes on every load
  }
  if (unmounted) return
  const decision = decideWhatsNew(props.releases, props.version, seen)
  remember = decision.remember
  if (decision.show === undefined) {
    if (remember !== undefined) store(remember)
    return
  }
  notes.value = decision.show
  open.value = true
})
onBeforeUnmount(() => { unmounted = true })

function onClose(): void {
  if (props.inline) return
  if (remember !== undefined) store(remember)
  emit('close')
}
</script>

<template>
  <Dialog
    v-if="notes"
    v-model="open"
    class="ui-whats-new"
    :inline="inline"
    :title="title ?? t('ui.whatsNewIn', { version: notes.line })"
    :description="notes.title"
    @close="onClose"
  >
    <div class="ui-whats-new__notes">
      <slot :line="notes" :groups="groups">
        <p v-if="notes.intro" class="ui-whats-new__intro">{{ notes.intro }}</p>
        <template v-for="list in groups" :key="list.group">
          <h3>{{ t(groupLabels[list.group]) }}</h3>
          <ul>
            <li v-for="(item, index) in list.items.slice(0, limit)" :key="index">{{ item }}</li>
            <li v-if="list.items.length > limit" class="ui-whats-new__more">{{ t('ui.andMore', { n: list.items.length - limit }) }}</li>
          </ul>
        </template>
      </slot>
    </div>
    <template #actions>
      <slot name="actions" :close="() => (open = false)">
        <Button v-if="to" variant="ghost" :to="to" @click="open = false">{{ t('ui.allChanges') }}</Button>
        <Button variant="primary" @click="open = false">{{ t('ui.gotIt') }}</Button>
      </slot>
    </template>
  </Dialog>
</template>

<style scoped>
.ui-whats-new__notes { display: flex; flex-direction: column; gap: var(--ui-space-3); }
.ui-whats-new__intro { color: var(--ui-ink-2); }
.ui-whats-new__notes :deep(h3) { font-size: var(--ui-text-md); }
.ui-whats-new__notes :deep(h3:not(:first-child)) { margin-top: var(--ui-space-2); }
.ui-whats-new__notes :deep(ul),
.ui-whats-new__notes :deep(ol) { display: flex; flex-direction: column; gap: var(--ui-space-1); margin: 0; padding-inline-start: var(--ui-space-5); }
.ui-whats-new__notes :deep(li) { color: var(--ui-ink-2); }
.ui-whats-new__more { list-style: none; color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
