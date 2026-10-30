# Contributing

The whole content architecture exists so that **adding a lesson is one file**. This page is
that promise, spelled out.

If you are here to fix a bug or change the site rather than to write a lesson, skip to
[Working on the code](#working-on-the-code).

---

## Add a lesson in one file

### 1. Copy a lesson next to the one you are writing

Every lesson is a plain TypeScript file in `content/lessons/<module>/`, named for its slug.
There is no MDX, no CMS and no front matter. Pick one that resembles what you are writing and
copy it:

```sh
cp content/lessons/operators/macros.ts content/lessons/operators/registers.ts
```

That is the file the worked example further down builds, so you can follow this page top to
bottom without the path changing under you.

The six modules are `basics`, `operators`, `react-tsx`, `go`, `cpp` and `advanced` — the
`ModuleId` union in `content/types.ts`. The three language modules each teach on one realistic
source file (`content/lessons/go/source.ts` and its siblings) that every lesson in that module
reuses; `advanced` shares two smaller ones the same way.

Adding a _module_ rather than a lesson starts at that union: add the id, and the compiler
names the two other places it has to appear (`content/modules.ts` and the barrel map in
`content/lessons/index.ts`).

### 2. Edit it

The full type is in [`content/types.ts`](content/types.ts) — read it, the comments there are
the specification. Every field:

| Field         | What it is                                                                               |
| ------------- | ---------------------------------------------------------------------------------------- |
| `slug`        | The URL segment, `/learn/<slug>`. Unique across the **whole site**, not just the module. |
| `title`       | Shown as the `<h1>` and in the nav.                                                      |
| `module`      | The id of the module whose folder you are in. `ModuleId`, so a typo is a type error.     |
| `order`       | Position in the module. 1-based and **dense** — no gaps, no duplicates.                  |
| `keys`        | The keys this lesson teaches, rendered as keycaps on the curriculum card.                |
| `summary`     | One line for the curriculum index.                                                       |
| `explanation` | Two or three `{ heading, body }` blocks. Prose, not a reference table.                   |
| `language`    | `'text'`, `'tsx'`, `'go'` or `'cpp'`. Decides the syntax highlighting.                   |
| `exercises`   | Two to four of them. See below.                                                          |

`keys` and `motions` both take the [key notation](#key-notation) below, and the keycap
component normalises the two spellings of a named key: `Esc` and `<Esc>` render the same
cap. The existing lessons use both, so copy whichever your neighbour uses rather than
"fixing" it.

And each exercise:

| Field         | What it is                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `id`          | Unique within the lesson. **Stable** — it keys stored progress, so renaming it loses people's history.                |
| `prompt`      | What to do, in one sentence, addressed to a person.                                                                   |
| `startDoc`    | The buffer as it starts. `\n` only, and no trailing newline unless the exercise is about one.                         |
| `startCursor` | `{ line, ch }`, both **zero-based**.                                                                                  |
| `goal`        | What counts as solved. See [Goals](#goals).                                                                           |
| `solution`    | A key sequence you have checked reaches the goal. Required. Never shown to the learner.                               |
| `par`         | The ideal keystroke count — normally `solution`'s length.                                                             |
| `hint`        | Optional. Shown behind a "Show a hint" button.                                                                        |
| `setupKeys`   | Optional. Keys replayed to position the learner _before_ the attempt starts. Not counted.                             |
| `allowedKeys` | Optional. Fails the attempt on a key outside the list. Only for lessons about avoiding a crutch.                      |
| `motions`     | Required, non-empty. What this trains, in canonical notation: `dw`, `ci{`, `f`. Drives mastery and the drill sampler. |

`prompt`, `hint`, `summary` and every `body` support four inline constructs and nothing else —
no HTML:

| Written      | Renders as                |
| ------------ | ------------------------- |
| `[[dw]]`     | two keycaps, `d` then `w` |
| `[[<Esc>]]`  | one keycap labelled `Esc` |
| `[[f<lt>]]`  | keycaps `f` then `<`      |
| `` `code` `` | inline monospace          |
| `**bold**`   | bold                      |

### 3. Add two lines to the module barrel

`content/lessons/<module>/index.ts` is the only other file you touch:

```ts
import { lesson as registers } from './registers';
// ...
export const lessons: Lesson[] = [
  // ...
  macros,
  registers, // <- and here, in the position your `order` claims
];
```

That is the whole wiring. The registry picks it up, `/learn` lists it, `/learn/<slug>` renders
it, `Ctrl+j` walks to it, the drill sampler can draw from it, the cheatsheet links its motions
to it, and `/stats` counts it.

### 4. Run the check

```sh
npm run format
npm run verify
```

Format first. `verify` starts with `prettier --check` and the harness is its last step, so a
long `expected:` string that runs past 100 columns stops the run before it ever replays
anything.

`npm run verify` is format-check, lint, `tsc --noEmit`, the unit tests, and — the part that
matters here — `scripts/verify-exercises.ts`, which for every exercise on the site loads
`startDoc`, applies `startCursor` and `setupKeys`, replays your `solution` **through the real
CodeMirror + vim editor the site ships**, and asserts the goal is reached. It also checks the
shape: unique ids, dense order, coordinates inside their own document, a `par` that is honest
against the solution, and the `<lt>` escape.

A failure prints the goal, the solution, the cursor, the mode, and the document line by line:

```
  registers#yank-to-a: solution does not reach its goal
  goal      the buffer matches exactly
  solution  "\"ayyj\"ap"
  cursor    {line:2, ch:0}   mode normal
  document after replay:
     0 "keep me"
     1 "noise"
     2 "keep me"
     3 "noise"
```

That one is the worked example below with `G` changed to `j`: the put landed after line 2
instead of at the end of the file, and the harness shows you the buffer it actually produced
rather than making you guess.

**Fix the exercise, not the check.** If a goal is unreachable, the coordinates or the goal are
wrong. A green run that was made green by loosening an assertion is worse than a red one: it
ships a lesson nobody can finish, and there is no support inbox to complain to.

---

## A complete worked example

This is a whole lesson, start to finish. It is not in the curriculum — it is here to be
copied — but every line of it was run through `npm run verify` and both exercises reach their
goals through the real editor.

`content/lessons/operators/registers.ts`:

```ts
import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'registers',
  title: 'Named registers',
  module: 'operators',
  order: 13,
  keys: ['"', 'y', 'p'],
  summary: 'Yank into a named drawer so the next delete cannot overwrite it.',
  language: 'text',
  explanation: [
    {
      heading: 'The unnamed register forgets',
      body:
        'Every [[yy]] and every [[dd]] lands in the same place, and each one wipes the last. ' +
        'Yank a line, delete something on the way to where it goes, and the thing you ' +
        'wanted to paste is gone.',
    },
    {
      heading: 'Twenty-six drawers',
      body:
        'Put `"a` in front of a command and it uses register `a` instead: `"ayy` yanks into ' +
        '`a`, and `"ap` puts from `a`. Deletes in between land in the unnamed register and ' +
        'leave `a` alone. There is one drawer for every letter.',
    },
  ],
  exercises: [
    {
      id: 'yank-to-a',
      prompt: 'Yank the first line into register `a`, then put it below the last line.',
      startDoc: 'keep me\nnoise\nnoise',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'keep me\nnoise\nnoise\nkeep me' },
      solution: '"ayyG"ap',
      par: 8,
      hint: 'Prefix both halves: `"a` before the [[yy]] and `"a` before the [[p]].',
      motions: ['"', 'yy', 'p'],
    },
    {
      id: 'survives-a-delete',
      prompt: 'Register `a` already holds `keep me`. Delete line 2, then put `a` at the end.',
      startDoc: 'keep me\ndelete me',
      startCursor: { line: 0, ch: 0 },
      setupKeys: '"ayyj',
      goal: { type: 'doc', expected: 'keep me\nkeep me' },
      solution: 'dd"ap',
      par: 5,
      hint: 'The [[dd]] fills the unnamed register. `"ap` is not reading that one.',
      motions: ['"', 'dd', 'p'],
    },
  ],
};
```

Then two lines in `content/lessons/operators/index.ts`:

```ts
import { lesson as registers } from './registers';
// ...
export const lessons: Lesson[] = [
  // ...
  macros,
  registers,
];
```

Things worth noticing in it:

- **`order: 13` follows `macros` at 12.** Dense and 1-based. The registry asserts this at
  import time, so a gap fails `next build` rather than 404ing quietly at runtime.
- **The second exercise uses `setupKeys` to establish a premise.** `"ayyj` fills register `a`
  and moves down before the clock starts, so the exercise can be about the thing it is
  teaching — that a delete in between does not clobber `a` — rather than about setting it up.
  Setup keys are never counted against the learner.
- **`par` is the length of `solution`.** `"ayyG"ap` is eight keys, so par is 8. Count the way
  the learner presses: `dw` is 2, `ci"clay<Esc>` is 10.
- **`motions` lists what is being trained, not every key pressed.** These two feed the heatmap
  and the weakness-weighted drill, so `'"'`, `'yy'` and `'p'` are the useful entries; the `G`
  is incidental navigation.
- **Both goals are `doc`.** These are three-line buffers, so an exact match is readable in a
  diff. On a forty-line source file it would not be — use `docContains` / `docExcludes` there.
- **Neither goal mentions the route.** `"ayyG"ap` is the solution, but `"ayy` then `G` then
  `"ap` typed as three separate thoughts passes identically, and so does putting with `"aP`
  from the right line. That is the point.

---

## Goals

`Goal` is a union in `content/types.ts`. In rough order of how often you want them:

| Goal                                          | Use it when                                                                                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ type: 'doc', expected }`                   | The whole buffer, exactly. Best for short `text` exercises.                                                                                         |
| `{ type: 'docContains', expected }`           | A substring appears. **Use this on the 40-line real-code lessons** — an exact-`doc` goal on a real source file is brittle and unreadable in a diff. |
| `{ type: 'docExcludes', expected }`           | Something is gone. The natural pair for a deletion.                                                                                                 |
| `{ type: 'cursorOnText', text, occurrence? }` | The learner navigated somewhere, and the exact column is not the point.                                                                             |
| `{ type: 'cursor', line, ch }`                | The exact column _is_ the point. Both zero-based. Count carefully.                                                                                  |
| `{ type: 'mode', mode }`                      | The lesson is about entering a mode.                                                                                                                |
| `{ type: 'selection', from, to }`             | A visual selection. `to` is **exclusive**. Not usable for `Ctrl+v`, which is N ranges — use `mode` plus `doc` there.                                |
| `{ type: 'register', name, expected }`        | A yank lesson. `'"'` is the unnamed register.                                                                                                       |
| `{ type: 'all', goals }`                      | All of them at once. Commonly a `doc` plus a `mode: 'normal'` so the learner has to leave insert mode.                                              |

### The rule behind all of them

**Validate by outcome, never by keystrokes.** `evaluateGoal` receives a goal and a snapshot of
the resulting editor state, and deliberately cannot see what the learner typed —
`EditorSnapshot` carries no key history. `dw`, `de` and `vex` are all correct if the buffer
matches. Never write a goal that tries to require a particular route; keystroke counts feed
the efficiency score and nothing else.

---

## Key notation

`solution` and `setupKeys` use vim's own notation. A named key goes in angle brackets:

```
<Esc> <CR> <Tab> <Space> <BS> <C-d> <C-r> <C-v> <C-o>
```

Everything else is a literal character. **A literal `<` is written `<lt>`**, exactly as in real
vim, because a bare `<` opens a named-key sequence and cannot be a literal. So `f<` is
`f<lt>` and `ci<` is `ci<lt>`. A literal `>` needs no escape: `t>` is just `t>`.

```ts
solution: '12G',
solution: '/return<CR>',
solution: 'ci"clay<Esc>',
solution: 'f<lt>ci<lt>section<Esc>',
solution: '<C-v>jjI// <Esc>',
```

`npm run verify` catches a bare `<` for you, but the error is easier to read if you never
write one.

---

## Where the editor differs from real vim

The content is written against the **shipped editor** (`@replit/codemirror-vim`), which is what
your `solution` is replayed through. It differs from `vim -u NONE` in a few places that will
otherwise cost you an evening. Do not "correct" these towards vim:

- `cw` keeps the trailing space. It behaves like `ce`.
- Multi-line `di{` / `ci{` is characterwise, so the braces collapse onto one line. Real vim
  leaves them on their own lines. Prefer `docExcludes` on the block's _contents_ over a
  `docContains` that asserts the brace layout.
- `%` does not match JSX tags — `<` and `>` are excluded. Real vim without `matchit` behaves
  the same. Use `f<lt>` / `t>` to hop between tags.
- `dd` on the last line of a buffer leaves a stray newline in the register.
- `k` on line 0 moves the cursor to column 0 rather than doing nothing.
- `u` uses CodeMirror's time-grouped undo, not vim's insert-session grouping. It matches at
  typing speed and diverges after a pause of about 500 ms mid-insert.
- Avoid `dap` on the final paragraph of a buffer; the three engines disagree about it.
- `:s` patterns are JavaScript `RegExp`, not vim's dialect: groups are `(…)` not `\(…\)`,
  one-or-more is `+` not `\+`, and a backreference is `$1` not `\1`.
- The ex surface is the engine's own `defaultExCommandMap`: `:g`, `:v`, `:norm`, `:s`, `:d`,
  `:y`, `:pu`, `:j`, `:sort` and the file and map families. `:m` and `:t` are silent no-ops,
  and an ex range taken from a visual selection is wrong — use line numbers.
- A macro does not stop at the end of the buffer. `j` on the last line is a no-op here rather
  than a failed motion, so an over-large count keeps editing that line. Count exactly.
- `r` followed by `:`, `/` or `?` cannot be replayed: `feedKeys` reads the second key as a
  prompt opening and drops the rest of the solution silently. Pick another replacement
  character — `s` usually reads better anyway.

---

## What a good exercise looks like

- **One idea.** If the prompt needs an "and", it is two exercises.
- **Write to a person, not a puzzle.** "Delete the unused import on line 3" beats "make the
  buffer look like this".
- **The buffer should look like something.** A learner remembers `if err != nil` and forgets
  `foo bar baz`. Every advanced module earns its keep by using a file somebody might have
  written.
- **Vary the shape.** Four prompts in a row that all read "Delete the X on line N" teach the
  motion and bore the reader.
- **Let the goal be generous.** `docContains` where the exercise is about one edit inside a
  large file; `cursorOnText` where "get to the function" is the skill and the column is not.
- **Set `par` honestly.** It is the ideal count, not a limit — exceeding it never fails an
  exercise, it only moves the efficiency number.
- **Reach for `allowedKeys` almost never.** It exists for `['h','j','k','l']` in the hjkl
  lesson, where avoiding the arrow keys is the entire point. Anywhere else it punishes a
  learner for finding a route you did not think of, which is the opposite of what this site is.
- **Don't build a `register` goal on a value a previous exercise might leave behind.** Registers
  are global to the vim module and outlive the editor; the runner clears them between attempts,
  but a goal that could read true at mount is a goal that solves itself.

---

## Working on the code

### Before you commit

```sh
npm run format     # Prettier, pinned to an exact version on purpose
npm run verify     # format:check, lint, tsc, unit tests, exercise replay
```

If you have touched layout — a grid, a width, an overflow rule, anything that decides how
wide something is allowed to get — run the browser gate too:

```sh
npx playwright install chromium   # once, ~177 MB, never pulled by npm ci
npm run build                     # e2e serves the built output, not next dev
npm run e2e                       # 69 checks, ~45s
```

`e2e/layout.spec.ts` is where a fault that only a real browser can see gets pinned: every
route at three widths in both themes asserting the page never scrolls sideways, the console
stays clean and nothing leaves the origin, plus one named test per bug that has actually been
reproduced. It is deliberately outside `verify` — `verify` stays a couple of seconds with no
browser in it — and runs as its own CI job.

CI runs `npm run verify` then `npm run build`, and `npm run e2e` in a second job, so those
three commands are the whole gate.

**If you changed what a page renders, `npm run build` will fail once and tell you why.** The
site serves a Content-Security-Policy that names a SHA-256 hash for every inline script on
every route, and those hashes are committed in `csp-hashes.json` because `next.config.ts`
reads them while it builds. A page whose output changed no longer matches. The fix is two
commands and a file:

```sh
npm run csp:hashes   # rewrite csp-hashes.json from the build you just made
npm run build        # build again, so the header rules carry the new set
git add csp-hashes.json
```

`next dev` never enforces it — its own overlay scripts cannot be hashed in advance — so this
only ever shows up at build time. Adding a lesson does not trigger it; changing a component,
the layout or the theme script does.

The Prettier version is pinned without a caret because its output changes between minor
releases — two contributors on different minors reformat each other's files forever. Please
don't widen it.

If you would rather not think about formatting, opt into the repo's hook:

```sh
git config core.hooksPath .githooks
```

It formats staged files with the repo's own Prettier and re-stages them. Nothing installs it
for you, and CI is the actual enforcement.

### The rules that are not negotiable

**No sign-in, no paywall, no account, no backend. Ever.** No auth, no database, no email
capture, no "create an account to save your progress" modal, no locked lesson, no rate limit.
No API routes, no environment variables, no server-side state, no analytics SDK. If you need a
user identity, you don't — use `localStorage`. Copy that merely _hints_ at a gate ("upgrade",
"free tier", "sign in to continue") is a bug, and the reason this project exists is that the
alternatives put a gate exactly there.

Three more, each enforced by a lint rule that explains itself when it fires:

- **No `dangerouslySetInnerHTML`.** Lesson prose is string data; render it through
  `components/prose/RichText.tsx`, and add a construct to that parser if you need one.
- **No `defaultKeymap` or `basicSetup` from `@codemirror/*`.** On macOS they fold in emacs
  bindings, and `Ctrl-k` wipes to end of line while the learner is in insert mode.
- **No importing the reference vim engine.** It silently mis-executes block visual, redo,
  marks, registers and macros — it does not error, it types the rest of your sequence into the
  buffer as literal text.

### Tests

`npm test` (`scripts/test.mjs`) finds every `__tests__/**/*.test.{ts,tsx}` in the repo and runs
them with `node:test`. Put a test next to what it tests, in a `__tests__` directory, and it runs;
a file that declares no tests fails the run rather than counting as a pass.
There is no heavier framework on purpose.

`content/types.ts` is the contract every lesson in the project is written against. Changing it
is a breaking change for ~135 hand-written exercises, so raise it in an issue first.

### Where the comments point

Comments through the tree cite `docs/CONTRACT.md §N`. That is
[`docs/CONTRACT.md`](docs/CONTRACT.md), the specification this site was built against, and
its section numbers are stable precisely so those citations keep resolving. Where a section
has been superseded by a file in the repository it says so and names the file; where it
carries a decision and the reason for it, it is still the answer. The rest of `docs/` is
measured evidence — the dark palette's contrast numbers, the icon at 16 pixels, the layout
faults a real browser found.

### Pull requests

Small ones. Say what changed and confirm `npm run verify` passes — for a lesson, that is the
whole review, because the harness has already proved the exercises are solvable.
