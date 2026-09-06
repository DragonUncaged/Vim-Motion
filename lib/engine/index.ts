/** docs/CONTRACT.md §11. vim-bridge is not re-exported: its values would pull ~240 kB of editor into every importer. */

export { evaluateGoal, describeGoal } from './goal';
export { offsetToPos, posToOffset, nthIndexOf } from './text';
export type {
  AttemptState,
  EditorMode,
  EditorSnapshot,
  KeystrokeRecord,
  Pos,
  SnapshotSelection,
  VimEditorProps,
} from './types';
export type { VimBridge, PendingCommand, RegisterValue } from './vim-bridge';
