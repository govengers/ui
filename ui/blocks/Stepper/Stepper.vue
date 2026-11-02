<script setup lang="ts">
// Stepper: a multi-step form frame (D33). The page owns the current step (v-model) and its
// validation (canContinue); the frame draws the step list, the current step's content and the
// Back / Continue / Finish bar. Enter in a field continues: the frame is the <form>.
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ActionBar from '../../ActionBar/ActionBar.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import { canJump, stepState, type StepItem } from './stepper'

const props = withDefaults(defineProps<{
  steps: readonly StepItem[]
  /** The key of the current step. */
  modelValue: string
  /** The page's verdict on the current step: Continue, Finish and forward jumps wait for it. */
  canContinue?: boolean | undefined
  /** A save runs: Continue and Finish spin, nothing navigates. */
  busy?: boolean | undefined
  finishLabel?: string | undefined
  /** data-action of Finish: the livewire call the finish runs. */
  finishAction?: string | undefined
  /** The step list only goes back; forward is Continue only. */
  linear?: boolean | undefined
}>(), { canContinue: true })

const emit = defineEmits<{ 'update:modelValue': [key: string]; finish: []; enter: [key: string] }>()
const { t } = useI18n()
const id = useId()
const panel = ref<HTMLElement | null>(null)

const index = computed(() => Math.max(0, props.steps.findIndex((step) => step.key === props.modelValue)))
const current = computed(() => props.steps[index.value])
const last = computed(() => index.value === props.steps.length - 1)
// Steps before the furthest one reached were left with Continue: a resumed stepper counts them done.
const furthest = ref(index.value)
watch(index, (reached) => {
  furthest.value = Math.max(furthest.value, reached)
})

onMounted(() => emit('enter', props.modelValue))
watch(() => props.modelValue, async (key) => {
  emit('enter', key)
  await nextTick()
  panel.value?.focus() // the screen reader hears the new step's title, Tab reaches its first field
})

function clickable(target: number): boolean {
  return !props.busy && canJump(target, index.value, furthest.value, props.linear, props.canContinue)
}

function go(target: number): void {
  const key = props.steps[target]?.key
  if (key !== undefined && !props.busy) emit('update:modelValue', key)
}

function submit(): void {
  if (props.busy || !props.canContinue) return
  if (last.value) emit('finish')
  else go(index.value + 1)
}
</script>

<template>
  <form class="ui-stepper" @submit.prevent="submit">
    <ol class="ui-stepper__steps">
      <li
        v-for="(step, position) in steps"
        :key="step.key"
        class="ui-stepper__step"
        :data-state="stepState(position, index, furthest)"
        :aria-current="position === index ? 'step' : undefined"
      >
        <component
          :is="clickable(position) ? 'button' : 'span'"
          :type="clickable(position) ? 'button' : undefined"
          class="ui-stepper__target"
          @click="clickable(position) && go(position)"
        >
          <span class="ui-stepper__marker">
            <Icon v-if="stepState(position, index, furthest) === 'done'" name="check" size="sm" :label="t('ui.done')" />
            <template v-else>{{ position + 1 }}</template>
          </span>
          <span class="ui-stepper__text">
            <span :id="`${id}-${position}`" class="ui-stepper__title">
              {{ step.title }}<span v-if="step.optional" class="ui-stepper__optional"> ({{ t('ui.optional') }})</span>
            </span>
            <span v-if="step.description" class="ui-stepper__description">{{ step.description }}</span>
          </span>
        </component>
      </li>
    </ol>

    <section ref="panel" class="ui-stepper__panel" tabindex="-1" :aria-labelledby="`${id}-${index}`">
      <slot v-if="current" :step="current" :index="index" />
    </section>

    <ActionBar>
      <template #lead>{{ t('ui.step', { n: index + 1, total: steps.length }) }}</template>
      <Button v-if="index > 0" variant="ghost" :disabled="busy" @click="go(index - 1)">
        <template #icon><Icon name="arrow-left" /></template>
        {{ t('ui.back') }}
      </Button>
      <Button
        variant="primary"
        type="submit"
        :loading="busy"
        :disabled="!canContinue"
        :data-action="last ? finishAction : (current?.action ?? 'continue')"
      >
        {{ last ? (finishLabel ?? t('ui.finish')) : t('ui.continue') }}
      </Button>
    </ActionBar>
  </form>
</template>

<style scoped>
.ui-stepper { display: flex; flex-direction: column; container-type: inline-size; }

.ui-stepper__steps {
  display: flex;
  gap: var(--ui-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ui-stepper__step { display: flex; flex: 1; align-items: center; gap: var(--ui-space-2); min-width: 0; }
.ui-stepper__step:last-child { flex: none; }
.ui-stepper__step:not(:last-child)::after {
  content: "";
  flex: 1;
  min-width: var(--ui-space-4);
  height: var(--ui-border-width);
  background: var(--ui-border);
}
.ui-stepper__step[data-state="done"]::after { background: var(--ui-accent); }

.ui-stepper__target {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  min-height: var(--ui-control-h);
  min-width: 0;
  padding: var(--ui-space-1) var(--ui-space-2);
  margin-inline-start: calc(-1 * var(--ui-space-2));
  background: none;
  border: 0;
  border-radius: var(--ui-radius-control);
  color: var(--ui-muted);
  text-align: start;
}
button.ui-stepper__target { cursor: pointer; }
button.ui-stepper__target:hover { background: var(--ui-surface-2); }

.ui-stepper__marker {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--ui-space-6);
  height: var(--ui-space-6);
  border: var(--ui-border-width) solid var(--ui-border-strong);
  border-radius: var(--ui-radius-pill);
  font-size: var(--ui-text-xs);
  font-weight: var(--ui-weight-semibold);
}
.ui-stepper__step[data-state="current"] .ui-stepper__marker { background: var(--ui-accent); border-color: var(--ui-accent); color: var(--ui-on-accent); }
.ui-stepper__step[data-state="done"] .ui-stepper__marker { background: var(--ui-accent-soft); border-color: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }

.ui-stepper__text { display: flex; flex-direction: column; min-width: 0; }
.ui-stepper__title { font-size: var(--ui-text-sm); font-weight: var(--ui-weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-stepper__step:is([data-state="current"], [data-state="done"]) .ui-stepper__title { color: var(--ui-ink); }
.ui-stepper__optional { font-weight: var(--ui-weight-normal); color: var(--ui-muted); }
.ui-stepper__description { font-size: var(--ui-text-xs); color: var(--ui-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ui-stepper__panel { padding-block: var(--ui-space-6); }
.ui-stepper__panel:focus { outline: none; }

/* Narrow (a phone, a drawer, a card): a compact vertical list, no descriptions. */
@container (max-width: 36rem) {
  .ui-stepper__steps { flex-direction: column; gap: 0; }
  .ui-stepper__step::after { display: none; }
  .ui-stepper__description { display: none; }
}
</style>
