<script setup lang="ts">
// AgentDock: the agent's panel in the AppShell's dock slot (D25, D26). The thread is a live list
// read, sending is a call with the mode; an agent message that carries a plan gets "Show me"
// (guide: Spotlight, the user acts) and "Do it" (drive: AgentCursor acts visibly). Everything the
// dock renders carries data-agent-ui, so the cursor's "user input stops the plan" skips it.
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ListResponse, LiveTarget, MutationTarget, NoParameters } from '@/api/runtime'
import { useLiveConnection, useLiveList } from '@/api/vue'
import AgentCursor from '../../AgentCursor/AgentCursor.vue'
import Avatar from '../../Avatar/Avatar.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Icon from '../../Icon/Icon.vue'
import Skeleton from '../../Skeleton/Skeleton.vue'
import Spotlight from '../../Spotlight/Spotlight.vue'
import Textarea from '../../Textarea/Textarea.vue'
import type { DrivePlan } from '../../agent/types'
import { formatAge } from '../../format'
import { useComposer } from './composer'
import { guideStops, thinking, thread, type AgentMode, type ChatMessage, type GuideStop } from './dock'
import { useFollow } from './follow'

const props = withDefaults(defineProps<{
  /** The thread, e.g. `live.conversation`; read whole without parameters, shown oldest first. */
  conversation: LiveTarget<never, ListResponse<ChatMessage>>
  /** The call that sends a message, e.g. `calls.sendMessage`; body `{ text, mode }`. */
  send: MutationTarget<NoParameters, { text: string; mode: AgentMode }, unknown>
  /** The call that stops the answer being written, e.g. `calls.cancelAnswer`; Stop replaces Send while the agent answers. */
  cancel?: MutationTarget<NoParameters, undefined, unknown> | undefined
  /** The plan attached to an agent message, if any. */
  planOf?: ((message: ChatMessage) => DrivePlan | undefined) | undefined
  /** Mutating actions drive mode may submit without a pause, from DESIGN.md (D27). */
  unattended?: string[] | undefined
  /** Default ui.agent. */
  title?: string | undefined
  /** The agent's picture; a bot icon without one. */
  avatar?: string | undefined
}>(), {})

const mode = defineModel<AgentMode>('mode', { default: 'chat' })
const emit = defineEmits<{ navigate: [path: string]; close: []; running: [running: boolean] }>()

const { t, locale } = useI18n()
const list = useLiveList(props.conversation)
const connection = useLiveConnection()
const messages = computed(() => thread(list.items.value))
const plans = computed(() => new Map(messages.value.map(message => [message.id, props.planOf?.(message)])))
const heading = computed(() => props.title ?? t('ui.agent'))
const modes = computed(() => [['chat', t('ui.chat')], ['guide', t('ui.guide')], ['drive', t('ui.drive')]] as const)

// The log follows new text only while the reader is at its bottom; else Jump to latest shows (D98).
const { log, unseen, onScroll, toBottom, jump } = useFollow(() => messages.value)

// Composer: one call at a time; with a cancel call Stop replaces Send while the agent answers (D98).
const { form, field, draft, pending, stopping, failure, stoppable, submit, onAction, onKey } = useComposer({
  messages: () => messages.value,
  connection: () => connection.value,
  send: () => props.send,
  cancel: () => props.cancel,
  mode: () => mode.value,
  sending: toBottom,
})

// Guide: the user walks the plan's stops with Next and Back; the dock navigates between pages.
const guide = shallowRef<{ stops: GuideStop[]; index: number } | null>(null)
const stop = computed(() => guide.value?.stops[guide.value.index])
let guidePath: string | undefined

function showMe(plan: DrivePlan) {
  driving.value = null
  guidePath = undefined
  guide.value = { stops: guideStops(plan), index: 0 }
  visit()
}

function move(by: number) {
  if (!guide.value) return
  const index = guide.value.index + by
  guide.value = index < guide.value.stops.length ? { ...guide.value, index: Math.max(0, index) } : null
  visit()
}

function visit() {
  const path = stop.value?.path
  if (path === undefined || path === guidePath) return
  guidePath = path
  emit('navigate', path)
}

// Drive: AgentCursor runs the plan; any end clears it.
const driving = shallowRef<DrivePlan | null>(null)
const cursor = ref<InstanceType<typeof AgentCursor> | null>(null)

function doIt(plan: DrivePlan) {
  guide.value = null
  failure.value = ''
  driving.value = plan
}

function ended(message?: string) {
  driving.value = null
  if (message !== undefined) failure.value = t('ui.planFailed')
}

function takeOver() {
  if (driving.value) cursor.value?.stop()
  guide.value = null
}

// The shell collapses the dock while a plan runs (AppShell dockCollapsed), so the plan reaches the page.
watch(() => guide.value !== null || driving.value !== null, running => emit('running', running))
</script>

<template>
  <section class="ui-agent-dock" data-agent-ui :aria-label="heading">
    <header class="ui-agent-dock__head">
      <Avatar v-if="avatar" :name="heading" :src="avatar" size="sm" />
      <Icon v-else name="bot" class="ui-agent-dock__bot" />
      <h2 class="ui-agent-dock__title">{{ heading }}</h2>
      <Button v-if="guide || driving" size="sm" @click="takeOver">
        <template #icon><Icon name="hand" /></template>{{ driving ? t('ui.takeOver') : t('ui.stop') }}
      </Button>
      <Button size="sm" variant="ghost" :label="t('ui.close')" @click="emit('close')"><template #icon><Icon name="x" /></template></Button>
    </header>
    <div class="ui-agent-dock__modes" role="group" :aria-label="heading">
      <Button v-for="[value, label] in modes" :key="value" size="sm" variant="ghost" class="ui-agent-dock__mode" :aria-pressed="mode === value" @click="mode = value">{{ label }}</Button>
    </div>
    <div class="ui-agent-dock__thread">
      <div ref="log" class="ui-agent-dock__log" role="log" tabindex="0" :aria-label="t('ui.conversation')" :aria-busy="list.loading.value" @scroll="onScroll">
        <Banner v-if="list.error.value" variant="danger">
          {{ list.error.value.message }}
          <template #action><Button size="sm" @click="list.retry()">{{ t('ui.retry') }}</Button></template>
        </Banner>
        <Skeleton v-else-if="list.loading.value" :lines="4" />
        <div v-for="message in messages" :key="message.id" class="ui-agent-dock__message" :data-variant="message.role">
          <p class="ui-agent-dock__text">{{ message.text }}</p>
          <time class="ui-agent-dock__time" :datetime="message.createdAt">{{ formatAge(message.createdAt, locale) }}</time>
          <div v-if="plans.get(message.id)" class="ui-agent-dock__plan">
            <Button v-if="mode !== 'drive'" size="sm" @click="showMe(plans.get(message.id)!)">
              <template #icon><Icon name="sparkles" /></template>{{ t('ui.showMe') }}
            </Button>
            <Button v-if="mode !== 'guide'" size="sm" @click="doIt(plans.get(message.id)!)">
              <template #icon><Icon name="play" /></template>{{ t('ui.doIt') }}
            </Button>
          </div>
        </div>
        <p v-if="thinking(messages)" class="ui-agent-dock__thinking" role="status">
          <span class="ui-agent-dock__dots" aria-hidden="true"><span /><span /><span /></span>{{ t('ui.thinking') }}
        </p>
      </div>
      <Button v-if="unseen" size="sm" class="ui-agent-dock__jump" @click="jump">
        <template #icon><Icon name="arrow-down" /></template>{{ t('ui.jumpToLatest') }}
      </Button>
    </div>
    <p v-if="failure" class="ui-agent-dock__failure" role="alert">{{ failure }}</p>
    <form ref="form" class="ui-agent-dock__composer" @submit.prevent="submit">
      <Textarea ref="field" v-model="draft" name="message" :rows="1" :placeholder="t('ui.askAgent')" :aria-label="t('ui.askAgent')" @keydown="onKey" />
      <!-- One button for Send and Stop, so focus stays on it from Send to Stop; the way back is composer.ts's watch. -->
      <Button
        :type="stoppable ? 'button' : 'submit'" variant="primary" :data-action="stoppable ? cancel?.name : send.name"
        :label="stoppable ? t('ui.stop') : t('ui.send')" :loading="pending || stopping" :disabled="!stoppable && draft.trim() === ''" @click="onAction"
      >
        <template #icon><Icon :name="stoppable ? 'square' : 'arrow-up'" /></template>
      </Button>
    </form>
    <Spotlight
      :target="stop?.step.target ?? null"
      :text="stop?.step.say ?? ''"
      :step="guide ? guide.index + 1 : undefined"
      :total="guide?.stops.length"
      :can-back="(guide?.index ?? 0) > 0"
      :can-next="guide !== null"
      :next-label="guide && guide.index === guide.stops.length - 1 ? t('ui.done') : t('ui.next')"
      @next="move(1)"
      @back="move(-1)"
      @close="guide = null"
    />
    <AgentCursor ref="cursor" :plan="driving" :unattended="unattended" @navigate="emit('navigate', $event)" @done="ended()" @stopped="ended()" @error="ended" />
  </section>
</template>

<style scoped>
.ui-agent-dock { display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--ui-surface); color: var(--ui-ink); }

.ui-agent-dock__head { display: flex; align-items: center; gap: var(--ui-space-2); padding: var(--ui-space-2) var(--ui-space-2) var(--ui-space-2) var(--ui-space-4); border-bottom: var(--ui-border-width) solid var(--ui-divider); }
.ui-agent-dock__bot { color: var(--ui-accent); }
.ui-agent-dock__title { flex: 1; min-width: 0; font-size: var(--ui-text-md); }

.ui-agent-dock__modes { display: flex; gap: var(--ui-space-1); padding: var(--ui-space-2) var(--ui-space-4); border-bottom: var(--ui-border-width) solid var(--ui-divider); }
.ui-agent-dock__mode { flex: 1; }
.ui-agent-dock__mode[aria-pressed="true"] { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }

.ui-agent-dock__thread { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; }
.ui-agent-dock__log { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: var(--ui-space-3); padding: var(--ui-space-4); }
.ui-agent-dock__log:focus-visible { outline-offset: calc(var(--ui-border-width) * -2); }
.ui-agent-dock__message { display: flex; flex-direction: column; gap: var(--ui-space-1); max-width: 85%; }
.ui-agent-dock__message[data-variant="user"] { align-self: flex-end; align-items: flex-end; }
.ui-agent-dock__text { padding: var(--ui-space-2) var(--ui-space-3); border-radius: var(--ui-radius-card); background: var(--ui-surface-2); font-size: var(--ui-text-sm); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-agent-dock__message[data-variant="user"] .ui-agent-dock__text { background: var(--ui-accent-soft); color: var(--ui-on-accent-soft); }
.ui-agent-dock__time { font-size: var(--ui-text-xs); color: var(--ui-muted); }
.ui-agent-dock__plan { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); }

.ui-agent-dock__thinking { display: flex; align-items: center; gap: var(--ui-space-2); font-size: var(--ui-text-sm); color: var(--ui-muted); }
.ui-agent-dock__dots { display: inline-flex; gap: var(--ui-space-1); }
.ui-agent-dock__dots span { width: var(--ui-space-1); height: var(--ui-space-1); border-radius: var(--ui-radius-pill); background: currentColor; }
@media (prefers-reduced-motion: no-preference) {
  .ui-agent-dock__dots span { animation: ui-agent-dock-blink 1.2s var(--ui-ease) infinite; }
  .ui-agent-dock__dots span:nth-child(2) { animation-delay: 0.2s; }
  .ui-agent-dock__dots span:nth-child(3) { animation-delay: 0.4s; }
}
@keyframes ui-agent-dock-blink { 50% { opacity: 0.2; } }

/* Over the log's bottom edge, so the log never changes height; it goes once the reader is at the bottom. */
.ui-agent-dock__jump { position: absolute; inset-block-end: var(--ui-space-2); inset-inline: 0; width: fit-content; margin-inline: auto; box-shadow: var(--ui-shadow-md); }
.ui-agent-dock__failure { padding: 0 var(--ui-space-4); font-size: var(--ui-text-sm); color: var(--ui-danger); }
.ui-agent-dock__composer { display: flex; align-items: flex-end; gap: var(--ui-space-2); padding: var(--ui-space-3) var(--ui-space-4); border-top: var(--ui-border-width) solid var(--ui-divider); }
.ui-agent-dock__composer :deep(.ui-textarea) { flex: 1; }
</style>
