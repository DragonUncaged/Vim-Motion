import { allCheats } from '@/content/cheatsheet';
import { catalogue } from '@/content/lessons';
import { CheatsheetBrowser } from './CheatsheetBrowser';
import { buildMotionLessonIndex } from './lessonLinks';

export function Cheatsheet() {
  return (
    <div className="flex flex-col gap-7 pt-2">
      <header className="flex flex-col gap-4">
        <h1 className="m-0">Cheatsheet</h1>
        <p className="clay-prose m-0 text-lg">
          {allCheats.length} motions, grouped by operator or by task.
        </p>
      </header>

      <CheatsheetBrowser lessons={buildMotionLessonIndex(catalogue)} />
    </div>
  );
}
