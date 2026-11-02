// Discovers every *.demo.vue next to a card (D45: import.meta.glob is allowed in the demo only).
import type { Component } from 'vue'

const modules = import.meta.glob<{ default: Component }>(['../../ui/**/*.demo.vue', '../../pages/**/*.demo.vue'])

export interface Demo {
  name: string
  /** `ui`, `ui/blocks` or `pages`: the directory the piece lives in. */
  group: string
  load: () => Promise<{ default: Component }>
}

export const demos: Demo[] = Object.entries(modules)
  .map(([path, load]) => {
    const match = /\.\.\/\.\.\/(.+)\/([^/]+)\/\2\.demo\.vue$/.exec(path)
    if (!match) throw new Error(`demo path does not follow <dir>/<Name>/<Name>.demo.vue: ${path}`)
    return { name: match[2]!, group: match[1]!, load }
  })
  .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
