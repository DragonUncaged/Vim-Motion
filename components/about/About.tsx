import Link from 'next/link';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key } from '@/components/clay/Key';
import { RichText } from '@/components/prose/RichText';
import { allLessons } from '@/content/lessons';
import { CodeBlock } from './CodeBlock';
import { BARREL_PATH, EXAMPLE_BARREL, EXAMPLE_LESSON, EXAMPLE_PATH } from './exampleLesson';
import { LESSONS_URL, LICENSE_URL, REPO_URL } from '@/lib/site';

const FIELDS: { name: string; body: string }[] = [
  {
    name: 'goal',
    body:
      'What counts as solved, checked against the editor and **never** against the keys ' +
      'typed: [[dw]], [[de]] and [[vex]] all pass if the buffer ends up right. Lines and ' +
      'columns are zero-based.',
  },
  {
    name: 'solution',
    body:
      'A key sequence that reaches the goal. Never shown to the learner — it proves the ' +
      'exercise is solvable. A literal `<` is written `<lt>`, so `ci<` is `ci<lt>`.',
  },
  {
    name: 'par',
    body:
      'The ideal keystroke count, normally the length of your `solution`. Going over it never ' +
      'fails anyone. [[dw]] is 2; `ciwcenter<Esc>` is 10.',
  },
  {
    name: 'motions',
    body:
      'The motions this exercise trains, in the cheatsheet’s notation: `dw`, `ci{`, `f`, ' +
      '`gg`. Required — mastery and the drills are built on it.',
  },
];

export function About() {
  return (
    <div className="flex flex-col gap-7 pt-2">
      <header className="flex flex-col gap-4">
        <h1 className="m-0">About</h1>
        <p className="clay-prose m-0 text-lg">
          Learn vim motions by doing them, in a real vim editor. {allLessons.length} lessons.
        </p>
      </header>

      <ClayPanel hue="mint" tint className="flex flex-col gap-4 px-6 py-7 sm:px-8">
        <h2 className="m-0 text-2xl">How it works</h2>
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          <li className="flex flex-col gap-1">
            <strong className="text-[1.0625rem]">Progress lives in your browser</strong>
            <span className="clay-prose text-base">
              Attempts go to <code className="clay-code">localStorage</code>.{' '}
              <Link href="/stats" className="underline underline-offset-4">
                The stats page
              </Link>{' '}
              exports them as a JSON file you can import on another machine.
            </span>
          </li>
          <li className="flex flex-col gap-1">
            <strong className="text-[1.0625rem]">Lessons are plain TypeScript files</strong>
            <span className="clay-prose text-base">Clone the repo and change the curriculum.</span>
          </li>
        </ul>
      </ClayPanel>

      <ClayPanel hue="butter" className="flex flex-col gap-5 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-2xl">Contributing a lesson</h2>
          <p className="clay-prose m-0 text-base">
            One TypeScript file and one line in a barrel. The type in{' '}
            <code className="clay-code">content/types.ts</code> is the whole contract, and{' '}
            <code className="clay-code">npm run verify</code> tells you when you have broken it.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="m-0">1. Write the file</h3>
          <p className="clay-prose m-0 text-base">
            Named for its slug, in its module’s folder. This one is real: paste it, add step 2, and
            the site serves <code className="clay-code">/learn/join-lines</code>.
          </p>
          <CodeBlock code={EXAMPLE_LESSON} filename={EXAMPLE_PATH} />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="m-0">2. Add one line to the module barrel</h3>
          <p className="clay-prose m-0 text-base">
            An import and an array entry. Order is 1-based with no gaps, and the registry refuses to
            load otherwise.
          </p>
          <CodeBlock code={EXAMPLE_BARREL} filename={BARREL_PATH} />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="m-0">3. Check it</h3>
          <p className="clay-prose m-0 text-base">
            <code className="clay-code">npm run format</code>, then{' '}
            <code className="clay-code">npm run verify</code> — the same gate CI runs. It replays
            every exercise’s <code className="clay-code">solution</code> through the real editor, so
            a lesson whose coordinates are off by one fails there rather than shipping. Fix the
            exercise, never the check.
          </p>
          <p className="clay-prose m-0 text-base">
            Touched layout? <code className="clay-code">npm run e2e</code> runs every route at three
            widths in both themes.
          </p>
        </div>
      </ClayPanel>

      <ClayPanel hue="violet" className="flex flex-col gap-5 px-6 py-7 sm:px-8">
        <h2 className="m-0 text-2xl">The fields that are not obvious</h2>
        <dl className="m-0 flex flex-col gap-5">
          {FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <dt>
                <code className="clay-code text-[0.9375rem]">{field.name}</code>
              </dt>
              <dd className="m-0">
                <RichText as="p" className="clay-prose m-0 text-base">
                  {field.body}
                </RichText>
              </dd>
            </div>
          ))}
        </dl>
        <p className="clay-prose m-0 text-base">
          Prose fields take four constructs and no HTML: <code className="clay-code">[[dw]]</code>{' '}
          becomes keycaps like <Key label="d" size="inline" /> <Key label="w" size="inline" />,{' '}
          <code className="clay-code">[[&lt;Esc&gt;]]</code> one named cap, backticks a code span,{' '}
          <code className="clay-code">**bold**</code> bold.
        </p>
      </ClayPanel>

      {REPO_URL !== '' && (
        <ClayPanel hue="blue" tint className="flex flex-col gap-4 px-6 py-7 sm:px-8">
          <h2 className="m-0 text-2xl">The source</h2>
          <p className="clay-prose m-0 text-base">
            The site, the lessons and the design system all live in one repository.
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            <li>
              <a href={REPO_URL} className="clay-btn clay-btn-primary px-5 py-3">
                The repository
              </a>
            </li>
            <li>
              <a href={LESSONS_URL} className="clay-btn clay-btn-secondary px-5 py-3">
                The lessons folder
              </a>
            </li>
            <li>
              <a href={LICENSE_URL} className="clay-btn clay-btn-secondary px-5 py-3">
                Licence
              </a>
            </li>
          </ul>
        </ClayPanel>
      )}
    </div>
  );
}
