export type LessonLanguage = 'text' | 'tsx' | 'go' | 'cpp';

export type ClayHue = 'violet' | 'blue' | 'mint' | 'butter' | 'coral';

export type ModuleId = 'basics' | 'operators' | 'react-tsx' | 'go';

/** Zero-based line, zero-based character offset within that line. */
export interface Pos {
  line: number;
  ch: number;
}

export type EditorMode =
  'normal' | 'insert' | 'visual' | 'visual-line' | 'visual-block' | 'replace';

/** Judged against the resulting editor state, never against the keys the learner typed. */
export type Goal =
  | { type: 'cursor'; line: number; ch: number }
  | { type: 'doc'; expected: string }
  /** Document contains this substring (use for long real-code files). */
  | { type: 'docContains'; expected: string }
  | { type: 'docExcludes'; expected: string }
  /** Cursor sits anywhere inside the `occurrence`-th (0-based, default 0) match of `text`. */
  | { type: 'cursorOnText'; text: string; occurrence?: number }
  | { type: 'selection'; from: Pos; to: Pos }
  /** Named register holds exactly this. Use '"' for the unnamed register. */
  | { type: 'register'; name: string; expected: string }
  | { type: 'mode'; mode: EditorMode }
  | { type: 'all'; goals: Goal[] };

export interface Exercise {
  /** Unique within the lesson and stable: it keys stored progress. */
  id: string;
  /** One sentence. Supports the inline markup in docs/CONTRACT.md §5. */
  prompt: string;
  startDoc: string;
  startCursor: Pos;
  goal: Goal;
  /** Required, in `setupKeys` notation. `npm run verify` replays it to prove the goal is reachable. */
  solution: string;
  /** Ideal keystroke count, normally that of `solution`: `dw` is 2, `ciwcenter<Esc>` is 10. */
  par: number;
  hint?: string;
  /**
   * Replayed before timing and counting start. Named keys go in angle brackets (<Esc> <C-d>);
   * a literal '<' is written <lt>, so 'f<' is 'f<lt>', and '>' needs no escape.
   */
  setupKeys?: string;
  /** Fail the attempt on any other key. Only where avoiding a crutch is the point, e.g. hjkl. */
  allowedKeys?: string[];
  /** Required and non-empty, in canonical notation ('dw', 'ci{', bare 'f' where the target is incidental). */
  motions: string[];
}

export interface LessonBlock {
  heading: string;
  /** Supports the inline markup in docs/CONTRACT.md §5. */
  body: string;
}

export interface Lesson {
  /** URL segment. Unique across the whole site. */
  slug: string;
  title: string;
  module: ModuleId;
  /** 1-based and dense within the module. */
  order: number;
  keys: string[];
  /** One line for the curriculum index card. */
  summary: string;
  explanation: LessonBlock[];
  language: LessonLanguage;
  exercises: Exercise[];
}

export interface LessonCard {
  slug: string;
  title: string;
  module: ModuleId;
  order: number;
  keys: string[];
  summary: string;
  language: LessonLanguage;
  exercises: ExerciseCard[];
}

export interface ExerciseCard {
  id: string;
  motions: string[];
}

export interface Module {
  id: ModuleId;
  name: string;
  /** 1-based. */
  order: number;
  blurb: string;
  accent: ClayHue;
}
