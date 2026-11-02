<script setup lang="ts">
import Avatar from './Avatar.vue'

// A data URL keeps the demo offline: a soft gradient standing in for a photo.
const photo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c28b"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fff" fill-opacity=".85"/><path d="M12 60c2-12 10-18 20-18s18 6 20 18z" fill="#fff" fill-opacity=".85"/></svg>')
</script>

<template>
  <section>
    <h2>Initials and sizes</h2>
    <div class="row">
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" />
      <Avatar name="Ada Lovelace" size="lg" />
      <Avatar name="grace" />
      <Avatar name="Émile Zola Durand" />
    </div>
  </section>
  <section>
    <h2>Picture and broken picture</h2>
    <div class="row">
      <Avatar name="Alan Turing" :src="photo" size="sm" />
      <Avatar name="Alan Turing" :src="photo" />
      <Avatar name="Alan Turing" :src="photo" size="lg" />
      <Avatar name="Broken Link" src="/does-not-exist.png" />
    </div>
  </section>
  <section>
    <h2>Status</h2>
    <div class="row">
      <Avatar name="Ada Lovelace" status="online" />
      <Avatar name="Alan Turing" :src="photo" status="busy" />
      <Avatar name="Grace Hopper" status="offline" />
      <Avatar name="Grace Hopper" status="online" size="lg" />
      <Avatar name="Grace Hopper" status="busy" size="sm" />
    </div>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; gap: var(--ui-space-4); align-items: center; }
</style>
