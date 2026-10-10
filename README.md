# Vim Clay

Learn vim motions by doing them, in a real vim editor, in your browser.

Forty lessons and 135 exercises, from `hjkl` up to block-visual edits on real `.tsx`, `.go`
and `.cpp` files. Every exercise is judged on the buffer you end up with, so `dw`, `de` and
`vex` all count if the text matches. There is a timed drill mode, a speedrun that races your
own previous best, a free-play sandbox with a help panel that reads your half-typed command,
a searchable 171-entry cheatsheet, and a stats page with a per-motion heatmap.

**No sign-in. No paywall. No account. No backend.** Every lesson, drill and statistic is open
to an anonymous visitor on first page load. Your progress lives in `localStorage`, and moves
between machines as a JSON file you export and import yourself.

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
| `npm run build`            | Production build. Also the ESLint and TypeScript gate                                                    |
| `npm start`                | Serve the production build                                                                               |
| `npm run verify`           | **The one command CI runs**: format check, lint, `tsc --noEmit`, unit tests, and every exercise replayed |
| `npm run verify:exercises` | Just the exercise replay                                                                                 |
| `npm test`                 | Unit tests only (`node:test`, via `scripts/test.mjs`)                                                    |
| `npm run icons`            | Regenerate every icon and the two proof sheets in `docs/icons/` from one geometry                        |
| `npm run format`           | Rewrite with Prettier                                                                                    |
| `npm run lint`             | ESLint only                                                                                              |

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
  modules.ts         The five modules, in curriculum order.
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
scripts/
  test.mjs             Finds every __tests__ directory and runs it with node:test.
  verify-exercises.ts  Replays all 135 solutions through the real editor.
  jsdom-editor.ts      The jsdom DOM and geometry shim that replay runs on.
  generate-icons.mjs   Every icon, from one geometry.
  icons/             Proof sheets for the icon at 16px and under Android's mask.
```

Two rules the codebase actually depends on, both explained where they live:

- **Exercises are validated by outcome, never by keystrokes.** `lib/engine/goal.ts` takes a
  goal and a snapshot of the resulting editor state and nothing else — `EditorSnapshot` carries
  no key history on purpose. Keystroke counts feed the efficiency score and nothing else.
- **The editor stays out of the landing page's initial bundle.** `/` is 111 kB First Load and
  that is a criterion, not a preference. `components/landing/HeroEditorMount` is the only thing
  on `/` that can reach CodeMirror, behind `dynamic(..., { ssr: false })`.

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

## Licence

MIT. See [LICENSE](LICENSE). Fork it, host it, teach with it.
