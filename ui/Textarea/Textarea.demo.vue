<script setup lang="ts">
import { ref } from 'vue'
import Textarea from './Textarea.vue'
import Field from '../Field/Field.vue'

const note = ref('')
const bio = ref('Grows with its content.\nLine two.\nLine three.\nLine four.\nLine five.')
const reason = ref('x')
</script>

<template>
  <section class="stack">
    <h2>Default and growing</h2>
    <Textarea v-model="note" name="note" placeholder="Write a note" />
    <Textarea v-model="bio" name="bio" :rows="2" />
    <p class="muted">note: {{ note.length }} characters</p>
  </section>
  <section class="stack">
    <h2>In a Field</h2>
    <Field label="Comment" hint="Markdown is not rendered." required>
      <Textarea v-model="note" name="comment" :rows="2" :maxlength="280" placeholder="Up to 280 characters" />
    </Field>
    <Field label="Reason" error="A reason needs at least ten characters.">
      <Textarea v-model="reason" name="reason" :rows="2" />
    </Field>
  </section>
  <section>
    <h2>Read only and disabled</h2>
    <div class="row">
      <Textarea model-value="Read only text." readonly :rows="2" />
      <Textarea model-value="Disabled text." disabled :rows="2" />
    </div>
  </section>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--ui-space-3); max-width: 28rem; }
.row { display: flex; gap: var(--ui-space-3); max-width: 28rem; }
.muted { color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
