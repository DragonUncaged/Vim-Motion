import type { AttemptRecord } from '@/lib/progress';
import {
  attemptAccuracy,
  attemptEfficiency,
  kpm,
  mean,
  median,
  streaks,
  type Streaks,
} from './metrics';

export interface StatsSummary {
  attempts: number;
  solvedAttempts: number;
  exercisesSolved: number;
  lessonsTouched: number;
  streak: Streaks;
  medianSolveMs: number | null;
  avgEfficiency: number | null;
  avgAccuracy: number | null;
  kpm: number | null;
  totalKeystrokes: number;
  totalTimeMs: number;
  lastAttemptAt: number | null;
}

export function summarise(attempts: AttemptRecord[]): StatsSummary {
  const solved = attempts.filter((a) => a.solved);
  const exercises = new Set(solved.map((a) => `${a.lessonSlug}/${a.exerciseId}`));
  const lessons = new Set(solved.map((a) => a.lessonSlug));

  const totalKeystrokes = attempts.reduce((sum, a) => sum + a.keystrokes, 0);
  const totalTimeMs = attempts.reduce((sum, a) => sum + a.timeMs, 0);

  return {
    attempts: attempts.length,
    solvedAttempts: solved.length,
    exercisesSolved: exercises.size,
    lessonsTouched: lessons.size,
    streak: streaks(attempts),
    medianSolveMs: median(solved.map((a) => a.timeMs)),
    avgEfficiency: mean(solved.map(attemptEfficiency)),
    avgAccuracy: mean(solved.map(attemptAccuracy)),
    kpm: totalTimeMs > 0 ? kpm(totalKeystrokes, totalTimeMs) : null,
    totalKeystrokes,
    totalTimeMs,
    lastAttemptAt: attempts.length === 0 ? null : Math.max(...attempts.map((a) => a.at)),
  };
}
