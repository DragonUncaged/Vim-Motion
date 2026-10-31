# The design contract

This is the specification Vim Clay was built against, before any of it existed. It is the
reason the code looks the way it does, and roughly sixty comments across `app/`,
`components/`, `content/`, `lib/`, `scripts/` and `eslint.config.mjs` cite it by section —
`CONTRACT §6`, `CONTRACT §4 rule 4b`. Those citations point here.

**Where this file is not the authority.** Several sections were originally written as the
only copy of something the repository now holds properly: the content types, the palette,
the editor's exported surface. Where that is true the section says so and names the file
that wins. This document keeps the _decisions and their reasons_; the code keeps the shapes.
A second copy of a type signature would drift within a week and then quietly lie.

**Section numbers are stable.** They are load-bearing — a renumber breaks every citation in
the tree — so §9 and §10 are gone but the numbers after them are not reused. Both were
build-process rather than project knowledge: §9 described how a fleet of parallel branches
related to each other during the initial build, and §10 was that build's definition of done
(`tsc`, lint, `next build`, look at it in a real browser, report on your branch). The
checks that survived it are in [`../CONTRIBUTING.md`](../CONTRIBUTING.md); the branch
choreography has no meaning now that the site is one repository with one history.

---

## 0. The one non-negotiable rule

**No sign-in. No paywall. No account. Ever.**

Every lesson, drill, stat and advanced module is open to an anonymous visitor on first page
load. Do not add auth, a database, an email capture, a "save your progress" modal, a locked
lesson, a Pro badge, or a rate limit. If you need a user identity, you don't — use
`localStorage`. No API routes. No env vars. No server-side state. No analytics SDK.

This site exists specifically because the paid alternatives put a gate here. Any code that
implies a gate is a bug, including copy that hints at one ("upgrade", "sign in to continue",
"free tier").

---

## 1. Stack — decided, do not re-litigate

| Concern     | Choice                                                                                                       | Note                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 15, App Router, TypeScript **strict**                                                                | `next build` must pass clean                                                                                                  |
| Styling     | Tailwind CSS v4                                                                                              | CSS-first config in `globals.css` via `@theme`                                                                                |
| Primitives  | shadcn/ui                                                                                                    | the allowed set is `dialog tabs progress tooltip sheet button card`; `card` and `tooltip` are the two that earned their place |
| Editor      | **CodeMirror 6 + `@replit/codemirror-vim`**                                                                  | never hand-roll a vim emulator; never Monaco                                                                                  |
| Languages   | `@codemirror/lang-javascript` (`{jsx:true, typescript:true}`), `@codemirror/lang-go`, `@codemirror/lang-cpp` |                                                                                                                               |
| State       | Zustand                                                                                                      | small, cross-component only                                                                                                   |
| Fonts       | `next/font/google`                                                                                           | self-hosted: Fredoka (display), Nunito Sans (body), JetBrains Mono (code + keys)                                              |
| Persistence | `localStorage` only                                                                                          |                                                                                                                               |

The editor component **must** be dynamically imported with `ssr: false` — CodeMirror touches
`document` on init — and **must not** be in the landing page's initial bundle. That second
half is a measured budget, not a preference: see the note on `components/landing/HeroEditorMount`
in [`../AGENTS.md`](../AGENTS.md).

Package manager: **npm**, with the lockfile committed.

---

## 2. Clay design language

Claymorphism: soft, inflated, toy-like. Big radii, pastel surfaces, a **double inset shadow**
(bright inner highlight top-left, tinted inner shade bottom-right) plus a **large soft outer
drop shadow in the surface's own hue — never grey**. Everything should look pressable, like a
keycap on a squishy keyboard. That metaphor is the whole design: the site is about keys.

### Tokens

**`app/globals.css` is authoritative, not this section.** Every value in it was measured in a
real browser rather than asserted, and both themes come out of one recipe. Read it before you
style anything. What follows is the light palette as it was decided, and why two of the
values are what they are.

```css
--clay-bg: #e9e7fb; /* pale periwinkle page background */
--clay-surface: #f5f4ff; /* raised cards, panels */
--clay-sunken: #dedbf6; /* pressed / inset wells */
--clay-ink: #241f42; /* primary text — deep aubergine, not black */
--clay-ink-soft: #5f5892; /* secondary text — see correction 1 */

--clay-violet: #7b6bf0; /* brand hue: shadows, arcs, glows, tints, pressed keycap */
--clay-violet-deep: #5b47d6; /* solid violet fills and the focus ring — see correction 2 */
--clay-blue: #9ec0ff; /* NORMAL mode */
--clay-mint: #8fe6c4; /* INSERT mode, success */
--clay-butter: #ffd98e; /* VISUAL mode, streaks, highlights */
--clay-coral: #ff9aa8; /* errors, misses */
```

**Correction 1.** This section used to specify `--clay-ink-soft: #6B64A0` and claim it was
"roughly 4.6:1" on `--clay-bg`. Measured, it is 4.37:1 on `--clay-bg` and 3.94:1 on
`--clay-sunken`, so it failed AA for body text on both. It is 4.87:1 on `--clay-surface`, which
was the one ground the old text warned about. `#5F5892` measures 5.24:1, 5.84:1 and 4.72:1.
Do not lighten it back, and do not stack an opacity utility on it either — an 80% multiplier
drops it to 3.8:1, which has failed Lighthouse twice.

**Correction 2.** `--clay-violet` cannot carry a label at any ink: white on it is 4.04:1 and
`--clay-ink` on it is 3.86:1, and it sits in the luminance band where both ends fail. So the
primary button is **not** filled with brand violet. `--clay-violet-deep` (white at 6.33:1) fills
solid violet surfaces and draws the focus ring; brand violet keeps every other job. No other hue
has this problem: coral takes dark ink at 4.90:1, mint 5.05:1, butter 5.97:1, blue 5.73:1.

**If you write contrast tooling, read this.** Chrome serialises `color-mix()` as `oklab()`, not
`rgb()`, so parsing `getComputedStyle(el).color` as three RGB channels silently returns near-black
and every ratio involving a mixed colour comes out wrong **without erroring**. This whole design
system is built on `color-mix()`. Paint the resolved colour into a 1×1 canvas and read the sRGB
pixel back instead.

Dark mode was decided later, against the same recipe rather than as an inversion. What shipped is
section 15 of `app/globals.css`.

### The shadow recipe — parameterised by hue, never one hardcoded shadow

```css
.clay {
  border-radius: 28px;
  background: var(--clay-surface);
  box-shadow:
    0 18px 40px -12px color-mix(in oklab, var(--clay-hue) 35%, transparent),
    inset 0 10px 20px -6px rgba(255, 255, 255, 0.95),
    inset 0 -10px 18px -8px color-mix(in oklab, var(--clay-hue) 35%, transparent);
}
.clay:active {
  /* squish */
  transform: translateY(2px);
  box-shadow:
    0 8px 18px -10px color-mix(in oklab, var(--clay-hue) 30%, transparent),
    inset 0 6px 14px -6px rgba(255, 255, 255, 0.85),
    inset 0 -14px 22px -8px color-mix(in oklab, var(--clay-hue) 50%, transparent);
}
```

`--clay-hue` defaults to `--clay-violet` and is overridden per surface (mint for success,
coral for error, butter for streaks). It is exposed as a `.hue-*` utility and a `hue` prop on
the clay primitives — **do not** copy a literal box-shadow into a component file.

### Radii scale with size — do not put one radius on everything

`--r-key: 14px` · `--r-chip: 18px` · `--r-card: 28px` · `--r-hero: 44px`

### Type

- Display / headings: **Fredoka**
- Body / UI: **Nunito Sans**
- Editor, all key glyphs, all code: **JetBrains Mono**

Sentence case throughout. No tracked-out all-caps eyebrow labels above sections. No single
accent-coloured word in a headline. No `→` glued onto button text. Write plain sentences.

### The signature element: `<Key>`

One keycap component carries the whole personality. It is a clay keycap that **visibly
depresses when that physical key is actually pressed**, glowing in the current mode colour.
Use it everywhere: inline in lesson prose, in the live keystroke log, in the on-screen
keyboard heatmap, in the cheatsheet, in the nav. Everything else on the page stays quiet so
the keys stand out.

Three states, all required:

- **rest** — raised clay, ink glyph, violet-hued shadow
- **pressed** — squished, `translateY(2px)`, inner shade deepened, tinted with the active mode colour
- **mastered** — resting but tinted mint with a soft mint outer glow (used on the heatmap and
  in the cheatsheet once a motion's mastery ≥ 80)

Exactly one orchestrated motion moment: the keycap press/release, and the success "puff" when
an exercise is solved. **No** scroll-reveal fade-ups on every section. **No** hover-lift on
every card. Respect `prefers-reduced-motion`: kill the bounce and the puff, keep the state change.

### Mode display

Mode is communicated by colour and a fat status bar pinned to the bottom of the editor,
exactly like vim's own: `-- NORMAL --` in blue, `-- INSERT --` in mint, `-- VISUAL --` in
butter. The whole editor's border tint changes with the mode.

---

## 3. Routes

```
/                   Landing — live playable editor in the hero, not a screenshot
/learn              Curriculum index (all modules, progress rings)
/learn/[slug]       A single lesson
/practice           Drill picker + your weakest motions surfaced first
/practice/[drill]   A timed drill run
/sandbox            Free-play editor with context-aware key help
/cheatsheet         Full searchable motion reference
/stats              Speed, accuracy, mastery heatmap, history
/about              Why this is free, how to contribute a lesson
```

Every route exports `metadata` for decent OG cards. Both dynamic segments enumerate their
params and set `dynamicParams = false`, so every route prerenders and an unknown lesson or
drill is the prerendered 404.

---

## 4. Content type contract

**[`../content/types.ts`](../content/types.ts) is the contract**, and its comments are the
specification. This section used to reproduce it verbatim, from before that file existed;
the copy is gone rather than left to drift. Roughly 135 hand-written exercises are typed
against it, so changing a field name is a breaking change — raise it, do not make it quietly.

What lives there: `LessonLanguage`, `Pos`, `EditorMode`, the `Goal` union, `Exercise`,
`LessonBlock`, `Lesson`, `Module`. [`../CONTRIBUTING.md`](../CONTRIBUTING.md) walks every
field with a complete worked example.

### Authoring rules that make or break this

1. **Validate by outcome, never by keystrokes.** If the goal is a document state, any key
   sequence producing it passes. `dw`, `de`, `vex` are all correct when the buffer matches.
   Never string-match the learner's input. Keystroke count feeds the efficiency score only.
2. `par` is the _ideal_ count, not a limit. Exceeding it never fails an exercise.

   2b. **Every exercise carries a `solution` that you have checked reaches its `goal`.** This is
   the single highest-value thing you can get right: a wrong column in a `cursor` goal or an
   off-by-one in a `doc` goal makes an exercise unsolvable, and there is no support inbox to
   complain to. `npm run verify` replays every `solution` through the real editor and fails on
   any exercise that does not solve — do not let yours be the one that breaks it.

3. Every exercise has at least one entry in `motions`.
4. `startDoc` uses `\n`, never `\r\n`, and never a trailing newline unless the exercise is
   about one.

   4b. **A literal `<` in any key string is written `<lt>`.** This bites the template and include
   lessons hardest: `f<`, `t<`, `ci<`, `di<` all become `f<lt>`, `t<lt>`, `ci<lt>`, `di<lt>` in
   `solution` and `setupKeys`. A bare `<` will be parsed as the start of a named key and your
   exercise will not run. `>` is unaffected.

5. Prefer `docContains` / `docExcludes` / `cursorOnText` for the ~40-line real-code lessons —
   an exact-`doc` goal on a 40-line file is brittle and unreadable in a diff.
6. Column/line numbers in `cursor` goals are **zero-based**. Count them by hand and get them
   right; a wrong column makes an exercise unsolvable and there is nobody to complain to.
7. Write prompts as instructions to a person, not as puzzles. "Delete the unused import on
   line 3", not "make the buffer look like this".

---

## 5. Inline prose markup

Lesson `prompt`, `hint`, `summary`, and `LessonBlock.body` are plain strings rendered by a
small parser at `components/prose/RichText.tsx`. **No HTML, no `dangerouslySetInnerHTML`** —
there is a lint rule that says so when it fires. Exactly four constructs:

| Written      | Renders as                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[[dw]]`     | two keycaps: `d` then `w`                                                                                                                                                  |
| `[[<Esc>]]`  | one keycap labelled `Esc` (angle brackets name a single key: `<Esc> <CR> <Tab> <Space> <BS> <C-d> <C-r> <C-v> <C-o>`)                                                      |
| `[[f<lt>]]`  | keycaps `f` then `<` — `<lt>` is the escape for a literal less-than, exactly as in real vim, because a bare `<` opens a named-key sequence. A literal `>` needs no escape. |
| `` `code` `` | inline monospace code span                                                                                                                                                 |
| `**bold**`   | bold                                                                                                                                                                       |

`[[ci{]]` renders `c`, `i`, `{` as three keycaps. Anything unrecognised renders as literal text.

The same key notation is what `content/cheatsheet.ts` writes its `keys` in, and what
`solution` and `setupKeys` use.

---

## 6. Stats — exact definitions, no fuzzy numbers

Recorded per exercise attempt and stored in `localStorage`:

- **time** — ms from the learner's first keystroke to the goal being reached.
- **keystrokes** — total keys pressed during the attempt (setup keys excluded).
- **efficiency** — `min(par / keystrokes, 1) * 100`, as a percentage.
- **accuracy** — `1 - (wastedKeys / keystrokes)`, or `1` when `keystrokes` is 0. A key is wasted
  only when it **completes a command** (`pendingKeys` returns to empty after it) and that completed
  command left both the document and the cursor unchanged. Keys consumed in operator-pending state
  — the `d` of `dw`, the `c` and `i` of `ci"`, count digits, the `f` before its target — are never
  wasted on their own; they are judged as part of the command they belong to. Mode changes (`v`,
  `i`, `Esc`) are never wasted. Retroactively, when `u` undoes a change, the keys of the command it
  undid become wasted, as do the `u` and any `Ctrl+r`.

  This matters more than it looks. Under the naive reading — "a key that changed neither the
  document nor the cursor" — the `d` in `dw` is wasted, so a flawless `dw` scores 50% and a
  flawless `ci"clay<Esc>` scores about 75%. A metric that punishes correct play is worse than no
  metric.

- **kpm** — keystrokes per minute. The honest analogue of WPM here.
- **streak** — consecutive exercises solved without exceeding 2× par.

Guard every derived metric against a zero denominator: `efficiency` is `100` and `accuracy` is `1`
at 0 keystrokes, and `kpm` is `0` at 0 elapsed time. **Evaluate the goal only after the first
keystroke**, so an exercise whose goal happens to hold at mount — a `mode: 'normal'` goal, or a
`cursor` goal equal to `startCursor` — cannot solve itself at 0 keystrokes and render `NaN%`.

Derived:

- **motion mastery** — 0–100 per motion (`dw`, `ci{`, `f`, …), a rolling average over the last
  5 attempts that used it. Shown as the on-screen keyboard heatmap on `/stats`: mint where
  strong, coral where weak.
- **weakness weighting** — a drill samples exercises with probability inversely proportional
  to the mastery of the motions they train. Say so in the UI: "surfacing your weakest motions
  first."

The formula is written down once, at the top of `lib/stats/mastery.ts`, and `lib/drills` reads
it from there. A second copy would drift and the heatmap would disagree with the drill that
claims to fix it.

`/stats` has prominent **Export progress (JSON)** and **Import progress** buttons. That is how
progress moves between devices without an account, and it is the honest answer to "how do I
save my progress". It costs nothing, so make it obvious rather than tucking it in a footer.

Storage key namespace: `vimclay:v1:*`. Every stored blob carries a `version` field and the
loader must tolerate an unknown or older version by discarding rather than throwing.
`lib/progress` owns that schema; see [`../AGENTS.md`](../AGENTS.md) for what it bounds and why
finite is not the same as sane.

---

## 7. Behaviour details that make or break this

- **Focus.** The editor grabs focus on lesson load. When it does not have focus, show a clear
  clay "click to focus" overlay — nobody should type into the void.
- **Don't fight the browser.** `Ctrl+d`, `Ctrl+u`, `Ctrl+r`, `/` must work inside the editor;
  prevent default **only** while the editor has focus. `Ctrl+w` is unrecoverable in a browser —
  never bind it, and say so in the lesson prose where it would come up.
- **Escape hatch.** `Esc` returns to normal mode. `Esc` again, when already in normal mode,
  releases focus back to the page so keyboard users are never trapped. Document this visibly
  in the editor chrome.
- **Lesson navigation.** `Ctrl+j` next lesson, `Ctrl+k` previous — this rewards the muscle
  memory the site is teaching. Only when the editor is not in insert mode.
- **Reset.** `r` on the results screen retries the exercise; there is also a visible clay
  "Reset exercise" button.
- **Mobile.** This needs a physical keyboard and that is fine. On small screens serve a
  readable version of the lesson prose plus the cheatsheet, and a friendly clay panel
  explaining the exercises need a keyboard — not a broken editor and not a blank page.
- **Accessibility floor.** Visible keyboard focus rings everywhere. `prefers-reduced-motion`
  respected. Real contrast (see §2). Every interactive element reachable by Tab.
- **The live region carries mode changes and solve events only, and the keystroke log is
  `aria-hidden`.** This section used to ask for the keystroke log to be announced too. That was
  wrong: a screen reader already echoes each key the user presses, so announcing them again on top
  of that makes a modal editor unusable.

---

## 8. Module boundaries

One rule survives from the original ownership table, and it is the one the code depends on:
**each thing has exactly one home, and the other places read it from there.**

| The thing                                     | Its one home                        |
| --------------------------------------------- | ----------------------------------- |
| the design tokens and every clay recipe       | `app/globals.css`                   |
| the content types                             | `content/types.ts`                  |
| the prose parser                              | `components/prose/`                 |
| the editor, the bridge and the goal evaluator | `components/editor/`, `lib/engine/` |
| the stored progress schema                    | `lib/progress/`                     |
| the metric and mastery maths                  | `lib/stats/`                        |
| the drill sampler                             | `lib/drills/`                       |
| the site's own identity (its URL, its repo)   | `lib/site.ts`                       |
| the theme preference                          | `lib/theme/`                        |

So `components/cheatsheet/` decides which rows to tint but takes `motionMastery` from
`lib/stats`; `lib/drills` takes the same function from the same place; nothing recomputes a
number that already has an owner.

**Route files stay thin**: a `metadata` export, params handling, and one component from
`components/`. Behaviour lives in the component. A route file changes when the route's own
contract changes — `generateStaticParams`, `dynamicParams`, metadata — and not otherwise.

```
app/page.tsx                  -> components/landing/Landing.tsx
app/learn/page.tsx            -> components/learn/CurriculumIndex.tsx
app/learn/[slug]/page.tsx     -> components/learn/LessonRunner.tsx
app/practice/page.tsx         -> components/practice/DrillPicker.tsx
app/practice/[drill]/page.tsx -> components/practice/DrillRun.tsx
app/sandbox/page.tsx          -> components/sandbox/Sandbox.tsx
app/cheatsheet/page.tsx       -> components/cheatsheet/Cheatsheet.tsx
app/stats/page.tsx            -> components/stats/StatsPage.tsx
app/about/page.tsx            -> components/about/About.tsx
```

---

## 9 and 10 — removed on publication

Build-process sections, kept out of the repository rather than renumbered. See the note at
the top of this file.

---

## 11. The engine's published surface

`components/editor/`, `lib/engine/` and `components/learn/` own the editor. What they export
is consumed by the practice runner, the sandbox and the landing hero, which makes it a
contract rather than an implementation detail: add to it freely, but renaming or narrowing it
breaks three callers at once.

**[`../lib/engine/types.ts`](../lib/engine/types.ts) carries the signatures**, and
`lib/engine/index.ts` is the front door — import from there. This section used to reproduce
the types; that copy is gone, because it had already drifted from the code it described.

The parts that are contract rather than shape:

- **`EditorSnapshot` is the whole observation surface**: document, cursor, selection, mode,
  the pending-key string, and the registers. It deliberately carries **no key history**, which
  is what makes §4 rule 1 enforceable rather than aspirational — `evaluateGoal` physically
  cannot see what the learner typed.
- **`evaluateGoal(goal, snapshot)` is pure** — no React, no editor reference, no DOM. That is
  what lets `scripts/verify-exercises.ts` replay every exercise's `solution` and assert the
  goal is reached with no UI involved.
- **`EditorSnapshot.pendingKeys` is a display string, not a key list.** It is vim's own
  showcmd buffer with the register prefix re-attached, so `"a2y` arrives as one string with
  the count and the register still inside it. Anything reading it has to parse it.
- **`AttemptState` carries the numbers §6 defines**, computed live during an attempt. The same
  formulas are in `lib/stats/metrics.ts`, and the two agree by construction, not by luck.
- **Never value-import `lib/engine/vim-bridge.ts` from a page-level component.** It imports
  `@replit/codemirror-vim`, so one value import drags ~240 kB of editor into that route's
  first load — silently, because the page still works. Pages type-import from
  `lib/engine/types.ts`; values arrive through the `onReady(bridge)` callback, which only ever
  runs inside the dynamically-loaded chunk. There is a lint rule for the adjacent mistake
  (`defaultKeymap` / `basicSetup`), but not for this one.
