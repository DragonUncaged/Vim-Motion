import Link from 'next/link';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayRing, ClayBar } from '@/components/clay/ClayProgress';
import type { ModuleProgress } from '@/lib/stats';
import { plural } from '@/lib/stats/format';

export function CurriculumProgress({ modules }: { modules: ModuleProgress[] }) {
  const exercises = modules.reduce((sum, m) => sum + m.exercises, 0);
  const solved = modules.reduce((sum, m) => sum + m.solved, 0);

  return (
    <ClayPanel hue="blue" className="flex flex-col gap-5 px-7 py-6">
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-xl">Curriculum</h2>
        <p className="clay-prose m-0 text-base">
          {solved === 0
            ? `${plural(exercises, 'exercise')} across ${plural(modules.length, 'module')}, none solved yet.`
            : `${solved} of ${plural(exercises, 'exercise')} solved.`}
        </p>
      </div>

      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {modules.map((module) => {
          const heading = (
            <>
              <ClayRing
                value={module.completion * 100}
                hue={module.accent}
                size={56}
                label={`of ${module.name} complete`}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-display text-lg font-semibold">{module.name}</span>
                <span className="clay-secondary text-sm">
                  {module.lessons.length === 0
                    ? 'Still being written.'
                    : `${module.solved} of ${module.exercises} exercises · ${module.lessonsComplete} of ${plural(module.lessons.length, 'lesson')} finished`}
                </span>
              </span>
            </>
          );

          if (module.lessons.length === 0) {
            return (
              <li
                key={module.id}
                className="flex items-center gap-4 rounded-card bg-clay-surface/70 px-5 py-4"
              >
                {heading}
              </li>
            );
          }

          return (
            <li key={module.id}>
              <details className="group rounded-card bg-clay-surface/70 px-5 py-4">
                <summary className="clay-focusable flex cursor-pointer list-none items-center gap-4 rounded-chip">
                  {heading}
                  <span className="clay-secondary ml-auto shrink-0 pl-3 text-sm underline underline-offset-4">
                    <span className="group-open:hidden">Show lessons</span>
                    <span className="hidden group-open:inline">Hide lessons</span>
                  </span>
                </summary>

                {module.lessons.length > 0 && (
                  <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson.slug}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
                      >
                        <Link
                          href={`/learn/${lesson.slug}`}
                          className="clay-focusable min-w-[10rem] flex-1 rounded-chip underline underline-offset-4"
                        >
                          {lesson.title}
                        </Link>
                        <span className="w-28 shrink-0">
                          <ClayBar
                            value={lesson.completion * 100}
                            hue={module.accent}
                            label={`${lesson.title} progress`}
                          />
                        </span>
                        <span className="clay-secondary w-16 shrink-0 text-right">
                          {lesson.solved}/{lesson.exercises}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </li>
          );
        })}
      </ul>
    </ClayPanel>
  );
}
