<script setup lang="ts">
// AgentCursor: drive mode made visible (D25, D27). Runs a DrivePlan through cursor.ts: a pointer
// moves to each target at human pace, the Spotlight shows what it is doing, clicks are real
// clicks and filled values are typed. A mutating click pauses on its button until the user
// clicks it or presses Go. Any pointer or key input outside [data-agent-ui] stops the plan.
import { nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Spotlight from '../Spotlight/Spotlight.vue'
import { findAction } from '../agent/registry'
import { resolveTarget, type DrivePlan, type DriveTarget } from '../agent/types'
import { createDriver, pace, type DriveEffects, type Driver } from './cursor'

const props = withDefaults(defineProps<{
  plan: DrivePlan | null
  /** 1 is human pace (350 ms moves, 40 ms per character, 500 ms before a click). */
  speed?: number | undefined
  /** Mutating actions whose click may run without a pause, from DESIGN.md (D27). */
  unattended?: string[] | undefined
}>(), { speed: 1 })

const emit = defineEmits<{ step: [index: number]; done: []; stopped: [index: number]; error: [message: string]; navigate: [path: string] }>()

const { t } = useI18n()
const pointer = ref<HTMLElement | null>(null)
const spotlight = ref<InstanceType<typeof Spotlight> | null>(null)
const running = ref(false)
const shown = shallowRef<{ target: DriveTarget; text: string; step: number } | null>(null)
/** Set while a pause waits: Go resolves it. */
const go = shallowRef<(() => void) | null>(null)
let pointed: HTMLElement | null = null
let pausedOn: HTMLElement | null = null
let release = (): void => {}
let driver: Driver | undefined
let current = 0
let stoppedAt = 0

const effects: DriveEffects<HTMLElement> = {
  query: resolveTarget,
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  point(element, step) {
    element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    pointed = element
    if ('target' in step) shown.value = { target: step.target, text: step.say ?? '', step: current }
  },
  click: element => element.click(),
  type(element, value, whole) {
    if (document.activeElement !== element) element.focus({ preventScroll: true })
    if (element instanceof HTMLSelectElement) {
      if (!whole) return
      element.value = value
      element.dispatchEvent(new Event('change', { bubbles: true }))
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  },
  async navigate(path) {
    emit('navigate', path)
    await new Promise(resolve => requestAnimationFrame(resolve))
  },
  pause(element, say) {
    if (shown.value) shown.value = { ...shown.value, text: say || t('ui.confirmStep') }
    return new Promise(resolve => {
      const finish = (answer: 'go' | 'target') => { release(); resolve(answer) }
      const onClick = () => finish('target')
      element.addEventListener('click', onClick)
      pausedOn = element
      go.value = () => finish('go')
      release = () => { element.removeEventListener('click', onClick); pausedOn = null; go.value = null }
      void nextTick(() => spotlight.value?.focus())
    })
  },
  bound: action => findAction(action),
}

// The pointer follows the element it points at every frame (scroll, resize, layout shifts).
let frame = 0
function follow() {
  const rect = pointed?.getBoundingClientRect()
  if (rect && pointer.value) pointer.value.style.transform = `translate(${rect.left + rect.width / 2}px, ${rect.top + rect.height / 2}px)`
  frame = requestAnimationFrame(follow)
}

/** A real user's press or key outside the agent's own UI takes over (D25). */
function onUserInput(event: Event) {
  const node = event.target instanceof Element ? event.target : null
  if (!event.isTrusted || node?.closest('[data-agent-ui]') || (pausedOn && node && pausedOn.contains(node))) return
  stop()
}

function listen(on: boolean) {
  for (const type of ['pointerdown', 'keydown']) {
    if (on) window.addEventListener(type, onUserInput, true)
    else window.removeEventListener(type, onUserInput, true)
  }
}

/** Puts the pointer on the element that started the plan (the Do it button) without a glide. */
function appear() {
  if (!pointer.value) return
  const origin = (document.activeElement ?? document.body).getBoundingClientRect()
  pointer.value.style.transition = 'none'
  pointer.value.style.transform = `translate(${origin.left + origin.width / 2}px, ${origin.top + origin.height / 2}px)`
  void pointer.value.offsetWidth // commit the position before the transition comes back
  pointer.value.style.transition = ''
}

async function start(plan: DrivePlan, from: number) {
  driver?.stop()
  const own = createDriver(effects, { speed: props.speed, unattended: props.unattended, onStep: index => { current = index; emit('step', index) } })
  driver = own
  if (!running.value) {
    running.value = true
    listen(true)
    await nextTick()
    appear()
    frame = requestAnimationFrame(follow)
  }
  const outcome = await own.run(plan, from)
  if (driver !== own) return // a newer plan took over
  finish()
  if (outcome.kind === 'done') emit('done')
  else if (outcome.kind === 'stopped') emit('stopped', (stoppedAt = outcome.step))
  else emit('error', outcome.message)
}

function finish() {
  release()
  listen(false)
  cancelAnimationFrame(frame)
  running.value = false
  shown.value = null
  pointed = null
}

function stop() {
  driver?.stop()
}

/** Runs the plan again from the step it was stopped at. */
function resume() {
  if (props.plan && !running.value) void start(props.plan, stoppedAt)
}

watch(() => props.plan, plan => {
  if (plan) void start(plan, 0)
  else stop()
}, { immediate: true })

onBeforeUnmount(() => {
  driver?.stop()
  driver = undefined
  finish()
})

defineExpose({ stop, resume })
</script>

<template>
  <Teleport to="body">
    <div v-if="running" ref="pointer" class="ui-agent-cursor" :style="{ '--ui-agent-cursor-move': `${pace.move / speed}ms` }" aria-hidden="true">
      <svg class="ui-agent-cursor__arrow" viewBox="0 0 24 24">
        <path d="M5 3 L5 19.5 L9.5 15.2 L12.6 21.5 L15.3 20.3 L12.3 14.1 L18.5 14.1 Z" />
      </svg>
    </div>
  </Teleport>
  <Spotlight
    ref="spotlight"
    :target="shown?.target ?? null"
    :text="shown?.text ?? ''"
    :step="shown ? shown.step + 1 : undefined"
    :total="plan?.steps.length"
    :can-next="go !== null"
    :next-label="t('ui.go')"
    @next="go?.()"
    @close="stop"
  />
</template>

<style scoped>
/* Positioned by transform from script; the tip of the arrow sits on the target's centre. */
.ui-agent-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--ui-z-agent);
  pointer-events: none;
  transition: transform var(--ui-agent-cursor-move) var(--ui-ease);
}
.ui-agent-cursor__arrow {
  width: var(--ui-space-8);
  height: var(--ui-space-8);
  margin: calc(var(--ui-space-8) * -0.125) 0 0 calc(var(--ui-space-8) * -0.2);
  fill: var(--ui-accent);
  stroke: var(--ui-surface);
  stroke-width: 1.5;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 2px var(--ui-scrim));
}
@media (prefers-reduced-motion: reduce) {
  .ui-agent-cursor { transition: none; }
}
</style>
