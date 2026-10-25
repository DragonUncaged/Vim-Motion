# Project agent memory

Vim Clay is a static, account-free site for learning vim motions. `README.md` is the
orientation; this file is only what it does not say and the tree does not show.

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
- **A page that only lists lessons takes the catalogue, never the registry.** `catalogue` /
  `catalogueByModule` in `content/lessons/index.ts` are `allLessons` with the teaching material
  dropped — `LessonCard` and `ExerciseCard` in `content/types.ts`, i.e. an exercise reduced to
  `id` and `motions`. A client component that value-imports `@/content/lessons` puts all 135
  exercises (29 kB gz) into that route's first load; the server page passes the catalogue down
  instead. `Lesson` is deliberately assignable to `LessonCard`, which is why `lib/stats`
  functions take the card — and also why returning the lessons unchanged would type-check and
  silently undo the whole thing, so `content/lessons/__tests__/catalogue.test.ts` asserts field
  by field that nothing heavier survives. Anything that _runs_ an exercise takes `Lesson`.
- **`npm run verify` replays every exercise's `solution` through the real editor** and asserts
  `evaluateGoal` is true — see `scripts/verify-exercises.ts`. The jsdom DOM, its synthetic
  geometry and the editor it mounts live in `scripts/jsdom-editor.ts` (its header explains
  the shim); `lib/engine/__tests__/vim-bridge.test.ts` mounts the same stack and drives the
  bridge with trusted keydowns through jsdom's internal `fireAnEvent`, because `feedKeys`
  never reaches the capture listener and public `dispatchEvent` cannot make a trusted event.
  When the replay fails, fix the exercise, never the assertion.
- **`content/cheatsheet.ts` names motions, never lesson slugs.**
  `components/cheatsheet/lessonLinks` builds the motion-to-lesson index from `content/lessons`,
  so a module landing later wires itself in. `motionFamily` there folds `dt,` and `t>` onto the
  `dt` and `t` rows — a presentation concern, and the only reason it is not pure `lib/stats`.
- **The prose conventions are settled, and a sweep of all ~850 visible strings found them
  consistent.** The editor is written lowercase — `vim` mid-sentence, `Vim` only where a
  sentence starts; British spelling throughout (`serialised`, `flavours`, `centred`,
  `practise` the verb against `practice` the noun); straight quotes and apostrophes in
  content strings, so an apostrophe switches that literal to double quotes and Prettier
  settles which. JSX prose is the one exception: `react/no-unescaped-entities` forbids a
  bare `"` in a text child, which is why `Landing.tsx` carries the only curly quotes in the
  tree. A cheatsheet `desc` is lowercase with no full stop; every `blurb`, `note`, `summary`,
  `prompt` and `hint` ends in one, and a `heading` never does.

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
- **The display face is loaded at exactly the weight it is painted at.** `app/layout.tsx` asks
  Fredoka for 600 and nothing else, because every display element resolves there. Styling one
  at another weight does not fail loudly — the browser synthesises it — so `e2e/fonts.spec.ts`
  walks the rendered pages and asserts every element in that family computes to 600, and that
  three files are preloaded and no more. Adding a weight or a subset is what breaks that.
- **Moving a family between the two font loaders moves the fallback face.** `next/font/google`
  reads `size-adjust` from a precalculated table; `next/font/local` computes it with fontkit
  from the file, and Next's own source says the table should go. The numbers differ by a few
  percent, and it is not only a pre-swap flash: a glyph the webfont lacks is painted by the
  `<family> Fallback` face permanently. Expect a sub-pixel reflow around such glyphs, and
  measure rather than assume the loaded text moved — it does not.
- **Do not stack an opacity utility on `.clay-secondary`.** `--clay-ink-soft` is tuned to clear
  AA on the three neutral grounds exactly as it is; an 80% multiplier drops it to 3.8:1. Two
  separate places had done it and both failed Lighthouse.
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
- **The landing page must not contain the editor.** `/` builds at ~111 kB First Load and that is
  an acceptance criterion, not a preference. `components/landing/HeroEditorMount` is the only
  thing on `/` that can reach CodeMirror, and it defers `HeroDemo` behind
  `dynamic(..., { ssr: false })` until idle or the first interaction. `npm run bundle:check`
  is that proof and it no longer has to be done by hand: it reads
  `.next/app-build-manifest.json` after a build and fails on a CodeMirror marker in `/`'s
  chunks, on a syntax-parser or curriculum marker in any route's, and on `/` exceeding its
  gzip budget. Its
  markers are DOM class names and webpack-preserved export bindings, checked against a
  _minified_ build — package paths like `@lezer/` survive in sources and nowhere in the output —
  and `controlProblems` asserts each marker is still findable somewhere, so the grep cannot
  quietly stop matching. The curriculum markers are real lesson text rather than field names,
  because `startDoc` as a _key_ appears wherever `lib/engine` reads one.

## The editor and the engine

- **`evaluateGoal` must never see the learner's keys.** `EditorSnapshot` carries no key history
  for exactly that reason: `dw`, `de` and `vex` are all correct if the resulting state matches.
  Keystroke counts feed the efficiency score and nothing else. The `never` check at the bottom
  of the switch makes a new `Goal` variant a build error rather than one that silently never
  passes.
- **A syntax mode is fetched per lesson, not bundled.** `components/editor/languages.ts` holds
  one literal `import()` per `@codemirror/lang-*` so webpack emits a chunk each; `VimEditor`
  keeps the mode in a `Compartment`, mounts with `cachedLanguage()` (synchronous, so a remount
  into a mode already fetched does not flash plain) and reconfigures when the chunk lands.
  Bundling all three cost ~88 kB gz on every editor route while 24 of 40 lessons and the hero
  are `language: 'text'`. Add a language by adding a loader — the `Record` keyed on
  `Exclude<LessonLanguage, 'text'>` is the exhaustiveness check — and `scripts/jsdom-editor.ts`
  preloads the same map, so the replay cannot highlight a mode the editor no longer knows.
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
- **Full screen is a fixed overlay, never `requestFullscreen()`.** Browsers exit native
  fullscreen on `Esc` before any script sees the key, and `Esc` is the most-pressed key in
  vim — the learner would be ejected every time they left insert mode. So the frame only
  changes position: it stays where it is in the tree, so CodeMirror is never re-parented and
  the buffer, cursor, mode and running attempt survive the toggle, and a placeholder holds
  its slot so the page underneath does not reflow. `components/editor/fullScreen.tsx` carries
  the reasoning and `e2e/fullscreen.spec.ts` presses `Esc` inside the overlay and requires it
  to still be there. **Anything the surface says lives on the page, which is behind the
  scrim**: the verdict, the numbers, the next-exercise button and the page's polite live
  region were all unreachable, so solving an exercise expanded said nothing to anybody.
  Outcome chrome reaches the frame through `resultBar` (it takes the key log's row and is
  announced from a `role="status"` region mounted for the whole time the frame is open);
  the drill and the speedrun MOVE theirs in rather than drawing it twice. The in-run
  controls and the live `GhostRace` bar are still out there — see the report on
  `fm/vc-fix-focus-clock`. And the hint beside the close button says "leaves full screen"
  expanded, because `Esc` `Esc` there parks focus on that button and `Enter` finishes it. Two things that look like oversights and are not: no `aria-modal` (it
  would hide each surface's polite live region, which is outside the frame and is how mode
  changes are announced), and no `Esc` binding of any kind.
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
- **Never call `Vim.unmap()`.** It splices the package's `defaultKeymap` without adjusting its
  captured length, and afterwards every key that arrives through a `keyToKey` expansion throws:
  `s`, `S`, all four arrows, `<Space>`, `<BS>`, `<Del>`, `<CR>`, `<Home>`, `<End>`, `<C-n>`,
  `<C-p>`. `Vim.noremap()` and `Vim.mapCommand()` are safe — they unshift. The full note is on
  `configureVimGlobals` in `vim-bridge.ts`, and `npm run verify` replays those keys by name so
  the bug cannot come back.
- **Four extensions are load-bearing and two of them fail silently.** `history()` — without it
  `u` and `<C-r>` are no-ops and an undo exercise passes for the wrong reason.
  `EditorState.allowMultipleSelections.of(true)` — without it `<C-v>` reports a healthy block
  while CodeMirror collapses to one line. And `defaultKeymap`/`basicSetup` must stay **out**: on
  macOS they bind emacs keys and `Ctrl-k` wipes to end of line in insert mode. A lint rule
  enforces the last one.
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
- **`useIsWideScreen` is `null` until the client knows.** The server pass used to say
  `false`, so every prerendered lesson told a laptop it needed a keyboard until hydration.
  Pages render `components/ExercisePlaceholder` (prompt shape + the loader's own editor
  skeleton, at the pane's measured height) while it is `null`, then the pane or the notice;
  the sandbox reserves the bare `EditorSkeleton` because it has no prompt panel. Compare
  with `=== true` — a bare truthy test folds the undecided frame into the narrow one, which
  is how every desktop lesson used to open by saying it wanted a keyboard. The decision still precedes the dynamic import, so a phone never
  requests the editor chunk — `e2e/hydration.spec.ts` checks that by the chunk's content.
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
- **The ghost is a recording, never a second editor.** `@replit/codemirror-vim` keeps registers
  on the module rather than the view, so a second instance replaying `yy` beside a live attempt
  would overwrite the register that attempt is being judged on. `GhostReplay` plays against
  `attempt.runningSince` — null until the first keystroke, which is the ghost's start gun too.
  Driven off wall-clock time from mount it finishes before the learner types; driven off a bare
  `0` it presses a key while the prompt is still being read. Both are pinned in
  `e2e/speedrun.spec.ts`.
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
- **JSON-LD is a plain text child of `<script type="application/ld+json">`, not
  `dangerouslySetInnerHTML`.** React does not entity-escape a script's text child, so the
  banned construct (docs/CONTRACT.md §5) needs no exception; `<` is written `\u003c` so a
  `</script>` inside a string cannot end the element. `scripts/csp-hashes.mjs` hashes it like
  any inline script even though a non-JavaScript type is a data block CSP never checks.
- **The 135 per-exercise speedrun pages are `noindex, follow`** — the same page with a
  different exercise loaded after hydration. `app/sitemap.ts` already leaves them out; the
  meta says the same thing to a crawler that arrived by following a link.

## Checks

`npm run verify` is the fast gate: format check, lint, `tsc --noEmit`, unit tests, and the
exercise replay. `npm run e2e` is the browser gate. CI runs verify + build in one job and e2e
in a second, so neither can drift from what a contributor runs.

- **`playwright.config.ts` reuses whatever is on port 3971, whoever started it.** With
  several worktrees of this repo on one machine, another checkout's `next start` on that port
  is silently what your suite tests — a whole run passed against the wrong build before this
  was noticed. Your own stale server does it too: one left over from an earlier build keeps
  serving that build's HTML and chunk names out of memory, so a spec asserting which chunks a
  page fetches can report a change did not work when it is reading a two-builds-old server.
  Serve your own build on a port of your own and point the suite at it:
  `npx next start -p 3973 & BASE_URL=http://localhost:3973 npm run e2e`.
- **Nothing in `verify` lays anything out.** The replay harness is jsdom with a synthetic
  8x16px monospace geometry and no CSS, so a collapsed grid, a clipped line, a missing focus
  ring, a first paint in the wrong theme and a request to a third party cannot turn it red.
  That is what `e2e/layout.spec.ts` is for: every route at 375/768/1440 in both themes
  asserting the document never scrolls sideways, the console is clean and nothing leaves the
  origin, plus one named test per bug actually reproduced in a browser. It needs
  `npm run build` first (it serves the built output, not `next dev`) and a one-off
  `npx playwright install chromium`. Keep it out of `verify` — the browser is a 177 MB
  download and `verify` is the inner loop.
- **A bare `fr` grid track is a bug waiting for content.** `1fr` is `minmax(auto, 1fr)`, and
  `auto` is min-content, so anything unbreakable in that track — a typed CodeMirror line, a
  long identifier in prose — refuses to shrink and takes the width from its siblings. Write
  `minmax(0, …fr)` and put `min-w-0` on the grid children; the item keeps `min-width: auto`
  even inside a capped track. This shipped twice, on the landing hero and in `CheatRow`.
- **Chrome cannot make a window narrower than 500px.** A `resize 375` silently gives you 500
  and a phone-width pass that proved nothing. Use device emulation for real narrow widths.

- **Watch for a check that passes because it never ran.** `npm test` used to enumerate test
  directories by hand and silently skipped `lib/stats/__tests__` — four files over the most
  formula-heavy code in the project, while reporting green. `scripts/test.mjs` now walks the
  whole tree for `__tests__` and refuses to pass with no files or a file that declares no
  tests — Node counts such a file as one passing test, so `# tests 0` alone never fires.
- **`scripts/node-test-resolver.mjs` is what lets Node run the real modules.** It maps `./x` to
  `./x.ts`, a directory to its `index.ts`, and tsconfig's `@/` alias to the repo root, so a
  test may import `content/lessons/index.ts` or a module that reaches `@/lib/progress` without
  adding `tsx` or `ts-node`.
- **`noUncheckedIndexedAccess` is on, so an index says whether it found anything.** Do not
  reach for `!` to get past it — say the invariant in a way the compiler can check (a
  `Record` keyed by a union rather than by `string`, a named local before the guard that
  already covers it, `charAt` in a character loop, `at(-1)` folded into the length check).
  In a test, take `at()` / `get()` from `scripts/test-utils.ts`: they assert with the index
  and the length in the message, where a `!` gives "Cannot read properties of undefined" at
  a line that is not the one that cares. `no-unnecessary-condition` is deliberately still
  off — 39 hits, mostly guards on `@replit/codemirror-vim` and jsdom values whose types are
  more confident than the packages are.
- **`./` for a sibling, `@/` for everything else, and `lib/` never imports `components/`.**
  Both are `no-restricted-imports` in `eslint.config.mjs`, scoped per directory; a
  `__tests__` file may still reach one level up to the module it tests. Move a type or a
  pure function down rather than reaching up — `content/types.ts` for a token,
  `lib/engine/types.ts` for the engine's contract, its own module under `lib/` otherwise
  (that is why the prose parser is `lib/prose/richtext-parse.ts`). **A second
  `no-restricted-imports` entry replaces the rule's options outright**, so the scoped blocks
  compose through one `restrictedImports()` helper; adding a bare one would switch the
  `defaultKeymap` and `codemirror` bans off for everything it covers, silently.
- **Never run `npm run build` while `npm run dev` is up**: the build replaces `.next` underneath
  the dev server and every subsequent request 500s on a missing vendor chunk.
- **Prettier is pinned to an exact version and ESLint 10 is flat-config only.** Do not widen
  the pin, and there is no `.eslintrc` to add — ESLint 10 dropped the legacy format, so the
  silent-no-op version of that bug is gone with it. `CLAUDE.md` is in `.prettierignore`
  because its two-line pointer is byte-checked by tooling.
- **Next is pinned to 15 deliberately** — `create-next-app` now defaults to 16. Package manager
  is npm; the lockfile is committed. `eslint-config-next` is deliberately _not_ held back with
  it: the 15 line caps its ESLint peer at 9, and it is a linter that shares no runtime with the
  framework. Its 16 line also publishes flat config directly, which is why `FlatCompat` and
  `@eslint/eslintrc` are gone.
- **Three lint dependencies advertise a stale ESLint peer range and one genuinely breaks.**
  `eslint-plugin-jsx-a11y`, `-import` and `-react` all cap at `^9` and all work under 10; the
  `overrides` block in `package.json` says so once rather than every install warning about it.
  The break is real but narrow: `eslint-plugin-react`'s `settings.react.version: 'detect'` is
  the last caller of the removed `context.getFilename()`, so `eslint.config.mjs` names the
  React version instead and every `react/*` rule loads.
- **`eslint-plugin-react-hooks` 7 arrived with `eslint-config-next` 16 and its `recommended`
  is now the React Compiler set.** Twelve of the fourteen new rules pass and are on.
  `set-state-in-effect` and `refs` are off, with the reason and the remedy at the block that
  disables them — adopting either is a change to the components, not to the lint config.
- **Two things in `next.config.ts` keep `csp-hashes.json` reproducible, and the set is
  worthless without both.** `generateBuildId` hashes the versions the lockfile pins, because the
  build id is in every page's flight payload and the default is random — never the file's bytes,
  which npm 11's `npm install` (Vercel's install step) rewrites. `PathIndependentModuleIds` folds
  the project's absolute path out of webpack's module identifiers before they are hashed into
  module ids (sized to the module count, because an id's width is written into every reference
  to it and taking the hash whole put 2 kB on the shared chunk and `/` over its 111 kB budget) — Next's loaders embed that path URL-encoded in a loader query, where webpack's
  own relativising does not reach, and without this the hashes are a function of the directory
  the repo is checked out into and `npm run build` is red everywhere but the machine that last
  regenerated the file. **Test either with a second clone at a different path, never a second
  build in the same one.**
- **A wholesale `e2e` failure usually means the CSP, not the layout.** Under a stale policy the
  browser refuses every inline script, nothing hydrates (`[pageerror] t.reason.enqueueModel is
not a function`) and all ~69 layout assertions fail together. Check `npm run build` first.
- **`csp-hashes.json` is machine-owned.** Regenerate with `npm run csp:hashes` and build again;
  never hand-edit it. A hash typed in allows a script that does not exist, one left out blanks
  a page.
- **CI has still never run on GitHub** — there is no remote. The substitute is both jobs,
  step by step, in a fresh clone at a path that is not this one. Run them there and not in a
  worktree, whose warm `node_modules` and warm `.next` hide exactly the failures CI exists to
  catch.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
