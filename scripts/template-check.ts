// Scaffolds templates/project the way start-project lays it out (D61) into a temporary target and
// runs the target's gates there: vue-tsc, ui-lint, app-map and the changelog parse. Catches a
// template that imports a file no stage provides or no longer type-checks against the pieces.
// `just template-check`.

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseChangelogs } from '../ui/changelog'

const root = join(import.meta.dir, '..')
const target = mkdtempSync(join(tmpdir(), 'govengers-ui-template-'))
const notCopied = (path: string): boolean => !/\.(md|demo\.vue|test\.ts)$/.test(path)

function copy(from: string, to: string, filter: (path: string) => boolean = notCopied): void {
  mkdirSync(join(target, to, '..'), { recursive: true })
  cpSync(join(root, from), join(target, to), { recursive: true, filter })
}

function run(command: string, ...args: string[]): void {
  const result = spawnSync(command, args, { cwd: target, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${target}`)
}

try {
  copy('ui', 'src/ui')
  copy('pages/LoginPage', 'src/pages/LoginPage')
  copy('demo/src/api/runtime.ts', 'src/api/runtime.ts') // stands in for the generated client
  copy('demo/src/api/vue.ts', 'src/api/vue.ts')
  copy('scripts/fixtures/api.ts', 'src/api/api.ts') // the declarations the shell names
  for (const file of ['main.ts', 'App.vue', 'LoginRoute.vue', 'session.ts', 'router.ts', 'changelog.ts']) copy(`templates/project/${file}`, `src/${file}`)
  copy('templates/project/Home.vue', 'src/pages/Home/Home.vue')
  copy('templates/project/changelog', 'changelog', () => true) // markdown is the content here
  copy('templates/project/vite.config.ts', 'vite.config.ts')
  copy('templates/project/app-map.ts', 'scripts/app-map.ts')
  copy('scripts/ui-lint.ts', 'scripts/ui-lint.ts')
  copy('env.d.ts', 'env.d.ts')
  symlinkSync(join(root, 'node_modules'), join(target, 'node_modules'))
  writeFileSync(join(target, 'package.json'), '{ "name": "template-check", "private": true, "type": "module" }\n')
  writeFileSync(join(target, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      strict: true, exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true, verbatimModuleSyntax: true,
      isolatedModules: true, skipLibCheck: true, noEmit: true, jsx: 'preserve', types: ['bun'], baseUrl: '.', paths: { '@/*': ['src/*'] },
    },
    include: ['src/**/*', 'scripts/**/*', 'env.d.ts', 'vite.config.ts'],
  }))
  run('bunx', 'vue-tsc', '--noEmit', '-p', 'tsconfig.json')
  run('bun', 'scripts/ui-lint.ts', 'src/ui', 'src/pages')
  run('bun', 'scripts/app-map.ts')
  const changelog = join(target, 'changelog')
  const { lines, errors } = parseChangelogs(Object.fromEntries(readdirSync(changelog).map((name) => [`/changelog/${name}`, readFileSync(join(changelog, name), 'utf8')])))
  if (errors.length > 0 || lines.length === 0) throw new Error(`the starter changelog does not parse:\n${errors.join('\n')}`)
  console.log('templates/project: type-checks, lints and writes app-map.json in a scaffolded target')
} finally {
  rmSync(target, { recursive: true, force: true })
}
