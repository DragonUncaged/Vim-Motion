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
