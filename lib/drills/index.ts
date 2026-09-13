export { categories, categoryById, itemsFor, motionsFor, WEAKEST } from './categories';
export {
  isFindMotion,
  isInsertEdit,
  isJump,
  isOperator,
  isRepeat,
  isSearch,
  isTextObject,
  isVisual,
  isWordMotion,
  displayMotion,
} from './motions';
export {
  sampleDrill,
  targetedMotions,
  exerciseWeakness,
  recencyFactor,
  RECENCY_WINDOW_MS,
  RECENCY_FLOOR,
  SIBLING_DAMPING,
  WEAKEST_EMPHASIS,
  type SampleInput,
  type SampleResult,
} from './sample';
export {
  DRILL_LENGTH,
  planDrill,
  planFor,
  planWeakest,
  pickSpeedrunItem,
  lastSeenByExercise,
  type PlanInput,
} from './plan';
export { categoryOverviews, type CategoryOverview } from './overview';
export { mulberry32, newSeed } from './rng';
export type {
  CategoryKind,
  DrillCategory,
  DrillItem,
  LoadedDrillItem,
  DrillPlan,
  DrillOutcome,
  DrillResult,
  MotionStanding,
} from './types';
