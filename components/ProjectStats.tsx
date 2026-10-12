import type { Task } from '@/lib/types';
import type { StatusFilter } from '@/lib/filters';
import { formatEuro } from '@/lib/format';
import { formatMinutes, formatWorkdays } from '@/lib/time';

function safeNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

interface ProjectStatsProps {
  tasks: Task[];
  status: StatusFilter;
}

export function ProjectStats({ tasks, status }: ProjectStatsProps) {
  let estimatedCost = 0;
  let purchasedCost = 0;
  let purchasedCount = 0;
  let itemCount = 0;
  let minutes = 0;

  for (const task of tasks) {
    minutes += safeNumber(status === 'completed' ? task.actualMinutes : task.estimatedMinutes);
    for (const item of task.costItems ?? []) {
      itemCount += 1;
      estimatedCost += safeNumber(item.estimatedCost);
      if (item.isPurchased) {
        purchasedCount += 1;
        purchasedCost += safeNumber(item.actualCost ?? item.estimatedCost);
      }
    }
  }

  const stats = [
    {
      label: 'Budget',
      value: formatEuro(roundCents(estimatedCost)),
      hint: `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
    },
    {
      label: 'Purchased',
      value: formatEuro(roundCents(purchasedCost)),
      hint: `${purchasedCount} of ${itemCount}`,
    },
    {
      label: status === 'completed' ? 'Time spent' : 'Time',
      value: formatMinutes(minutes),
      hint: formatWorkdays(minutes) ?? `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`,
    },
  ];

  return (
    <dl className="grid grid-cols-3 gap-4 sm:gap-10 lg:flex lg:gap-14" aria-label="Project overview">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0">
          <dt className="eyebrow">{stat.label}</dt>
          <dd className="mt-2 truncate font-serif text-[1.7rem] leading-none text-linen tabular-nums sm:text-4xl">
            {stat.value}
          </dd>
          <dd className="mt-1.5 truncate text-xs text-faint">{stat.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
