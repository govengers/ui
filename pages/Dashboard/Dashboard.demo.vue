<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { engine } from '@/fake/live'
import Dashboard from './Dashboard.vue'
import { messages } from './messages'
import WhatsNew from '../../ui/blocks/WhatsNew/WhatsNew.vue'
import { markSeen } from '../../ui/blocks/WhatsNew/whatsNew'

const { t } = useI18n({ useScope: 'global', messages })

// The notes would open over the page on every fresh visit; they are shown inline below instead.
markSeen('1.0.0')

// A random change every two seconds, so the tiles and the recent orders move.
const ticker = setInterval(() => engine.store.tick(), 2000)
onUnmounted(() => clearInterval(ticker))
</script>

<template>
  <section>
    <h2>The page, framed; a random change every two seconds</h2>
    <div class="frame"><Dashboard /></div>
  </section>
  <section>
    <h2>What's new for 1.0.0 (opens once per version on the page; inline here)</h2>
    <WhatsNew version="1.0.0" inline>
      <h3>{{ t('home.dashboard.whatsNew.heading') }}</h3>
      <ul>
        <li>{{ t('home.dashboard.whatsNew.dashboard') }}</li>
        <li>{{ t('home.dashboard.whatsNew.settings') }}</li>
      </ul>
    </WhatsNew>
  </section>
</template>

<style scoped>
/* DemoPage spaces every demo <section>; a Card rendered as a section inside the page must not get that margin. */
.frame :deep(section) { margin-bottom: 0; }
.frame { background: var(--ui-bg); border: var(--ui-border-width) solid var(--ui-border); border-radius: var(--ui-radius-card); }
</style>
