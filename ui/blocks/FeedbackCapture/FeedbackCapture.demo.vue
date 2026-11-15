<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { calls } from '@/fake/api'
import Button from '../../Button/Button.vue'
import FeedbackCapture from './FeedbackCapture.vue'
import type { FeedbackReport } from './feedback'

const open = ref(false)
const withShot = ref(false)
const sent = ref<FeedbackReport>()

function logError(): void {
  console.error('Saving the customer failed', { status: 500, request: { email: 'ada@example.com', password: 'hunter 2' }, headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl' } })
}
async function failRequest(): Promise<void> {
  // Port 9 refuses at once: a failed request without a status, its token redacted in the buffer.
  await fetch('http://127.0.0.1:9/api/v1/orders?token=abc123').catch(() => undefined)
}

// The demo's stand-in for html2canvas-pro: a small drawn image, so the dialog shows the attachment.
async function screenshot(): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 180
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ui-surface-2') || 'gray'
    context.fillRect(0, 0, 320, 180)
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ui-ink') || 'black'
    context.font = '16px sans-serif'
    context.fillText('The page, as it looked', 20, 90)
  }
  return canvas.toDataURL('image/png')
}

function report(shot: boolean): void {
  withShot.value = shot
  open.value = true
}

// The inline preview mounts after a logged error, with its preview unfolded for the screenshot.
logError()
const inline = ref<HTMLElement | null>(null)
onMounted(() => setTimeout(() => inline.value?.querySelector('details')?.setAttribute('open', ''), 100))
</script>

<template>
  <section>
    <h2>Report: technical details frozen on open, preview of exactly what is sent</h2>
    <div class="row">
      <Button @click="logError">Log an error with a password</Button>
      <Button @click="failRequest">A request fails</Button>
      <Button variant="primary" @click="report(false)">Send feedback</Button>
      <Button @click="report(true)">Send feedback with a screenshot</Button>
    </div>
    <FeedbackCapture v-model="open" :send="calls.createFeedback" :screenshot="withShot ? screenshot : undefined" version="2.4.1" @sent="sent = $event" />
    <p v-if="sent" class="muted" role="status">Sent a {{ sent.type }} report with {{ sent.entries.length }} entries{{ sent.screenshot ? ' and a screenshot' : '' }}.</p>
  </section>

  <section>
    <h2>Inline preview: the logged error, redacted, in exactly what will be sent</h2>
    <div ref="inline"><FeedbackCapture inline :send="calls.createFeedback" version="2.4.1" /></div>
  </section>
</template>

<style scoped>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-3); }
.muted { margin-top: var(--ui-space-3); color: var(--ui-muted); font-size: var(--ui-text-sm); }
</style>
