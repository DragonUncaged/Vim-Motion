# The three font files

Committed so `next build` needs no network. Before this, `app/layout.tsx` used
`next/font/google`, which fetches from `fonts.googleapis.com` at build time and, in a
production build, re-throws on failure instead of falling back — a builder with no egress,
or a Google outage, turned into a red build with no code change.

## What these files are

Each is the **latin subset Google Fonts itself served**, lifted byte for byte out of
`.next/static/media/` from the last build that fetched them. They are not re-subset or
re-compressed here, so what the browser downloads is unchanged from before the move and the
rendering is identical.

| file                                 | family         | weight     | bytes  |
| ------------------------------------ | -------------- | ---------- | ------ |
| `Fredoka-Latin-600.woff2`            | Fredoka        | `600`      | 16,464 |
| `NunitoSans-Latin-Variable.woff2`    | Nunito Sans    | `200 1000` | 30,948 |
| `JetBrainsMono-Latin-Variable.woff2` | JetBrains Mono | `100 800`  | 40,480 |

**Latin only.** The old build also declared latin-ext, cyrillic, cyrillic-ext, greek,
vietnamese and hebrew faces, but preloaded only latin — and nothing on this site paints a
glyph from any of them. The four non-ASCII glyphs the site does paint outside the latin
range (→ U+2192, ≥ U+2265, ● U+25CF, ✓ U+2713) are in **no** Google subset for these
families, so they came from the system stack before this change as well.

## Licences

All three are SIL Open Font License 1.1, and none declares a Reserved Font Name, so a
subset may be redistributed under the same family name. The texts are beside the files:

- `fredoka.OFL.txt` — Copyright 2016 The Fredoka Project Authors
- `nunitosans.OFL.txt` — Copyright 2016 The Nunito Sans Project Authors
- `jetbrainsmono.OFL.txt` — Copyright 2020 The JetBrains Mono Project Authors

Each was taken from that family's directory in `github.com/google/fonts`.

## Taking a newer version

Point `app/layout.tsx` back at `next/font/google` for one build, take the three `-s.p.woff2`
files out of `.next/static/media/` (the `.p.` marks the preloaded, i.e. requested-subset,
file — one per family), rename them as above, and put the loaders back. Re-run
`npm run e2e -- e2e/fonts.spec.ts`, which asserts three preloaded files and one display
weight.
