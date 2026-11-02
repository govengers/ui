// How a target project mounts govengers/ui (ui-start step 4). Merge into src/main.ts.
import { createApp, shallowRef } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import './ui/tokens.css'
import './ui/base.css'
import './ui/presets/neutral.css'
import { messages as uiMessages } from './ui/messages'
import { createLivePair, type LivePair } from './api/runtime'
import { livePlugin } from './api/vue'
import App from './App.vue'
import { routes } from './router'

// One pair per signed-in identity, replaced on login and logout (livewire D66).
const pairOf = (identity: string): LivePair => createLivePair({
  identity: () => identity,
  client: { baseURL: '/api/v1' },
  connection: { url: () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/v1/socket` },
})
export const pair = shallowRef(pairOf(''))

const i18n = createI18n({
  legacy: false,
  locale: navigator.language.startsWith('de') ? 'de' : 'en',
  fallbackLocale: 'en',
  // Page messages are mounted by each page folder's messages.ts; only the ui.* keys live here.
  messages: uiMessages,
})

createApp(App)
  .use(createRouter({ history: createWebHistory(), routes }))
  .use(i18n)
  .use(livePlugin(pair))
  .mount('#app')
