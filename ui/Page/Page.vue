<script setup lang="ts">
// Page: the content column of every page (D32). The root carries the page's data-page (D23),
// passed through from the page component. Width `content` for forms, `full` for lists.
withDefaults(defineProps<{
  width?: 'content' | 'page' | 'full'
}>(), { width: 'page' })
</script>

<template>
  <div class="ui-page" :data-width="width">
    <slot />
  </div>
</template>

<style scoped>
.ui-page {
  width: 100%;
  margin: 0 auto;
  padding: var(--ui-page-p);
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-6);
}
.ui-page[data-width="content"] { max-width: calc(var(--ui-content-max) + 2 * var(--ui-page-p)); }
.ui-page[data-width="page"] { max-width: calc(var(--ui-page-max) + 2 * var(--ui-page-p)); }
.ui-page[data-width="full"] { max-width: none; }
</style>
