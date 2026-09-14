import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

/**
 * CodeMesh's own CodeMirror theme.
 *
 * This replaces @codemirror/theme-one-dark, which was only applied in dark
 * mode -- light mode fell through to CodeMirror's stock look, so the code
 * surface matched the product in neither. One theme now covers both.
 *
 * Every colour is a CSS custom property rather than a literal, which is what
 * lets a single definition serve light and dark: the variables flip with the
 * app's theme (see the palette at the end of index.css) and the editor follows
 * without being reconfigured. CodeEditor already rebuilds the view when the
 * theme changes, so no Compartment is involved either way.
 */

const chrome = (dark: boolean) =>
  EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: 'var(--code-bg)',
        color: 'var(--text-h)',
      },
      '.cm-scroller': { fontFamily: 'var(--mono), ui-monospace, Consolas, monospace' },
      '.cm-content': { caretColor: 'hsl(var(--primary))' },

      // Cursor and selection. The drop/primary cursor is brand-coloured and a
      // little thicker than the default so it stays findable against code.
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'hsl(var(--primary))',
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'hsl(var(--primary) / 0.25)',
      },
      '.cm-selectionMatch': { backgroundColor: 'hsl(var(--accent-brand) / 0.22)' },

      // Gutters sit flush with the editor rather than in their own band.
      '.cm-gutters': {
        backgroundColor: 'var(--code-bg)',
        color: 'var(--syn-comment)',
        border: 'none',
      },
      '.cm-activeLine': { backgroundColor: 'hsl(var(--primary) / 0.06)' },
      '.cm-activeLineGutter': {
        backgroundColor: 'hsl(var(--primary) / 0.08)',
        color: 'var(--text-h)',
      },
      '.cm-foldPlaceholder': {
        backgroundColor: 'hsl(var(--primary) / 0.15)',
        color: 'hsl(var(--primary))',
        border: 'none',
        borderRadius: '4px',
        padding: '0 4px',
      },

      '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: 'hsl(var(--accent-brand) / 0.25)',
        outline: '1px solid hsl(var(--accent-brand) / 0.5)',
        color: 'inherit',
      },
      '.cm-nonmatchingBracket': { color: 'var(--syn-invalid)' },

      // Search: the panel is a real surface instead of the default grey strip,
      // and the current match is brand-filled so it reads as "this one".
      '.cm-panels': {
        backgroundColor: 'var(--bg)',
        color: 'var(--text-h)',
        border: 'none',
      },
      '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--border)' },
      '.cm-panels.cm-panels-top': { borderBottom: '1px solid var(--border)' },
      '.cm-panel input, .cm-panel button, .cm-panel select': {
        backgroundColor: 'var(--code-bg)',
        color: 'var(--text-h)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '2px 6px',
      },
      '.cm-searchMatch': { backgroundColor: 'hsl(var(--accent-brand) / 0.28)' },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: 'hsl(var(--primary) / 0.45)',
      },

      // Autocomplete popup -- without this it renders as stock white, which is
      // glaring over a dark editor.
      '.cm-tooltip': {
        backgroundColor: 'var(--bg)',
        color: 'var(--text-h)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
      },
      '.cm-tooltip .cm-tooltip-arrow:before': { borderTopColor: 'var(--border)' },
      '.cm-tooltip .cm-tooltip-arrow:after': { borderTopColor: 'var(--bg)' },
      '.cm-tooltip-autocomplete > ul > li': { padding: '2px 8px' },
      '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'hsl(var(--primary) / 0.18)',
        color: 'var(--text-h)',
      },
      '.cm-completionIcon': { color: 'var(--syn-comment)' },
    },
    { dark },
  )

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.moduleKeyword], color: 'var(--syn-keyword)' },
  { tag: [t.operator, t.operatorKeyword, t.punctuation, t.separator, t.bracket], color: 'var(--syn-operator)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: 'var(--syn-function)' },
  { tag: [t.definition(t.variableName), t.variableName, t.propertyName, t.attributeName], color: 'var(--syn-variable)' },
  { tag: [t.typeName, t.className, t.namespace, t.tagName, t.standard(t.tagName)], color: 'var(--syn-type)' },
  { tag: [t.string, t.special(t.string), t.regexp, t.escape], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool, t.null, t.atom, t.literal], color: 'var(--syn-number)' },
  { tag: [t.comment, t.blockComment, t.lineComment, t.docComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.meta, t.processingInstruction], color: 'var(--syn-comment)' },
  { tag: t.invalid, color: 'var(--syn-invalid)' },
  { tag: t.heading, color: 'var(--syn-keyword)', fontWeight: 'bold' },
  { tag: t.link, color: 'var(--syn-function)', textDecoration: 'underline' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
])

/** The full editor theme: chrome plus syntax colours. */
export function codemeshTheme(isDark: boolean): Extension[] {
  return [chrome(isDark), syntaxHighlighting(highlight)]
}
