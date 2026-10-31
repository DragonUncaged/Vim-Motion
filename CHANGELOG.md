# Changelog

Notable changes, newest first. Nothing is released yet: there is no tag and no published
build, so everything below is under one **Unreleased** heading and will become `0.1.0` when
this is first tagged. Dates are the day the work landed on `main`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) loosely and
[semantic versioning](https://semver.org/) exactly once there is a version to be semantic
about. Only the storage schema and `content/types.ts` are compatibility surfaces: a breaking
change to either is a major bump, because exported progress has to keep importing and ~135
hand-written exercises are typed against the second.

## Unreleased

### The site

- **Forty-five lessons across six modules**, 154 exercises, from `hjkl` to block-visual edits on
  realistic `.tsx`, `.go` and `.cpp` sources. Every exercise is judged on the resulting
  buffer, never on the keys typed.
- **A real vim editor**, CodeMirror 6 with `@replit/codemirror-vim`, with the mode carried
  by the whole editor frame and a status bar that reads like vim's own.
- **A full-screen editor** on every surface that hosts one — lessons, drills, speedruns and
  the sandbox. An in-page overlay rather than the browser's own, because native fullscreen
  exits on `Esc` and `Esc` belongs to vim; the buffer, cursor, mode and running attempt
  survive the toggle, and nothing about it is remembered between visits.
- **Practice**: a drill picker, timed drills sampled by weakness from one seeded sampler,
  and a speedrun that races your own previous best as a ghost.
- **A free-play sandbox** whose help panel reads your half-typed command and says what can
  follow it.
- **A 171-entry cheatsheet**, searchable, grouped by operator and by task, wired to the
  lessons that teach each motion.
- **A stats page**: speed, accuracy, efficiency, streaks, and a per-motion mastery heatmap,
  with export and import as the way progress moves between machines.
- **Dark mode**, designed rather than inverted, stamped onto the page by a blocking script
  before first paint.
- **An icon**, a clay keycap with vim's block cursor as its legend, generated from one
  geometry by `npm run icons`. The proof sheets are in [`docs/icons/`](docs/icons/).

### Correctness and hardening

- Every exercise's `solution` is replayed through the real editor by
  `npm run verify:exercises`, and the build fails if one does not reach its goal. The check
  also replays each solution one key short, so a goal that was already true at mount cannot
  pass.
- `npm test` finds every `__tests__` directory rather than an enumerated list, and a file
  that declares no tests fails the run instead of counting as a pass.
- The stored progress schema bounds every field it reads, and every loader path degrades to
  "no progress yet" on SSR, disabled storage, a full quota or malformed JSON rather than
  throwing.
- Every route has an error boundary with a way back, and an unknown lesson or drill is a
  prerendered 404 rather than a runtime one.
- Security headers on every route, and a Content-Security-Policy with a SHA-256 hash per
  inline script per route, checked after every build by `npm run build`'s postbuild step.
- A Playwright layout gate (`npm run e2e`): every route at three widths in both themes,
  asserting no sideways scroll, a clean console and nothing leaving the origin, plus one
  named test per layout fault that has actually been reproduced.
- The accessibility floor — focus rings, `prefers-reduced-motion`, contrast — cleared on
  every route and measured rather than asserted.

### Documentation

- [`docs/CONTRACT.md`](docs/CONTRACT.md): the design contract the site was built against,
  published so that the ~60 `docs/CONTRACT.md §N` comments in the code resolve.
- `README.md` and `CONTRIBUTING.md`, written for a stranger, with a complete worked lesson
  and a fork guide.

### Known gaps

- `SITE_URL` and `REPO_URL` in `lib/site.ts` are empty. There is no public repository and no
  domain yet, so the canonical link, the `Sitemap:` line and `/about`'s source buttons are
  all deliberately absent until they are filled in.
- The e2e suite has never run on CI hardware; the 69 checks are proven locally only.
- Chromium only. No Safari, no Firefox, no real mobile browser, and no screen reader has
  been heard.
