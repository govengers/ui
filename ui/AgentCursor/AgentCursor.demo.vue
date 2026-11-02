<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import Input from '../Input/Input.vue'
import { useAgentAction } from '../agent/registry'
import type { DrivePlan } from '../agent/types'
import AgentCursor from './AgentCursor.vue'

// createCustomer is declared mutating, so the cursor pauses on its button (D27).
useAgentAction({ name: 'createCustomer', description: 'Creates a customer', params: { name: 'The name' }, page: 'demo.cursor', mutating: true }, () => undefined)

const plan: DrivePlan = {
  goal: 'Create the customer Globex',
  steps: [
    { kind: 'fill', target: { field: 'name' }, value: 'Globex', say: 'Typing the name' },
    { kind: 'fill', target: { field: 'email' }, value: 'hello@globex.example', say: 'And the email' },
    { kind: 'click', target: { action: 'createCustomer' }, say: 'This creates Globex. Press Go, or click Create yourself.' },
  ],
}
const broken: DrivePlan = { goal: 'Missing target', steps: [{ kind: 'click', target: { action: 'nowhere' } }] }

const cursor = ref<InstanceType<typeof AgentCursor> | null>(null)
const running = shallowRef<DrivePlan | null>(plan)
const speed = ref(6)
const name = ref('')
const email = ref('')
const log = ref<string[]>([])
const created = ref('')

/** A fresh copy restarts the cursor even for the plan it runs already. */
function run(next: DrivePlan, pace: number) {
  speed.value = pace
  log.value = []
  created.value = ''
  running.value = { ...next }
}
</script>

<template>
  <section>
    <h2>Driving a form on load, paused on the mutating submit (D27)</h2>
    <form class="form" data-page="demo.cursor" @submit.prevent="created = `Created ${name}`">
      <Input v-model="name" name="name" aria-label="Name" placeholder="Name" />
      <Input v-model="email" name="email" type="email" aria-label="Email" placeholder="Email" />
      <Button type="submit" variant="primary" data-action="createCustomer">Create</Button>
    </form>
    <p v-if="created" role="status">{{ created }}</p>
  </section>
  <section data-agent-ui>
    <h2>Controls (marked data-agent-ui, so pressing them does not stop the plan)</h2>
    <div class="controls">
      <Button @click="run(plan, 1)"><template #icon><Icon name="play" /></template>Replay at human pace</Button>
      <Button @click="cursor?.stop()"><template #icon><Icon name="hand" /></template>Stop</Button>
      <Button @click="cursor?.resume()"><template #icon><Icon name="play" /></template>Resume</Button>
      <Button variant="ghost" @click="run(broken, 1)">Run a plan with a missing target</Button>
    </div>
    <ol class="log"><li v-for="(line, index) in log" :key="index">{{ line }}</li></ol>
  </section>
  <AgentCursor
    ref="cursor"
    :plan="running"
    :speed="speed"
    @step="log.push(`step ${$event + 1}`)"
    @done="log.push('done')"
    @stopped="log.push(`stopped at step ${$event + 1}`)"
    @error="log.push(`error: ${$event}`)"
  />
</template>

<style scoped>
.form { display: flex; flex-wrap: wrap; gap: var(--ui-space-3); align-items: center; margin-bottom: var(--ui-space-16); }
.form > :not(button) { width: 14rem; }
.controls { display: flex; flex-wrap: wrap; gap: var(--ui-space-2); }
.log { margin-top: var(--ui-space-3); font-size: var(--ui-text-sm); color: var(--ui-muted); }
</style>
