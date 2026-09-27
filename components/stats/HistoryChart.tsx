import { ClayPanel } from '@/components/clay/ClayPanel';
import { shortDate } from '@/lib/stats/format';
import type { Session } from '@/lib/stats';

const MAX_POINTS = 12;

const VIEW_W = 560;
const VIEW_H = 226;
const PAD_LEFT = 42;
const PAD_RIGHT = 46;
const PAD_TOP = 30;
const PAD_BOTTOM = 28;

const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

const KPM_COLOUR = 'var(--clay-violet-deep)';
const ACC_COLOUR = 'var(--clay-mint-ink)';

export function HistoryChart({ sessions }: { sessions: Session[] }) {
  const recent = sessions.slice(-MAX_POINTS);
  const first = recent[0];
  const last = recent.at(-1);

  if (recent.length < 2 || first === undefined || last === undefined) {
    return (
      <ClayPanel hue="violet" className="flex flex-col gap-2 px-7 py-6">
        <h2 className="m-0 text-xl">Speed and accuracy over time</h2>
        <p className="clay-prose m-0 text-base">
          {recent.length === 0
            ? 'Keys per minute and accuracy for each sitting. It needs two sittings to draw a line.'
            : 'One sitting so far. Come back after your next and this becomes a line.'}
        </p>
      </ClayPanel>
    );
  }

  const kpmMax = niceMax(Math.max(...recent.map((s) => s.kpm)));
  const x = (i: number) => PAD_LEFT + (i * PLOT_W) / (recent.length - 1);
  const yKpm = (value: number) => PAD_TOP + PLOT_H - (Math.min(value, kpmMax) / kpmMax) * PLOT_H;
  const yAcc = (value: number) => PAD_TOP + PLOT_H - value * PLOT_H;

  const kpmPoints = recent.map((s, i) => `${x(i)},${yKpm(s.kpm)}`).join(' ');
  const accPoints = recent.map((s, i) => `${x(i)},${yAcc(s.accuracy)}`).join(' ');

  const labelEvery = Math.max(1, Math.ceil(recent.length / 4));
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <ClayPanel hue="violet" className="flex flex-col gap-4 px-7 py-6">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-xl">Speed and accuracy over time</h2>
        <p className="clay-secondary m-0 text-sm">
          {recent.length === sessions.length
            ? `Every sitting so far, ${shortDate(first.startedAt)} to ${shortDate(last.startedAt)}.`
            : `Your last ${recent.length} sittings, ${shortDate(first.startedAt)} to ${shortDate(last.startedAt)}.`}{' '}
          A sitting ends after half an hour idle.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-[3px] w-6 rounded-full"
            style={{ background: KPM_COLOUR }}
          />
          Keys per minute, left axis
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-[3px] w-6"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${ACC_COLOUR} 0 6px, transparent 6px 10px)`,
            }}
          />
          Accuracy, right axis
        </span>
      </div>

      <div className="-mx-2 overflow-x-auto px-2">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-auto w-full"
          style={{ minWidth: 380 }}
          role="img"
          aria-label={`Line chart of ${recent.length} sittings. Keys per minute goes from ${Math.round(first.kpm)} to ${Math.round(last.kpm)}; accuracy goes from ${Math.round(first.accuracy * 100)} percent to ${Math.round(last.accuracy * 100)} percent.`}
        >
          {ticks.map((t) => {
            const y = PAD_TOP + PLOT_H - t * PLOT_H;
            return (
              <g key={t}>
                <line
                  x1={PAD_LEFT}
                  x2={PAD_LEFT + PLOT_W}
                  y1={y}
                  y2={y}
                  stroke="var(--clay-ink)"
                  strokeOpacity={t === 0 ? 0.28 : 0.1}
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={KPM_COLOUR}
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(t * kpmMax)}
                </text>
                <text
                  x={PAD_LEFT + PLOT_W + 8}
                  y={y + 4}
                  textAnchor="start"
                  fontSize={11}
                  fill={ACC_COLOUR}
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(t * 100)}%
                </text>
              </g>
            );
          })}

          <text
            x={PAD_LEFT - 8}
            y={PAD_TOP - 6}
            textAnchor="end"
            fontSize={10}
            fill="var(--clay-ink-soft)"
          >
            kpm
          </text>
          <text
            x={PAD_LEFT + PLOT_W + 8}
            y={PAD_TOP - 6}
            textAnchor="start"
            fontSize={10}
            fill="var(--clay-ink-soft)"
          >
            acc
          </text>

          <polyline
            points={accPoints}
            fill="none"
            stroke={ACC_COLOUR}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 4"
          />
          <polyline
            points={kpmPoints}
            fill="none"
            stroke={KPM_COLOUR}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {recent.map((session, i) => (
            <g key={session.startedAt}>
              <circle cx={x(i)} cy={yAcc(session.accuracy)} r={3.5} fill={ACC_COLOUR} />
              <circle cx={x(i)} cy={yKpm(session.kpm)} r={4} fill={KPM_COLOUR} />
              {(i % labelEvery === 0 || i === recent.length - 1) && (
                <text
                  x={x(i)}
                  y={VIEW_H - PAD_BOTTOM + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--clay-ink-soft)"
                >
                  {shortDate(session.startedAt)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <details className="text-sm">
        <summary className="clay-focusable cursor-pointer rounded-chip px-1 py-1">
          Read these sittings as numbers
        </summary>
        <ul className="clay-secondary mt-2 flex list-none flex-col gap-1 p-0">
          {recent.map((session) => (
            <li key={session.startedAt}>
              {shortDate(session.startedAt)} — {Math.round(session.kpm)} kpm,{' '}
              {Math.round(session.accuracy * 100)}% accuracy, {session.solved} of {session.attempts}{' '}
              solved
            </li>
          ))}
        </ul>
      </details>
    </ClayPanel>
  );
}

function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 20;
  const step = value <= 50 ? 10 : value <= 200 ? 20 : 50;
  return Math.max(step, Math.ceil(value / step) * step);
}
