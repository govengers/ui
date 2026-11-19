# govengers/ui - the collection's own tasks. Target projects get their tasks from templates/.

default:
    @just --list

install:
    bun install

# Everything CI runs, the tests as CI runs them (one process, fixed order).
ci: check index-check contrast lint template-check test-ci build

# Type-check every component, page, script and the demo.
check:
    bun run check

# Regenerate INDEX.md from the cards' front matter.
index:
    bun run index

# Fail when INDEX.md is not what the cards say.
index-check:
    bun scripts/index.ts --check

# Measure every text and surface pair of every preset in both themes.
contrast:
    bun run contrast

# The same mechanical rules a target project runs on its pages.
lint:
    bun run lint

# Scaffold templates/project into a temporary target and run its gates there (D61).
template-check:
    bun scripts/template-check.ts

# The edit loop, under 2 s: four workers with the harness's reset after every test (D103; Bun 1.4.4 or later).
test:
    bun test --parallel=4 --no-isolate scripts ui pages demo/src

# The tests as the remote CI runs them: one process, fixed order, about 3.6 s (D103).
test-ci:
    bun test scripts ui pages demo/src

# The demonstrator on http://localhost:5173
demo:
    bun run demo

build:
    bun run build

# Render every component, block and page in the default preset, light and dark, into screenshots/.
screenshots:
    bun run screenshots

# List every control of every demo under 44 by 44 px on a touch screen, both densities (D87). Local, not in CI.
touch-probe *args:
    bun scripts/touch-probe.ts {{args}}
