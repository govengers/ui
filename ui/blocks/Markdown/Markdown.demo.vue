<script setup lang="ts">
import { ref } from 'vue'
import { uploads, type FileItem } from '@/fake/api'
import { engine } from '@/fake/live'
import MarkdownEditor, { type MentionOption } from './MarkdownEditor.vue'
import MarkdownView from './MarkdownView.vue'
import Field from '../../Field/Field.vue'

const sample = `## Release checklist

Ship the **board** with _drag and drop_, see [the design notes](/docs/board) or [the spec](https://example.com/spec).

- [x] Columns from one live list
- [ ] Keyboard moves
- [ ] Phone layout

| Piece | Status |
|-------|--------|
| Board | review |
| Markdown | done |

\`\`\`ts
const rank = (above + below) / 2
\`\`\`

> Raw HTML stays text: <script>alert(1)<\/script> and [a script link](javascript:alert(1)) lose their power.`

const text = ref('Thanks @ada, the import works now. Paste or drop an image here, or type @ to mention someone.\n\n- [ ] Write the release note')
const empty = ref('')

function mentions(query: string): MentionOption[] {
  const needle = query.toLowerCase()
  return engine.store.tables.users
    .filter((user) => user.name.toLowerCase().includes(needle) || user.email.startsWith(needle))
    .map((user) => ({ value: user.email.split('@')[0] ?? user.id, label: user.name, hint: user.email }))
}
const imageUrl = (file: FileItem): string => file.url ?? ''
</script>

<template>
  <section class="narrow">
    <h2>MarkdownView: headings, task lists, tables, code, safe links</h2>
    <MarkdownView :source="sample" />
  </section>
  <section class="narrow">
    <h2>MarkdownEditor: toolbar, preview, image paste and drop, @ mentions</h2>
    <Field label="Comment">
      <MarkdownEditor v-model="text" name="comment" :upload="uploads.uploadFile" :image-url="imageUrl" :max-size="5 * 1024 * 1024" :mentions="mentions" />
    </Field>
  </section>
  <section class="narrow">
    <h2>Disabled, and without uploads or mentions</h2>
    <Field label="Description">
      <MarkdownEditor v-model="empty" name="description" placeholder="Describe the task in markdown" :rows="3" />
    </Field>
    <Field label="Locked">
      <MarkdownEditor :model-value="'Read **only**'" name="locked" :rows="2" disabled />
    </Field>
  </section>
</template>

<style scoped>
.narrow { max-width: 44rem; display: flex; flex-direction: column; gap: var(--ui-space-4); }
</style>
