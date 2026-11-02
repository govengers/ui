import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import '../../ui/tokens.css'
import '../../ui/base.css'
import { messages } from '../../ui/messages'
import App from './App.vue'
import DemoPage from './DemoPage.vue'
import Home from './Home.vue'
import './presets'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Home },
    { path: '/:group(.+)/:name', component: DemoPage, props: true },
  ],
})

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages })

createApp(App).use(router).use(i18n).mount('#app')
