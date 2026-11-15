<script setup lang="ts">
// FeedbackCapture (D59): the report dialog. Kind, text and (for bugs) severity; on open it freezes
// the technical details (recent console lines, failed requests, environment) and, through the
// optional screenshot hook, the page before the dialog covers it. The preview prints exactly the
// report that is sent; leaving details out removes them from both. Sent over REST, so a report
// still goes out while the socket is down.
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MutationTarget, NoParameters } from '@/api/runtime'
import { useLivePair } from '@/api/vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Checkbox from '../../Checkbox/Checkbox.vue'
import Dialog from '../../Dialog/Dialog.vue'
import Field from '../../Field/Field.vue'
import Select from '../../Select/Select.vue'
import Textarea from '../../Textarea/Textarea.vue'
import { buildReport, collectEnvironment, feedbackBuffer, previewText, type FeedbackBuffer, type FeedbackReport, type FeedbackSeverity, type FeedbackSnapshot, type FeedbackType } from './feedback'

const props = defineProps<{
  /** Open state (v-model). */
  modelValue?: boolean | undefined
  /** The create call, e.g. calls.createFeedback; the report is its body. */
  send: MutationTarget<NoParameters, FeedbackReport, unknown>
  /** The ring buffer; the one installFeedbackBuffer() put on the page by default. */
  buffer?: FeedbackBuffer | undefined
  /** Captures the page as a data URL (html2canvas-pro in the project); runs before the dialog opens. */
  screenshot?: (() => Promise<string | null | undefined>) | undefined
  /** The build's version, for the environment. */
  version?: string | undefined
  /** Open in the page flow through Dialog's inline, frozen at mount; docs and previews only. */
  inline?: boolean | undefined
}>()

const emit = defineEmits<{ 'update:modelValue': [open: boolean]; sent: [report: FeedbackReport] }>()
const { t } = useI18n()
const pair = useLivePair()

const form = reactive<{ type: FeedbackType; text: string; severity: FeedbackSeverity }>({ type: 'bug', text: '', severity: 'medium' })
const include = reactive({ technical: true, screenshot: true })
const snapshot = shallowRef<FeedbackSnapshot>()
const capturing = ref(false)
const sending = ref(false)
const textError = ref<string>()
const failure = ref<string>()
let generation = 0

const types = computed(() => [
  { value: 'bug', label: t('ui.feedbackBug') },
  { value: 'idea', label: t('ui.feedbackIdea') },
  { value: 'question', label: t('ui.feedbackQuestion') },
])
const severities = computed(() => (['low', 'medium', 'high', 'critical'] as const).map((value) => ({ value, label: t(`ui.severity${value[0]!.toUpperCase()}${value.slice(1)}`) })))

watch(() => props.modelValue || props.inline, async (open) => {
  if (!open) return
  const mine = ++generation
  failure.value = undefined
  capturing.value = true
  const frozen: FeedbackSnapshot = { environment: collectEnvironment(props.version), entries: (props.buffer ?? feedbackBuffer())?.entries() ?? [], screenshot: null }
  if (props.screenshot) {
    try {
      frozen.screenshot = (await props.screenshot()) ?? null
    } catch {
      // no screenshot: the report goes without one
    }
  }
  if (mine !== generation) return
  snapshot.value = frozen
  capturing.value = false
}, { immediate: true })

const open = computed({
  get: () => Boolean(props.modelValue || props.inline) && !capturing.value && snapshot.value !== undefined,
  set: (value: boolean) => { if (!value) emit('update:modelValue', false) },
})
const report = computed(() => (snapshot.value ? buildReport(form, snapshot.value, include) : undefined))

async function submit(): Promise<void> {
  const body = report.value
  if (body === undefined) return
  textError.value = body.text === '' ? t('ui.feedbackText') : undefined
  if (textError.value) return
  sending.value = true
  failure.value = undefined
  try {
    await pair.value.client.call(props.send, {}, body)
    emit('sent', body)
    emit('update:modelValue', false)
    form.text = ''
  } catch {
    failure.value = t('ui.sendFailed')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <Dialog v-model="open" class="ui-feedback-capture" :inline="inline" :title="t('ui.feedback')" size="lg">
    <div v-if="report" class="ui-feedback-capture__form">
      <Banner v-if="failure" variant="danger">{{ failure }}</Banner>
      <div class="ui-feedback-capture__row">
        <Field :label="t('ui.feedbackType')">
          <Select name="type" :model-value="form.type" :options="types" @update:model-value="(value) => (form.type = value as FeedbackType)" />
        </Field>
        <Field v-if="form.type === 'bug'" :label="t('ui.severity')">
          <Select name="severity" :model-value="form.severity" :options="severities" @update:model-value="(value) => (form.severity = value as FeedbackSeverity)" />
        </Field>
      </div>
      <Field :label="t('ui.feedbackText')" :error="textError" required>
        <Textarea v-model="form.text" name="text" :rows="4" />
      </Field>
      <Checkbox v-model="include.technical" name="technical" :label="t('ui.includeTechnical')" :description="t('ui.includeTechnicalHint')" />
      <Checkbox v-if="snapshot?.screenshot" v-model="include.screenshot" name="screenshot" :label="t('ui.includeScreenshot')" />
      <details class="ui-feedback-capture__preview">
        <summary>{{ t('ui.whatIsSent') }}</summary>
        <pre class="ui-feedback-capture__json">{{ previewText(report) }}</pre>
        <img v-if="report.screenshot" class="ui-feedback-capture__shot" :src="report.screenshot" :alt="t('ui.screenshotAlt')">
      </details>
    </div>
    <template #actions>
      <Button @click="open = false">{{ t('ui.cancel') }}</Button>
      <Button variant="primary" :loading="sending" :data-action="send.name" @click="submit">{{ t('ui.send') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.ui-feedback-capture__form { display: flex; flex-direction: column; gap: var(--ui-space-4); }
.ui-feedback-capture__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: var(--ui-space-4); }
.ui-feedback-capture__preview summary { cursor: pointer; font-size: var(--ui-text-sm); color: var(--ui-ink-2); }
.ui-feedback-capture__json {
  max-height: 16rem;
  margin: var(--ui-space-2) 0 0;
  padding: var(--ui-space-3);
  overflow: auto;
  background: var(--ui-surface-2);
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-text-xs);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ui-feedback-capture__shot { display: block; max-width: 100%; margin-top: var(--ui-space-2); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-sm); }
</style>
