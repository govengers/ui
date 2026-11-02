<script setup lang="ts">
import { onMounted, ref } from 'vue'
import FileUpload from './FileUpload.vue'
import Button from '../../Button/Button.vue'
import { live, uploads } from '@/fake/api'

type Uploader = { add(files: Iterable<File>): void }
const withList = ref<Uploader>()
const withoutList = ref<Uploader>()
const last = ref<string>()

function uploadReport(): void {
  withList.value?.add([new File(['%PDF-1.4 quarterly report'], 'report.pdf', { type: 'application/pdf' })])
}

// The visit starts one upload in each, so the progress and the size error show at once.
onMounted(() => {
  uploadReport()
  withoutList.value?.add([
    new File(['meeting notes'], 'notes.txt', { type: 'text/plain' }),
    new File([new Uint8Array(4096)], 'scan.png', { type: 'image/png' }),
    new File(['GIF89a'], 'animation.gif', { type: 'image/gif' }),
  ])
})
</script>

<template>
  <section class="narrow">
    <h2>Rows and progress from live.files</h2>
    <FileUpload
      ref="withList"
      :upload="uploads.uploadFile"
      :files="live.files"
      :max-size="5 * 1024 * 1024"
      :max-files="12"
      name="files"
      @uploaded="(file) => (last = file.name)"
    />
    <p class="row">
      <Button @click="uploadReport">Upload report.pdf</Button>
      <span v-if="last" role="status">Uploaded {{ last }}</span>
    </p>
  </section>
  <section class="narrow">
    <h2>Without a live list: an indeterminate bar, limits and refusals said inline</h2>
    <FileUpload ref="withoutList" :upload="uploads.uploadFile" :max-size="2048" :max-files="3" name="attachments" />
  </section>
</template>

<style scoped>
.narrow { max-width: 40rem; }
.row { display: flex; align-items: center; gap: var(--ui-space-3); margin-top: var(--ui-space-3); font-size: var(--ui-text-sm); }
</style>
