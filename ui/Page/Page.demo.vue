<script setup lang="ts">
import Page from './Page.vue'
import PageHeader from '../PageHeader/PageHeader.vue'
</script>

<template>
  <section>
    <h2>Content width with a header</h2>
    <div class="frame">
      <Page width="content" data-page="demo.page">
        <PageHeader title="Profile" subtitle="How others see you." />
        <div class="box">a card would be here</div>
        <div class="box">and a form here</div>
      </Page>
    </div>
  </section>
</template>

<style scoped>
.frame { background: var(--ui-sunk); border-radius: var(--ui-radius-card); }
.box { background: var(--ui-surface); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); padding: var(--ui-card-p); color: var(--ui-muted); }
</style>
