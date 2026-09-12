export {
  PAR_MULTIPLE,
  efficiency,
  accuracy,
  kpm,
  attemptEfficiency,
  attemptAccuracy,
  attemptKpm,
  exceededPar,
  isCleanSolve,
  streaks,
  median,
  mean,
  type Streaks,
} from './metrics';

export {
  MASTERY_WINDOW,
  EFFICIENCY_WEIGHT,
  ACCURACY_WEIGHT,
  OVER_PAR_PENALTY,
  MASTERED_AT,
  UNPRACTISED_WEIGHT,
  scoreAttempt,
  motionMastery,
  motionAttemptCounts,
  weaknessWeight,
  weakestMotions,
  type MotionMastery,
} from './mastery';

export { SESSION_GAP_MS, sessions, type Session } from './sessions';

export { summarise, type StatsSummary } from './summary';

export {
  curriculumProgress,
  curriculumMotions,
  lessonsForMotion,
  type LessonProgress,
  type ModuleProgress,
} from './curriculum';
