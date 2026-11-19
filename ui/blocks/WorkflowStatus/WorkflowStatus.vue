<script setup lang="ts">
// WorkflowStatus: a business object's lifecycle (D33). The states as a track, the transitions the
// page allows now as buttons that call livewire (confirmed first where they say so), and an
// optional timeline. The live item's push moves `current`; the block holds no state of its own.
import { computed, shallowReactive, shallowRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLiveConnection } from '@/api/vue'
import Badge from '../../Badge/Badge.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Dialog from '../../Dialog/Dialog.vue'
import Icon from '../../Icon/Icon.vue'
import { formatDateTime } from '../../format'
import { runTransition, standings, type TransitionFlow, type WorkflowEntry, type WorkflowState, type WorkflowTransition } from './workflow'

const props = defineProps<{
  /** The ordered lifecycle. */
  states: readonly WorkflowState[]
  current: string
  /** The transitions allowed now; the page computes them from the record and its permissions. */
  transitions: readonly WorkflowTransition[]
  /** The states the record passed, oldest first; marks done what it passed (side exits). */
  history?: readonly WorkflowEntry[] | undefined
}>()

const emit = defineEmits<{ transitioned: [state: string] }>()
const { t, locale } = useI18n()
const connection = useLiveConnection()
// Shallow: a transition (and its descriptor) passes to the call as the page gave it, never as a proxy.
const flow = shallowReactive<TransitionFlow>({ asking: undefined, saving: undefined, error: undefined })
// What the confirm shows follows the flow while it asks and stays as it was while the dialog
// leaves, so its title, sentence, tone, error and running call (spinner, no X) do not change during
// the exit (D94). A press on its button then runs nothing: only the flow's open question confirms.
const confirmView = shallowRef<{ transition: WorkflowTransition; error: string | undefined; saving: boolean }>()
watchEffect(() => {
  if (flow.asking !== undefined) confirmView.value = { transition: flow.asking, error: flow.error, saving: flow.saving !== undefined }
})

const track = computed(() => {
  const standing = standings(props.states, props.current, props.history)
  return props.states.map((state, index) => ({ ...state, standing: standing[index] }))
})
const labelOf = (key: string): string => props.states.find((state) => state.key === key)?.label ?? key
const primary = computed(() => props.transitions.find((transition) => !transition.danger))

async function run(transition: WorkflowTransition, confirmed: boolean): Promise<void> {
  const moved = await runTransition(flow, transition, confirmed, (chosen) =>
    connection.value.call(chosen.call, chosen.params ?? {}, chosen.body))
  if (moved) emit('transitioned', transition.to)
}

function dismiss(open: boolean): void {
  if (open || flow.saving !== undefined) return
  flow.asking = undefined
  flow.error = undefined
}
</script>

<template>
  <div class="ui-workflow-status">
    <ol class="ui-workflow-status__track">
      <li
        v-for="state in track"
        :key="state.key"
        class="ui-workflow-status__state"
        :data-state="state.standing"
        :aria-current="state.standing === 'current' ? 'step' : undefined"
      >
        <Badge v-if="state.standing === 'current'" :variant="state.tone ?? 'accent'" dot pill>{{ state.label }}</Badge>
        <span v-else class="ui-workflow-status__label">
          <Icon v-if="state.standing === 'done'" name="check" size="sm" :label="t('ui.done')" />
          {{ state.label }}
        </span>
      </li>
    </ol>

    <div v-if="transitions.length > 0" class="ui-workflow-status__actions">
      <Button
        v-for="transition in transitions"
        :key="transition.to"
        :variant="transition.danger ? 'danger' : transition === primary ? 'primary' : 'secondary'"
        :loading="flow.saving === transition.to && !flow.asking"
        :disabled="flow.saving !== undefined"
        :data-action="transition.confirm ? undefined : transition.call.name"
        :data-transition="transition.to"
        @click="run(transition, false)"
      >
        {{ transition.label }}
      </Button>
    </div>
    <Banner v-if="flow.error && !flow.asking" variant="danger">{{ flow.error }}</Banner>

    <ol v-if="history && history.length > 0" class="ui-workflow-status__history">
      <li v-for="entry in history" :key="`${entry.state}@${entry.at}`" class="ui-workflow-status__entry">
        <span class="ui-workflow-status__entry-state">{{ labelOf(entry.state) }}</span>
        <time :datetime="entry.at">{{ formatDateTime(entry.at, locale) }}</time>
        <span v-if="entry.by">{{ entry.by }}</span>
      </li>
    </ol>

    <Dialog
      :model-value="flow.asking !== undefined"
      size="sm"
      :variant="confirmView?.transition.danger ? 'danger' : 'default'"
      :title="confirmView?.transition.label ?? ''"
      :description="confirmView?.transition.confirm"
      :persistent="confirmView?.saving"
      @update:model-value="dismiss"
    >
      <Banner v-if="confirmView?.error" variant="danger">{{ confirmView.error }}</Banner>
      <template #actions>
        <Button :disabled="confirmView?.saving" @click="dismiss(false)">{{ t('ui.cancel') }}</Button>
        <Button
          v-if="confirmView"
          :variant="confirmView.transition.danger ? 'danger' : 'primary'"
          :loading="confirmView.saving"
          :data-action="confirmView.transition.call.name"
          :data-transition="confirmView.transition.to"
          @click="flow.asking && run(flow.asking, true)"
        >
          {{ confirmView.transition.label }}
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.ui-workflow-status { display: flex; flex-direction: column; gap: var(--ui-space-4); }

.ui-workflow-status__track {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ui-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ui-workflow-status__state { display: flex; align-items: center; gap: var(--ui-space-2); }
.ui-workflow-status__state:not(:last-child)::after {
  content: "";
  width: var(--ui-space-6);
  height: var(--ui-border-width);
  background: var(--ui-border-strong);
}
.ui-workflow-status__state[data-state="done"]::after { background: var(--ui-accent); }
.ui-workflow-status__label { display: inline-flex; align-items: center; gap: var(--ui-space-1); font-size: var(--ui-text-sm); color: var(--ui-muted); }
.ui-workflow-status__state[data-state="done"] .ui-workflow-status__label { color: var(--ui-ink); }
.ui-workflow-status__state[data-state="done"] :deep(.ui-icon) { color: var(--ui-accent); }

.ui-workflow-status__actions { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); }

.ui-workflow-status__history {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-2);
  margin: 0;
  padding: 0 0 0 var(--ui-space-4);
  border-inline-start: 2px solid var(--ui-divider);
  list-style: none;
  font-size: var(--ui-text-sm);
  color: var(--ui-muted);
}
.ui-workflow-status__entry { display: flex; flex-wrap: wrap; gap: var(--ui-space-1) var(--ui-space-3); }
.ui-workflow-status__entry-state { min-width: 6rem; color: var(--ui-ink); font-weight: var(--ui-weight-medium); }
</style>
