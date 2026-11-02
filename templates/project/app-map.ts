// Generates src/app-map.json (D24, D48) from the router's route meta and every
// src/pages/**/actions.ts. Run with `bun scripts/app-map.ts`; the server embeds the file and
// hands it to the agent as its navigation and action vocabulary.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AgentAction, AgentPage, AppMap } from '../src/ui/agent/types'
import { routes } from '../src/router'

const root = join(import.meta.dir, '..')

const pages: AgentPage[] = routes
  .filter(route => route.meta?.['page'])
  .map(route => ({
    page: String(route.meta!['page']),
    title: String(route.meta!['title'] ?? ''),
    intent: String(route.meta!['intent'] ?? ''),
    path: route.path,
  }))

const actionModules = new Bun.Glob('src/pages/**/actions.ts').scanSync(root)
const actions: AgentAction[] = []
for (const file of actionModules) {
  const module = await import(join(root, file)) as { actions: AgentAction[] }
  actions.push(...module.actions)
}

const map: AppMap = { generatedAt: new Date().toISOString(), pages, actions }
writeFileSync(join(root, 'src', 'app-map.json'), JSON.stringify(map, null, 2) + '\n')
console.log(`app-map.json: ${pages.length} pages, ${actions.length} actions`)
