# Manifesto

What govengers/ui believes. Every decision in `docs/design.md` traces back to one of these.

## P1 Copy, never import

A component you copied is yours. No version to follow, no breaking change to absorb, no upstream
to convince before a local fix. The price is that improvements travel by copying again, and we pay
it gladly: the header line in every copied file says where it came from.

## P2 Agent experience over developer experience

UI frameworks were built for the average human developer: auto-imports, plugins, config that
resolves names at build time. An agent pays for every piece of magic with a wrong guess. Here,
everything is explicit, on disk, in one place, and grep-able:

- no auto-imports, no global registration, every import a visible relative path
- one way per job: one Button, one Table, one way to page, one way to show an error
- one screen per file: about 200 lines, else it is two files; the card sits next to the code
- stable names, no computed class names, no string-built keys
- convention lives in files, not in tooling
- whatever a script can check, a script checks; prose is for what it cannot

## P3 Design language first, then every page against it

Reinventing the interface per application is the waste this repository exists to end. A project
chooses a preset and writes its design contract before the first page; every page after that
picks a recipe. A page that looks different from the one before it is a defect, not a style.

## P4 Tokens are the only knob

Components read semantic tokens and nothing else. A preset changes tokens and nothing else. If a
look cannot be reached by tokens, the missing token is the fix, never a fork of the component.

## P5 Native first

`<dialog>`, `popover`, `<details>`, native inputs, CSS over JavaScript. The platform's behaviour
is tested by more people than ours will ever be, and a screen reader already knows it.

## P6 The accessibility tree is the agent tree

Labels, roles, names and focus order are not polish; they are the map the in-app agent and the
tests navigate by. A control without a name is invisible twice.

## P7 Measured, not claimed

A contrast ratio in a comment is a claim. The contrast script measures every pair of every preset
in both themes; the index is generated from the cards; screenshots exist for every demo. CI fails
when the files say something else than the code.

## P8 Livewire is the data path

Blocks and pages speak livewire: live reads, calls with idempotency, field errors from
`ApiError.fields`, presence, uploads. No second data layer, no store in between.

## P9 The application is agent-operable from the start

Chat, guide and drive are part of the shell, not an add-on. Every page declares what it is for,
every action declares its name; the same vocabulary serves the human, the visual driver and the
server-side tools.
