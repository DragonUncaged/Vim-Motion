import type { ClayHue, Exercise, LessonLanguage, ModuleId } from '@/content/types';

/** No exercise body on purpose: the pool ships to /practice as props; bodies load via lib/drills/exercises.ts. */
export interface DrillItem {
  key: string;
  exerciseId: string;
  motions: string[];
  lessonSlug: string;
  lessonTitle: string;
  moduleId: ModuleId;
  language: LessonLanguage;
}

/** docs/CONTRACT.md §4 rule 1 */
export interface LoadedDrillItem extends DrillItem {
  exercise: Exercise;
}

export type CategoryKind = 'weakest' | 'module' | 'group';

export interface DrillCategory {
  id: string;
  name: string;
  kind: CategoryKind;
  blurb: string;
  hue: ClayHue;
  moduleId?: ModuleId;
  matches: (item: DrillItem) => boolean;
  /** Narrower than `matches`: a word-motion exercise may also train `<Esc>`, which this category does not cover. */
  coversMotion: (motion: string) => boolean;
}

export interface MotionStanding {
  motion: string;
  mastery: number | undefined;
  inRun: number;
}

export interface DrillPlan {
  category: DrillCategory;
  seed: number;
  items: DrillItem[];
  targeted: MotionStanding[];
  poolSize: number;
  cold: boolean;
}

export type DrillOutcome = 'solved' | 'skipped' | 'failed';

export interface DrillResult {
  item: LoadedDrillItem;
  outcome: DrillOutcome;
  reached: boolean;
  timeMs: number;
  keystrokes: number;
  par: number;
  efficiency: number;
  accuracy: number;
}
