# govengers/ui - the collection's own tasks. Target projects get their tasks from templates/.

default:
    @just --list

install:
    bun install

# Everything CI runs.
ci: check index-check contrast lint template-check test build

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

test:
    bun test scripts ui demo/src

# The demonstrator on http://localhost:5173
demo:
    bun run demo

build:
    bun run build

# Render every component, block and page in the default preset, light and dark, into screenshots/.
screenshots:
    bun run screenshots
