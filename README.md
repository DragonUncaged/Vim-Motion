# Vim Clay

Learn vim motions by doing them, in a real vim editor, in your browser.

![The Vim Clay home page in light mode: the headline beside a live vim editor on the line "the slow way is the long way", with a pending `d` in the status bar and the key strip](docs/screenshots/home-light.png#gh-light-mode-only)
![The Vim Clay home page in dark mode: the headline beside a live vim editor on the line "the slow way is the long way", with a pending `d` in the status bar and the key strip](docs/screenshots/home-dark.png#gh-dark-mode-only)

Forty-five lessons and 154 exercises, from `hjkl` up to block-visual edits on real `.tsx`, `.go`
and `.cpp` files. Every exercise is judged on the buffer you end up with, so `dw`, `de` and
`vex` all count if the text matches. There is a timed drill mode, a speedrun that races your
own previous best, a free-play sandbox with a help panel that reads your half-typed command,
a searchable 171-entry cheatsheet, and a stats page with a per-motion heatmap.

**No sign-in. No paywall. No account. No backend.** Every lesson, drill and statistic is open
to an anonymous visitor on first page load. Your progress lives in `localStorage`, and moves
between machines as a JSON file you export and import yourself.

## Screenshots

Each screen is shown in the theme that matches your GitHub setting.

The lesson index lists every module in order, with how much of each lesson you have finished.

![The lesson index in light mode: a "Pick up where you left off" panel at 67% and the Basic vim module with its lesson cards and completion rings](docs/screenshots/learn-light.png#gh-light-mode-only)
![The lesson index in dark mode: a "Pick up where you left off" panel at 67% and the Basic vim module with its lesson cards and completion rings](docs/screenshots/learn-dark.png#gh-dark-mode-only)

A lesson explains a motion beside an exercise you solve in a real editor, here stripping props from a JSX tag.

![The "Hopping tags" lesson in light mode: explanation cards on the left, exercise 2 of 4 on the right, and a TSX buffer with `f Space d t` typed and `dt` pending in the status bar](docs/screenshots/lesson-light.png#gh-light-mode-only)
![The "Hopping tags" lesson in dark mode: explanation cards on the left, exercise 2 of 4 on the right, and a TSX buffer with `f Space d t` typed and `dt` pending in the status bar](docs/screenshots/lesson-dark.png#gh-dark-mode-only)

Full screen gives the same editor the whole window without leaving the exercise.

![The same lesson's editor expanded to fill the window in light mode, with the TSX buffer, `dt` pending and a "Leave full screen" button](docs/screenshots/lesson-fullscreen-light.png#gh-light-mode-only)
![The same lesson's editor expanded to fill the window in dark mode, with the TSX buffer, `dt` pending and a "Leave full screen" button](docs/screenshots/lesson-fullscreen-dark.png#gh-dark-mode-only)

The practice page picks drills from the motions you are worst at.

![The practice page in light mode: drill, speedrun and sandbox cards above a list of the weakest motions with their mastery percentages](docs/screenshots/practice-light.png#gh-light-mode-only)
![The practice page in dark mode: drill, speedrun and sandbox cards above a list of the weakest motions with their mastery percentages](docs/screenshots/practice-dark.png#gh-dark-mode-only)

A speedrun races one exercise against a replay of your best run, key by key.

![A Go speedrun in light mode: this run's bar level with the ghost's bar, the ghost's keys replaying at 16 of 23, and the buffer half way through retyping the parameters of `New`](docs/screenshots/speedrun-light.png#gh-light-mode-only)
![A Go speedrun in dark mode: this run's bar level with the ghost's bar, the ghost's keys replaying at 16 of 23, and the buffer half way through retyping the parameters of `New`](docs/screenshots/speedrun-dark.png#gh-dark-mode-only)

The sandbox is an editor with nothing to solve, and its help panel reads the command you have half typed.

![The sandbox in light mode: a React file with `2d` pending, and the help panel headed "Delete how much?" listing what can follow, each with its count applied](docs/screenshots/sandbox-light.png#gh-light-mode-only)
![The sandbox in dark mode: a React file with `2d` pending, and the help panel headed "Delete how much?" listing what can follow, each with its count applied](docs/screenshots/sandbox-dark.png#gh-dark-mode-only)

The cheatsheet searches by key or by plain words, and links each entry to the lesson that teaches it.

![The cheatsheet in light mode with "quotes" in the search box and six matches, from `di"` to `a"`](docs/screenshots/cheatsheet-light.png#gh-light-mode-only)
![The cheatsheet in dark mode with "quotes" in the search box and six matches, from `di"` to `a"`](docs/screenshots/cheatsheet-dark.png#gh-dark-mode-only)

The stats page colours each key by how well you know the motions on it, and lists the ones costing you the most.

![The stats page in light mode: a keyboard heatmap with 41 practised caps shaded from red to green, above the weakest motions list](docs/screenshots/stats-light.png#gh-light-mode-only)
![The stats page in dark mode: a keyboard heatmap with 41 practised caps shaded from red to green, above the weakest motions list](docs/screenshots/stats-dark.png#gh-dark-mode-only)

## Why this exists

The good interactive vim trainers gate their best content — usually the part that uses real
source files — behind a sign-in and a card. That gate is not there for a technical reason;
learning vim needs a text buffer and a keyboard, both of which the browser already gives away.
So this is the same idea without the gate: MIT licensed, easy to fork, and built so that
adding a lesson is one file and a pull request.

There is no analytics script, no third-party font, no cookie, no API route and no environment
variable. Nothing you type here leaves your machine, because there is nowhere for it to go.

## Run it

Needs Node 22.18 or newer. `.nvmrc` pins 22.22.3, which is what CI runs and what every number
in this file was measured on; 24.20.0 was checked too and is green. The floor is 22.18 because
the test runner and the exercise replay use `--experimental-strip-types` to run TypeScript
directly, with no build step and no `tsx`.

```sh
npm install
npm run dev          # http://localhost:3000
```

That is the whole setup. No `.env`, no database, no services to start.

| Command                    | What it does                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Development server                                                                                       |
| `npm run build`            | Production build, then the CSP check below. Also the ESLint and TypeScript gate                          |
| `npm start`                | Serve the production build                                                                               |
| `npm run verify`           | **The one command CI runs**: format check, lint, `tsc --noEmit`, unit tests, and every exercise replayed |
| `npm run verify:exercises` | Just the exercise replay                                                                                 |
| `npm test`                 | Unit tests only (`node:test`, via `scripts/test.mjs`)                                                    |
| `npm run e2e`              | Browser gate: layout, console and off-origin requests, in Chromium. Needs `npm run build` first          |
| `npm run csp:hashes`       | Rewrite `csp-hashes.json` from the last build's output. See below                                        |
| `npm run icons`            | Regenerate every icon and the two proof sheets in `docs/icons/` from one geometry                        |
| `npm run format`           | Rewrite with Prettier                                                                                    |
| `npm run lint`             | ESLint only                                                                                              |

**If you changed a page, the build will tell you to re-run `npm run csp:hashes`.** The site
serves a Content-Security-Policy with a SHA-256 hash for each inline script, per route, and
those hashes are committed in `csp-hashes.json` because `next.config.ts` has to read them
while it builds. Changing what a page renders changes its hashes. So: `npm run build`, and if
the postbuild check fails, `npm run csp:hashes && npm run build` and commit the file.
`next dev` is exempt — its own overlay scripts cannot be hashed ahead of time — so this only
ever bites at build time.

Don't run `npm run build` while `npm run dev` is up — the build replaces `.next` underneath
the dev server and every later request 500s on a missing chunk.

## Deploy it

Every route prerenders and there is no server-side state, so:

1. Push your fork to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Accept every default and deploy.

There is nothing to configure — no environment variables, no build settings, no integrations.
The same is true of Netlify, Cloudflare Pages, or any host that runs `next build` and serves
the Next output.

One thing to know if you drop the built HTML on a bare static file host instead: the security
headers and the Content-Security-Policy are declared in `next.config.ts`, and a plain file
server never reads that. The pages still work; they just arrive without a CSP. Configure the
same headers at your CDN if you go that way.

## How it is laid out

```
app/                 One file per route: a `metadata` export, params, and one component.
                     Behaviour lives in the component; a route file changes only when the
                     route's own contract does. Every route prerenders. Also the one
                     error boundary, the 404, the manifest, robots and the sitemap.
components/
  clay/              The design primitives. `Key` is the signature element: a keycap that
                     depresses when you actually press that physical key, anywhere on the site.
  editor/            The CodeMirror 6 + vim editor, and its clay theme.
  learn/             The lesson runner and the curriculum index.
  practice/          Drill, speedrun, and the ghost race.
  sandbox/           Free play and the context-aware help panel.
  stats/ cheatsheet/ landing/ about/ prose/
content/
  types.ts           The content contract. Every lesson is typed against it.
  modules.ts         The six modules, in curriculum order.
  lessons/<module>/  One file per lesson, plus a barrel per module.
  cheatsheet.ts      The motion reference, grouped by operator and by task.
lib/
  engine/            `evaluateGoal` (pure), the attempt state machine, and the CodeMirror
                     bridge. The goal evaluator never sees which keys you pressed.
  progress/          The `localStorage` schema, and export/import. Every field is bounded,
                     and every loader degrades to "no progress yet" rather than throwing.
  stats/             The mastery formula and the derived metrics. Written down once.
  drills/            The weakness-weighted sampler, seeded so a run is reproducible.
  theme/             The light/dark preference. Its own storage key, not part of progress,
                     and stamped onto <html> by a blocking script before first paint.
  site.ts            The site's URL and its repository. See "Forking it" below.
e2e/                 The Playwright layout gate. Outside `verify` on purpose.
scripts/
  test.mjs             Finds every __tests__ directory and runs it with node:test.
  verify-exercises.ts  Replays all 154 solutions through the real editor.
  jsdom-editor.ts      The jsdom DOM and geometry shim that replay runs on.
  csp-hashes.mjs       Rewrites csp-hashes.json from the build output.
  csp-check.mjs        Runs after every build; fails it if that file is stale.
  generate-icons.mjs   Every icon, from one geometry.
docs/
  CONTRACT.md        The design contract the whole site was built against. The comments
                     that say "docs/CONTRACT.md §6" mean this file.
  icons/             Proof sheets for the icon at 16px and under Android's mask.
```

Two rules the codebase actually depends on, both explained where they live:

- **Exercises are validated by outcome, never by keystrokes.** `lib/engine/goal.ts` takes a
  goal and a snapshot of the resulting editor state and nothing else — `EditorSnapshot` carries
  no key history on purpose. Keystroke counts feed the efficiency score and nothing else.
- **The editor stays out of the landing page's initial bundle.** `/` is 111 kB First Load and
  that is a criterion, not a preference. `components/landing/HeroEditorMount` is the only thing
  on `/` that can reach CodeMirror, behind `dynamic(..., { ssr: false })`.

[`docs/CONTRACT.md`](docs/CONTRACT.md) is the specification this was built against, and it is
what the `docs/CONTRACT.md §N` comments scattered through the code point at. `AGENTS.md`
carries the rest of what is not obvious from the tree.

## Adding a lesson

One file, one line in a barrel, then `npm run verify`. The replay harness will tell you
whether the exercise you wrote is actually solvable before anyone else finds out.
[CONTRIBUTING.md](CONTRIBUTING.md) walks the whole thing with a complete worked example.

## Forking it

Nine places carry anything that is "this deployment" rather than "this project". Change
these and it is yours:

1. **`lib/site.ts`** — `SITE_URL` and `REPO_URL`. Both are **empty strings on purpose**: this
   repository has no public home and no domain yet, and neither can be derived from a
   checkout. Every consumer already renders correctly with an empty value — the layout omits
   `metadataBase`, the canonical link and `og:url`; `robots.ts` omits the `Sitemap:` line,
   which is meaningless unless absolute; `sitemap.ts` emits root-relative URLs that become
   absolute the moment you fill this in; and `/about` hides its three source buttons rather
   than linking to a 404. Set the origin with no trailing slash, and the repository page;
   `LICENSE_URL` and `LESSONS_URL` follow from `REPO_URL` on their own.
2. **`package.json`** — `name`, `description`, and a `repository` field once you have a URL.
3. **`app/layout.tsx`** — the site title and description in `metadata`.
4. **`app/manifest.ts`** — the installed-app name, short name and theme colour.
5. **`scripts/generate-icons.mjs`** — the geometry and palette are the first thing in the
   file. Change them, run `npm run icons`, and every icon plus the two proof sheets in
   `docs/icons/` are rewritten. Never hand-edit the SVG or the binaries.
6. **`app/globals.css`** — the palette, in section 2, and the dark tokens in section 15.
   Change tokens, not component rules; if a new value derives from `--clay-hue` it belongs on
   the `*, ::before, ::after` block in section 5, and `AGENTS.md` explains why.
7. **`content/modules.ts` and `content/lessons/`** — the curriculum. Delete a module by
   dropping its folder and its entry; the registry asserts the rest at import time.
8. **`content/cheatsheet.ts`** — the reference, if you change the curriculum under it.
9. **`components/about/About.tsx`** — the "why this is free" case is written in this
   project's own voice. Say it in yours, or say something else.

The one thing not to change: there is no sign-in, no account and no backend anywhere in here,
and no configuration that could add one. That is the whole point of the project.

## Tooling notes

- **ESLint 10, flat config only.** Everything lives in `eslint.config.mjs`. There is no
  `.eslintrc` and there cannot be one — ESLint 10 dropped the legacy format outright. The
  config carries type-aware rules over `lib/` and `components/`,
  the full `jsx-a11y` recommended set, and three project rules that fail with an explanation:
  no `dangerouslySetInnerHTML`, no `defaultKeymap`/`basicSetup` import, no import of the
  reference vim engine.
- **Prettier is pinned to an exact version, deliberately.** Its output changes between minor
  releases, and a caret range means two contributors reformat each other's files forever.
  Don't widen it.
- **Next is pinned to 15.** `create-next-app` now defaults to 16; this project has not been
  verified against it. `eslint-config-next` is the exception and tracks 16: its 15 line caps
  its ESLint peer at 9. It is a linter and shares nothing with the framework at runtime.
- **`docs/` holds the evidence, not prose about it.** The palette's contrast numbers in
  `CONTRACT.md`, and the icon at 16 pixels and under Android's mask in `icons/`.
- **`sharp` is undeclared on purpose.** `npm run icons` needs it; it arrives with `next` as an
  optional dependency, and nothing in `verify` or `build` runs the script.

## Licence

MIT. See [LICENSE](LICENSE). Fork it, host it, teach with it.
[CHANGELOG.md](CHANGELOG.md) is what has landed so far.
