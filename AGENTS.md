# Project agent memory

Vim Clay is a static, account-free site for learning vim motions. This file is only what
the tree does not show.

## The rule that overrides everything

No sign-in, no paywall, no account, no backend, ever. No API routes, no env vars, no
server-side state, no analytics. Progress lives in `localStorage` and moves between devices
through export/import. Copy that merely _hints_ at a gate ("upgrade", "free tier") is a bug.

## Content

- **`content/types.ts` is the contract ~135 hand-written exercises are typed against.** One
  renamed field breaks all of them. Treat it as published API: raise the change, do not make it
  quietly. `content/modules.ts` and `content/lessons/index.ts` are the same.
- **It is also where a shared token is declared, because `content/` imports nothing.**
  `ClayHue` and `ModuleId` live there and are re-exported where components reach for them
  (`components/clay/Key.tsx`). Both used to be `string` or a copied literal union in two or
  three places at once, bridged by a cast. A new token that both `lib/` and `components/`
  need goes here rather than into whichever component happened to name it first.
- **`ModuleId` is what makes wiring a module a compile-time job.** The barrel map in
  `content/lessons/index.ts` is `Record<ModuleId, Lesson[]>`, so a module in the union with
  no barrel line does not compile and a barrel line for an id nobody declared does not
  either; the registry additionally throws on a module with no lessons. Adding a module
  starts at that union, and the compiler names the other two places.
- **`content/lessons/index.ts` asserts at import time** that slugs are unique and each module's
  `order` is dense and 1-based, so a duplicate slug fails `next build` rather than 404ing
  quietly at runtime.
- **`lib/drills/pool.ts` is server-side, and importing `catalogue` does not make a module
  client-safe.** The catalogue is _derived at runtime_ from the real lessons, so any client
  module that imports it still bundles all 135 bodies — /learn, /stats and /cheatsheet only
  escape that because they are server components passing serialised props. So the drill pool
  is built on the server, is deliberately absent from `lib/drills/index.ts` (a barrel export
  would put it back in the client graph), and every consumer — `itemsFor`, `planFor`,
  `categoryOverviews`, `itemByKey` — takes the pool as an argument. A `DrillItem` is a card;
  `LoadedDrillItem` is one with its `Exercise` attached, fetched by `lib/drills/exercises.ts`
  when a run is about to play it. The whole 135-card pool is 2.9 kB gzipped as props.
- **`content/cheatsheet.ts` names motions, never lesson slugs.**
  `components/cheatsheet/lessonLinks` builds the motion-to-lesson index from `content/lessons`,
  so a module landing later wires itself in. `motionFamily` there folds `dt,` and `t>` onto the
  `dt` and `t` rows — a presentation concern, and the only reason it is not pure `lib/stats`.

## Layout that is not obvious from the tree

- **`app/globals.css` is one adopted block.** Everything between the `clay.css starts here`
  and `END OF clay.css` banners is the `clay.css` the design system was authored as: its
  rules verbatim, its comments cut to what the rules cannot say. To take a new version,
  replace that block and re-apply the local edits — every one is marked `vim-clay:`, so
  `grep -n 'vim-clay:' app/globals.css` lists them. Never hardcode a box-shadow in a
  component: pick an elevation class and set `--clay-hue` with a `.hue-*` class.
- **`.hue-*` is inert on `.clay-key`.** The keycap sets `--clay-hue` on itself at equal
  specificity and later in the file. A probe or a demo that puts `.hue-mint` on a keycap is
  measuring nothing; use `.clay-chip` or `.clay-card`.
- **Both themes come out of one recipe.** `--clay-lit` / `--clay-lit-solid` and `--clay-depth`
  name the two directions so no rule spells a direction as `#ffffff` or `--clay-ink`, and
  `--clay-fill-*` holds every hue-derived percentage because dark has to move all of them.
  A new rule reads those tokens; it does not get a `.dark` override. Section 15.4 is the list
  of elements that genuinely differ, and each one says why.
- **In dark, a hue-derived fill has to clear a dead band.** `color-mix(hue N%, surface)` runs
  from the surface to the pastel, and across the middle of that line — mint 36–92%, butter
  34–84% — no ink in the system reaches 4.5:1. Put a new fill decisively above the band (take
  `--clay-hue-ink`) or below it (take `--clay-hue-lit`), and measure it. Anything that sets
  `--clay-hue-ink` must set `--clay-hue-lit` beside it.
- **`color-mix` with `transparent` belongs `in srgb`.** It is only applying an alpha, and the
  two spaces agree on the value but not on the storage: oklab keeps white as
  `oklab(0.999994 …)` and quantises one 8-bit level low at the edge of a blur. Mixes between
  two real colours stay `in oklab`.
- **Route files stay thin: a `metadata` export, params handling, and one component from
  `components/`.** "Written once and never edited" was the ownership rule while ten branches
  built the site in parallel; that build is over. Edit a route file when the route's own
  contract changes — `generateStaticParams`, `dynamicParams`, metadata — and put everything
  else in the component. Both dynamic routes set `dynamicParams = false`, so an unknown
  lesson or drill is the prerendered 404 and `next build` shows no `ƒ` route; a new
  practice mode must be enumerated in `app/practice/[drill]/page.tsx` or it does not exist.
  The one second component allowed beside the first is `<JsonLd>` on `/`, `/learn` and
  `/learn/[slug]`: structured data is the route's own metadata and Next's `metadata` export
  cannot carry it.
- **Tailwind utilities lose to the clay classes, and so does a second clay class.**
  `app/globals.css` sits outside `@layer`, so `.clay-key`'s own `min-width` beats a `min-w-*`
  utility at equal specificity. To change a clay element's geometry from a component, use the
  important modifier (`min-w-[15rem]!`). The same order decides class against class: a
  component class declared later in the file — `.clay-editor` — beats an elevation class
  declared earlier — `.clay-hero` — so composing the two does nothing. Reach for the two
  tokens the elevation class pairs (`--r-hero` with `--clay-shadow-hero`) in an inline style
  rather than hardcoding a shadow; the pairing is the rule, the class is only one way to get
  it.
- **The three faces are committed under `app/fonts/`, so `next build` needs no network.**
  `next/font/google` fetches at build time and a production build re-throws on failure, which
  made every build depend on Google being reachable. The files are the latin subsets Google
  itself served; `app/fonts/README.md` has the provenance, the licences and how to take a
  newer version. Latin alone is deliberate — the handful of glyphs the site paints outside
  that range (→ ≥ ● ✓) are in no Google subset either and always came from the system stack.
- **Moving a family between the two font loaders moves the fallback face.** `next/font/google`
  reads `size-adjust` from a precalculated table; `next/font/local` computes it with fontkit
  from the file, and Next's own source says the table should go. The numbers differ by a few
  percent, and it is not only a pre-swap flash: a glyph the webfont lacks is painted by the
  `<family> Fallback` face permanently. Expect a sub-pixel reflow around such glyphs, and
  measure rather than assume the loaded text moved — it does not.
- **The theme is two states, dark by default, and deliberately not part of the progress
  schema.** `lib/theme` owns it under its own key, because progress travels between devices
  through export/import and a theme is a property of the device you are sitting at. Dark is
  the default for a visitor with nothing stored — the captain's call, not the OS preference;
  a stored `system` from the old three-state design reads as dark. It must also be stamped
  onto `<html>` by the inline blocking script in `app/layout.tsx` — an external script, a
  provider or a `useEffect` all paint first, and the whole page in the wrong theme for a
  frame is the one bug a theme switch is judged on. That script cannot import from
  `lib/theme`, so `lib/theme/__tests__` executes it and asserts the two agree; nothing else
  would catch the drift.
- **`lib/progress` owns the storage schema; `lib/stats` owns the maths.** Every loader path
  tolerates SSR, disabled storage, a full quota and malformed JSON by degrading to "no progress
  yet" — never by throwing. Finite is not sane: the schema bounds every field (`at` inside the
  JS date range, strings, motion lists and counters capped), and every formatter in
  `lib/stats/format.ts` still guards its input, because a stored value that one formatter
  cannot digest takes a page down on every visit. `lib/storage.ts` owns getting at `localStorage` at all —
  `safeStorage()` for the access, `storageWritable()` for the probe — and both the progress
  store and the sandbox's prefs use it. `safeStorage()` does not probe-write: at exactly quota
  the probe was the write that failed, ahead of the halving fallback. Only a caller that has
  to answer "would a write work?" ahead of time adds the probe. `useProgress` invalidates its snapshot cache at module level,
  not only from mounted subscribers, so `app/error.tsx` clearing storage after a crashed page
  unmounted is seen by the retry.
- **`app/error.tsx` is the only error boundary and must never format stored data.** It is
  the page a learner lands on when a formatter over stored attempts throws, so it reads and
  serialises (`loadProgress`, `exportProgress`) and nothing else; the message and digest are
  printed locally — there is no error tracker and there must never be one.
- **The mastery formula is written down once**, at the top of `lib/stats/mastery.ts`.
  `motionMastery` / `weaknessWeight` exist nowhere else, and `lib/drills` reads them from there;
  a second copy would drift and the heatmap would disagree with the drill that claims to fix it.

## The editor and the engine

- **`evaluateGoal` must never see the learner's keys.** `EditorSnapshot` carries no key history
  for exactly that reason: `dw`, `de` and `vex` are all correct if the resulting state matches.
  Keystroke counts feed the efficiency score and nothing else. The `never` check at the bottom
  of the switch makes a new `Goal` variant a build error rather than one that silently never
  passes.
- **"Focused" means focus anywhere inside `view.dom`, panels included.** Vim's `/`, `?` and
  `:` command line is a real `<input>` CodeMirror mounts inside the editor, so watching
  `contentDOM` for blur (what `EditorView.domEventHandlers` does) reported the editor
  abandoned every time a learner opened a search — and raised the "click to focus" card over
  the buffer they were searching. `VimEditor` tracks `focusin`/`focusout` on `view.dom`
  instead and reads `relatedTarget`, because `document.activeElement` is `<body>` for the
  duration of a focusout. It stops at `view.dom` on purpose: the clay frame's title strip
  holds the full-screen button, and focus there really is outside the buffer.
- **The attempt clock runs only while the editor has focus, and `runningSince` is an
  ORIGIN.** `startedAt + pausedMs`, pushed forward by every away spell, so a display is
  still one subtraction from `performance.now()` and `accumulatedMs` is the reading
  whenever it is null (idle, paused, ended). The model and the two transitions are at the
  top of `lib/engine/attempt.ts`. Two consequences worth knowing: stored `timeMs` means
  time actually spent, so a record written before this can only be longer than the same run
  today; and ghost offsets are recorded key by key on the attempt clock, because past one
  pause no single offset converts `KeystrokeRecord.at` stamps. The ghost pauses with the
  clock — `GhostReplay` freezes at `accumulatedMs`.
- **`lib/engine/vim-bridge.ts` is value-import poison outside `components/editor/`.** It imports
  `@replit/codemirror-vim`, so one value import drags ~240 kB into that route's first load —
  silently, because the page still works. Page components type-import from
  `lib/engine/types.ts`; values arrive through `onReady(bridge)`.
- **Everything `vim-bridge.ts` does oddly, it does because the alternative was measured
  failing.** The reasons are in the comments, each one written from a measurement against a
  real browser rather than from a guess. The short list: keystrokes are counted from a capture listener on `view.dom` and never
  `contentDOM`; `pendingKeys` comes from `vim.status`, not `inputState.keyBuffer`; the
  `Esc` `Esc` hatch is decided in that listener because no keymap can run before vim; setup keys
  are replayed programmatically so they never reach the DOM and cannot be counted.
- **The package styles the block cursor at `Prec.highest` and copies the character's colour onto
  it as an inline style.** Every cursor declaration in `components/editor/theme.ts` therefore
  needs `!important`; without it the cursor is coral in every mode and the character under it is
  unreadable at 1.49:1.
- **The editor frame takes its height from the document it was given, never the live one.**
  `wellHeightFor` in `components/editor/VimEditor.tsx` fixes `.clay-editor-well` from the
  initial line count (clamped to the old 9rem–28rem band) and the CodeMirror root fills it,
  so thirty new lines scroll behind the frame the way a vim window scrolls. It used to be
  `min-h` plus a CodeMirror `max-height`, and the hero doubled in height as a visitor typed.
  The key strip under the status bar is one fixed row for the same reason.
- **The attempt clock ticks in the leaf that paints it, not in the hook.**
  `AttemptState.elapsedMs` is 0 while an attempt is running and the real duration once it
  ends; `runningSince` is the `performance.now()` of the first keystroke. A display reads
  `useLiveElapsed` / `<LiveDuration>` from `components/LiveDuration.tsx`, which owns the
  100 ms interval — two callers, the lesson runner's time stat and `GhostRace`. The counter
  used to live in `useExercise`'s state, which re-rendered the editor and its fourteen
  keycaps ten times a second for the whole attempt. `VimEditor` is memoised for the same
  reason; every prop it takes is already referentially stable, so keep it that way (no
  inline object or `footer` built in a parent's render). An event handler that needs the
  time between renders takes `elapsedNow()` from the hook.
- **Registers are global to the module, not the editor**, and outlive `view.destroy()`. Every
  attempt clears them, and the goal is only evaluated after the first keystroke, so a `register`
  goal cannot read true at mount.
- **A wasted key is one that _completes_ a command that changed nothing.** The naive reading
  scores a flawless `dw` at 50% accuracy. Do not simplify it back.
- **`EditorSnapshot.pendingKeys` is a display string, not a key list.** It is vim's own showcmd
  buffer with the register prefix re-attached, so `"a2y` arrives as one string with the count
  and the register still inside it. Anything reading it has to parse it —
  `components/sandbox/resolve.ts` does, with the two rules that bite: `0` is a motion until a
  count is already being typed, and `f`/`r`/`m` swallow the next character whole.

## Practice: the sampler and the run

- **The sampler is pure and seeded** (`lib/drills/sample.ts`, `mulberry32`), so a run can be
  reproduced and checked. Weight is mean weakness × recency, damped for lesson siblings after
  each pick. Never practised is `null`, never `0`.
- **`DrillCategory.matches` and `.coversMotion` answer different questions.** An exercise joins
  "word motions" for training `dw`; the `<Esc>` it also trains is not part of that category's
  coverage or of the mastery number its card prints.
- **A speedrun's personal best is a `min` over stored attempts**, not a second storage key. That
  is why imported progress brings its ghosts with it, and why "Run it again" must re-run the
  _same_ item rather than re-rolling the picker — re-rolling made the ghost unreachable. The
  keys the ghost replays obey the same rule: `AttemptRecord.timeline` is a field on the run that
  set the record, so the bar and the replay cannot describe two different runs. Which runs keep
  one, and why it is the only field on a record that is not write-once, is on
  `applyTimelinePolicy` in `lib/progress/storage.ts`.
- **`ExerciseStage` reports; the run decides.** `onFinished` fires the instant an attempt ends;
  whether that means a puff and the next exercise or a button is the run's policy. Reading the
  result off parent state inside `renderFinished` is a frame behind — use the argument.
- **A skipped exercise records no attempt.** An unsolved attempt scores 0 for every motion it
  lists, so recording skips would let a learner flatten their own mastery by clicking.

## Findability

- **Metadata is shallowly merged, so a page that declares `openGraph` replaces the layout's
  whole object.** Setting only `openGraph.title` silently drops `og:site_name`, `og:type`
  and the image — which is why every route builds the complete object through
  `pageMetadata` and nothing hand-writes a partial one. The title template does not reach
  Open Graph either: `og:title` is spelled out with the suffix, and `/` passes `shareTitle`
  because the template does not apply to the page beside the layout that declares it.
- **The 135 per-exercise speedrun pages are `noindex, follow`** — the same page with a
  different exercise loaded after hydration. `app/sitemap.ts` already leaves them out; the
  meta says the same thing to a crawler that arrived by following a link.

## Checks

- **`scripts/node-test-resolver.mjs` is what lets Node run the real modules.** It maps `./x` to
  `./x.ts`, a directory to its `index.ts`, and tsconfig's `@/` alias to the repo root, so a
  test may import `content/lessons/index.ts` or a module that reaches `@/lib/progress` without
  adding `tsx` or `ts-node`.
- **Never run `npm run build` while `npm run dev` is up**: the build replaces `.next` underneath
  the dev server and every subsequent request 500s on a missing vendor chunk.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
