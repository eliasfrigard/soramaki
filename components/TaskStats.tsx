import type { Task } from '@/lib/types';
import { summarizeTasks } from '@/lib/task-board';
import { formatEuro } from '@/lib/format';
import { formatMinutes, formatWorkdays } from '@/lib/time';

export function SectionStats({ tasks, title }: { tasks: Task[]; title: string }) {
  const { budget, estimatedMinutes } = summarizeTasks(tasks);

  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs sm:ml-auto" aria-label={`${title} summary`}>
      <div className="flex items-baseline gap-2">
        <dt className="text-faint">Budget</dt>
        <dd className="text-mute tabular-nums">{formatEuro(budget)}</dd>
      </div>
      <div className="flex items-baseline gap-2">
        <dt className="text-faint">Time</dt>
        <dd className="text-mute tabular-nums">{formatMinutes(estimatedMinutes)}</dd>
      </div>
    </dl>
  );
}

export function TotalInvested({ tasks }: { tasks: Task[] }) {
  const { spent, actualMinutes } = summarizeTasks(tasks);
  const workdays = formatWorkdays(actualMinutes);

  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-ink-raised/70 p-5">
      <h3 className="eyebrow">Total Invested</h3>
      <dl className="mt-4 grid grid-cols-2 gap-4" aria-label="Total invested in completed tasks">
        <div className="min-w-0">
          <dt className="text-xs text-mute">Money spent</dt>
          <dd className="mt-1 break-words font-serif text-3xl text-linen tabular-nums">{formatEuro(spent)}</dd>
          <dd className="mt-1 text-xs text-faint">Purchased items only</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-mute">Time spent</dt>
          <dd className="mt-1 font-serif text-3xl text-linen tabular-nums">{formatMinutes(actualMinutes)}</dd>
          {workdays && <dd className="mt-1 text-xs text-faint">{workdays}</dd>}
        </div>
      </dl>
    </div>
  );
}
