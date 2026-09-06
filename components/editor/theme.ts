/** No literal colours: app/globals.css is the palette (docs/CONTRACT.md §2). */

import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const clayEditorTheme = EditorView.theme(
  {
    '&': {
      background: 'transparent',
      color: 'var(--clay-code)',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      height: '100%',
      maxHeight: 'var(--vc-editor-max-height, 26rem)',
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
      fontFamily: 'inherit',
      lineHeight: 'inherit',
      padding: '0',
      overflow: 'auto',
    },
    '.cm-content': { padding: '0', caretColor: 'var(--clay-hue)' },
    '.cm-line': { padding: '0 0 0 0.25rem' },

    '.cm-gutters': {
      // Opaque so axe measures line-number contrast against the well (5.09:1), not the page (2.68:1).
      background: 'var(--clay-editor)',
      color: 'var(--clay-code-dim)',
      border: 'none',
      paddingRight: '0.75rem',
      userSelect: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '2ch', padding: '0 0 0 0.5rem' },
    '.cm-activeLineGutter': {
      background: 'transparent',
      color: 'var(--clay-hue)',
      fontWeight: '700',
    },
    '.cm-activeLine': { background: 'color-mix(in oklab, var(--clay-hue) 10%, transparent)' },

    /** Every declaration needs !important: the package styles this at Prec.highest and inlines the colour. */
    '.cm-fat-cursor': {
      background: 'var(--clay-hue) !important',
      color: 'var(--clay-editor) !important',
      borderRadius: '2px',
    },
    // Overrides the package's color: transparent !important, which hides the character under the cursor.
    '&:not(.cm-focused) .cm-fat-cursor': {
      background: 'none !important',
      outline: '1px solid var(--clay-hue)',
      color: 'var(--clay-code) !important',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--clay-hue)', borderLeftWidth: '2px' },

    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      background: 'color-mix(in oklab, var(--clay-butter) 34%, transparent)',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      background: 'color-mix(in oklab, var(--clay-hue) 30%, transparent)',
      outline: 'none',
    },

    // Do not hide: this panel is also the `/` search prompt.
    '.cm-panels, .cm-vim-panel': {
      background: 'color-mix(in oklab, var(--clay-hue) 22%, var(--clay-editor))',
      color: 'var(--clay-code)',
      border: 'none',
      padding: '0.25rem 0.75rem',
      fontFamily: 'inherit',
    },
    '.cm-vim-panel input': {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--clay-code)',
      fontFamily: 'inherit',
      fontSize: 'inherit',
    },
  },
  { dark: true },
);

export const clayHighlightStyle = HighlightStyle.define(
  [
    {
      tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword],
      color: 'var(--clay-code-kw)',
    },
    { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--clay-code-str)' },
    { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--clay-code-num)' },
    {
      tag: [
        t.function(t.variableName),
        t.function(t.propertyName),
        t.definition(t.function(t.variableName)),
        t.className,
        t.typeName,
      ],
      color: 'var(--clay-code-fn)',
    },
    {
      tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
      color: 'var(--clay-code-com)',
      fontStyle: 'italic',
    },
    {
      tag: [t.punctuation, t.separator, t.bracket, t.operator, t.meta],
      color: 'var(--clay-code-dim)',
    },
    { tag: [t.propertyName, t.attributeName], color: 'var(--clay-code)' },
    { tag: [t.tagName, t.angleBracket], color: 'var(--clay-code-kw)' },
    { tag: [t.invalid], color: 'var(--clay-coral)' },
  ],
  { themeType: 'dark' },
);
