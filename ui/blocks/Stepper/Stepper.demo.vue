<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLiveConnection } from '@/api/vue'
import { calls, live } from '@/fake/api'
import Stepper from './Stepper.vue'
import type { StepItem } from './stepper'
import JobProgress from '../JobProgress/JobProgress.vue'
import Banner from '../../Banner/Banner.vue'
import Button from '../../Button/Button.vue'
import Field from '../../Field/Field.vue'
import Input from '../../Input/Input.vue'
import Switch from '../../Switch/Switch.vue'

const steps: StepItem[] = [
  { key: 'source', title: 'Source', description: 'What to export' },
  { key: 'options', title: 'Options', description: 'Rows to include', optional: true },
  { key: 'review', title: 'Review', description: 'Check, then start', action: 'startJob' },
  { key: 'run', title: 'Run', description: 'Save, then watch' },
]
const step = ref('source')
const name = ref('')
const churned = ref(false)
const busy = ref(false)
const error = ref<string>()
const jobId = ref<string>()
const succeeded = ref(false)
const entered = ref<string[]>([])
const finished = ref(false)
const connection = useLiveConnection()

const canContinue = computed(() => {
  if (step.value === 'source') return name.value.trim() !== ''
  if (step.value === 'run') return succeeded.value
  return true
})

// "Save then watch": the page owns Continue. Leaving review starts the job; only its success
// moves on, so a refusal stays on review with its message.
async function move(next: string) {
  if (step.value === 'review' && next === 'run' && jobId.value === undefined) {
    busy.value = true
    error.value = undefined
    try {
      jobId.value = (await connection.value.call(calls.startJob, {}, { kind: name.value })).id
    } catch (failure) {
      error.value = failure instanceof Error ? failure.message : String(failure)
      return
    } finally {
      busy.value = false
    }
  }
  step.value = next
}

function restart() {
  name.value = ''
  churned.value = false
  jobId.value = undefined
  succeeded.value = false
  finished.value = false
  step.value = 'source'
}

const short: StepItem[] = [
  { key: 'account', title: 'Account' },
  { key: 'team', title: 'Team' },
  { key: 'plan', title: 'Plan' },
]
const shortStep = ref('team')
</script>

<template>
  <section>
    <h2>Export wizard: the last step saves, then watches the job</h2>
    <Banner v-if="finished" variant="success">
      Export "{{ name }}" is done.
      <template #action><Button size="sm" @click="restart">Start over</Button></template>
    </Banner>
    <Stepper
      v-else
      :model-value="step"
      :steps="steps"
      :can-continue="canContinue"
      :busy="busy"
      finish-label="Done"
      @update:model-value="move"
      @enter="(key) => entered.push(key)"
      @finish="finished = true"
    >
      <template #default="{ step: current }">
        <Field v-if="current.key === 'source'" label="Export name" hint="Becomes the file name" required>
          <Input v-model="name" name="exportName" autocomplete="off" />
        </Field>
        <Switch v-else-if="current.key === 'options'" v-model="churned" name="includeChurned" label="Include churned customers" />
        <div v-else-if="current.key === 'review'" class="review">
          <p>Export <strong>{{ name }}</strong>, {{ churned ? 'with' : 'without' }} churned customers.</p>
          <p class="muted">Continue starts the export on the server; the next step follows it live.</p>
          <Banner v-if="error" variant="danger">{{ error }}</Banner>
        </div>
        <JobProgress
          v-else-if="current.key === 'run' && jobId"
          :target="live['jobs.item']"
          :id="jobId"
          :title="`Export ${name}`"
          @done="(job) => (succeeded = job.status === 'succeeded')"
        />
      </template>
    </Stepper>
    <p class="muted">entered: {{ entered.join(', ') }}</p>
  </section>

  <section>
    <h2>Linear, in a narrow container: compact vertical list, back only</h2>
    <div class="narrow">
      <Stepper v-model="shortStep" :steps="short" linear>
        <template #default="{ step: current, index }">
          <p>Step {{ index + 1 }}: {{ current.title }}. Account is done and can be revisited; Plan only through Continue.</p>
        </template>
      </Stepper>
    </div>
  </section>
</template>

<style scoped>
.review { display: flex; flex-direction: column; gap: var(--ui-space-3); }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
.narrow { max-width: 24rem; padding: var(--ui-space-4); border: var(--ui-border-width) dashed var(--ui-border); border-radius: var(--ui-radius-card); }
</style>
