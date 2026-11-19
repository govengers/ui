<script setup lang="ts">
// MarkdownView: renders markdown from a prop as sanitised HTML (markdown.ts: marked, then
// DOMPurify); task lists, tables, code, safe links and images. The source is a prop, never a slot.
import { computed } from 'vue'
import { createMarkdownRenderer } from './markdown'

const props = defineProps<{
  source: string
}>()

const html = computed(() => render(props.source))
</script>

<script lang="ts">
// One renderer per app, bound to the browser window (none under SSR: escaped text). A project
// that shows images from a storage host adds its origin here: { imageHosts: ['https://files.example'] }.
const render = createMarkdownRenderer(typeof window === 'undefined' ? undefined : window)
</script>

<template>
  <div class="ui-markdown" v-html="html" />
</template>

<style scoped>
.ui-markdown { overflow-wrap: anywhere; line-height: var(--ui-leading); }
.ui-markdown :deep(:is(p, ul, ol, pre, table, blockquote)) { margin: 0 0 var(--ui-space-3); }
.ui-markdown :deep(:is(p, ul, ol, blockquote)) { max-width: var(--ui-measure); }
.ui-markdown :deep(p:has(img)) { max-width: none; }
.ui-markdown :deep(:is(h1, h2, h3, h4, h5, h6)) { margin: var(--ui-space-4) 0 var(--ui-space-2); }
.ui-markdown :deep(h1) { font-size: var(--ui-text-xl); }
.ui-markdown :deep(h2) { font-size: var(--ui-text-lg); }
.ui-markdown :deep(:is(h3, h4, h5, h6)) { font-size: var(--ui-text-md); }
.ui-markdown :deep(:is(ul, ol)) { padding-inline-start: var(--ui-space-6); }
.ui-markdown :deep(li > input[type="checkbox"]) { margin: 0 var(--ui-space-2) 0 calc(var(--ui-space-5) * -1); vertical-align: middle; }
.ui-markdown :deep(li:has(> input[type="checkbox"])) { list-style: none; }
.ui-markdown :deep(code) { padding: 0 var(--ui-space-1); border-radius: var(--ui-radius-sm); background: var(--ui-sunk); }
.ui-markdown :deep(pre) { padding: var(--ui-space-3); overflow-x: auto; border-radius: var(--ui-radius-control); background: var(--ui-sunk); }
.ui-markdown :deep(pre code) { padding: 0; background: none; }
.ui-markdown :deep(blockquote) { padding-inline-start: var(--ui-space-3); border-inline-start: 2px solid var(--ui-border-strong); color: var(--ui-ink-2); }
.ui-markdown :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
.ui-markdown :deep(:is(th, td)) { padding: var(--ui-space-1) var(--ui-space-3); border: var(--ui-border-width) solid var(--ui-border); text-align: start; }
.ui-markdown :deep(th) { background: var(--ui-surface-2); font-weight: var(--ui-weight-semibold); }
.ui-markdown :deep(img) { max-width: 100%; height: auto; border-radius: var(--ui-radius-sm); }
.ui-markdown > :deep(:first-child) { margin-block-start: 0; }
.ui-markdown > :deep(:last-child) { margin-block-end: 0; }
.ui-markdown :deep(hr) { border: 0; border-block-start: var(--ui-border-width) solid var(--ui-divider); margin: var(--ui-space-4) 0; }
</style>
