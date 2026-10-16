import type { Task } from '@/lib/types';
import { summarizeTasks } from '@/lib/task-board';
import { formatEuro } from '@/lib/format';
import { formatMinutes, formatWorkdays } from '@/lib/time';

export function SectionStats({ tasks, title }: { tasks: Task[]; title: string }) {
  const { budget, estimatedMinutes } = summarizeTasks(tasks);

  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs" aria-label={`${title}: yhteenveto`}>
      <div className="flex items-baseline gap-2">
        <dt className="text-faint">Budjetti</dt>
        <dd className="text-mute tabular-nums">{formatEuro(budget)}</dd>
      </div>
      <div className="flex items-baseline gap-2">
        <dt className="text-faint">Aika</dt>
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
      <h3 className="eyebrow">Panostukset yhteensä</h3>
      <dl className="mt-4 grid grid-cols-2 gap-4" aria-label="Valmiisiin tehtäviin käytetty raha ja aika">
        <div className="min-w-0">
          <dt className="text-xs text-mute">Ostojen arvo</dt>
          <dd className="mt-1 break-words font-serif text-3xl text-linen tabular-nums">{formatEuro(spent)}</dd>
          <dd className="mt-1 text-xs text-mute">Kirjatut toteutuneet hinnat, muuten arviot</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-mute">Käytetty aika</dt>
          <dd className="mt-1 font-serif text-3xl text-linen tabular-nums [overflow-wrap:anywhere]">{formatMinutes(actualMinutes)}</dd>
          {workdays && <dd className="mt-1 text-xs text-faint">{workdays}</dd>}
        </div>
      </dl>
    </div>
  );
}
