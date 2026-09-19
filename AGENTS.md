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
- **A wasted key is one that _completes_ a command that changed nothing.** The naive reading
  scores a flawless `dw` at 50% accuracy. Do not simplify it back.

## Practice: the sampler and the run

- **The sampler is pure and seeded** (`lib/drills/sample.ts`, `mulberry32`), so a run can be
  reproduced and checked. Weight is mean weakness × recency, damped for lesson siblings after
  each pick. Never practised is `null`, never `0`.

## Findability

- **Metadata is shallowly merged, so a page that declares `openGraph` replaces the layout's
  whole object.** Setting only `openGraph.title` silently drops `og:site_name`, `og:type`
  and the image — which is why every route builds the complete object through
  `pageMetadata` and nothing hand-writes a partial one. The title template does not reach
  Open Graph either: `og:title` is spelled out with the suffix, and `/` passes `shareTitle`
  because the template does not apply to the page beside the layout that declares it.

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
