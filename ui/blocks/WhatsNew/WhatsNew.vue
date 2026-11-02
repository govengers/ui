<script setup lang="ts">
// WhatsNew (D34): the release notes dialog, once per version. It opens on mount while the stored
// version differs and stores the version when it closes, however it closes; whatsNew.ts holds the
// memory and exports resetWhatsNew.
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../../Button/Button.vue'
import Dialog from '../../Dialog/Dialog.vue'
import { defaultStorageKey, markSeen, unseen } from './whatsNew'

const props = withDefaults(defineProps<{
  version: string
  title?: string | undefined
  storageKey?: string
  /** Opens whatever is stored: a "What's new" menu entry, the demo. */
  force?: boolean | undefined
  /** In the page flow through Dialog's inline; stores nothing. Docs and previews only. */
  inline?: boolean | undefined
}>(), { storageKey: defaultStorageKey })

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const open = ref(false)

onMounted(() => {
  open.value = !props.inline && (props.force || unseen(props.version, props.storageKey))
})

function onClose(): void {
  if (props.inline) return
  markSeen(props.version, props.storageKey)
  emit('close')
}
</script>

<template>
  <Dialog v-model="open" class="ui-whats-new" :inline="inline" :title="title ?? t('ui.whatsNew')" @close="onClose">
    <div class="ui-whats-new__notes"><slot /></div>
    <template #actions>
      <slot name="actions" :close="() => (open = false)">
        <Button variant="primary" @click="open = false">{{ t('ui.gotIt') }}</Button>
      </slot>
    </template>
  </Dialog>
</template>

<style scoped>
.ui-whats-new__notes { display: flex; flex-direction: column; gap: var(--ui-space-3); }
.ui-whats-new__notes :deep(h3) { font-size: var(--ui-text-md); }
.ui-whats-new__notes :deep(h3:not(:first-child)) { margin-top: var(--ui-space-2); }
.ui-whats-new__notes :deep(ul),
.ui-whats-new__notes :deep(ol) { display: flex; flex-direction: column; gap: var(--ui-space-1); margin: 0; padding-inline-start: var(--ui-space-5); }
.ui-whats-new__notes :deep(li) { color: var(--ui-ink-2); }
</style>
