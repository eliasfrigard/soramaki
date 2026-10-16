import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Image from 'next/image';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { tasksQuery } from '@/lib/supabase/queries';
import { groupTasks } from '@/lib/task-board';
import {
  toCategory,
  toLocation,
  toTask,
  type Category,
  type Location,
  type Task,
} from '@/lib/types';
import { SectionStats, TotalInvested } from '@/components/TaskStats';
import { TagManager } from '@/components/TagManager';
import { TaskForm } from '@/components/TaskForm';
import { TaskCard } from '@/components/TaskCard';
import { MutationFeedback } from '@/components/MutationFeedback';

interface Tags {
  locations: Location[];
  categories: Category[];
}

const PHOTO_SRC = '/soramaki.jpg';

export default function Home() {
  return (
    <>
      <PhotoBackdrop />
      <MutationFeedback>
        <main className="mx-auto w-full max-w-[1320px] px-5 pt-10 pb-16 sm:px-8 lg:px-12 lg:pt-16">
          <header className="mx-auto flex w-full max-w-3xl flex-col gap-8 border-b border-hairline pb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:pb-12">
            <div>
              <p className="eyebrow flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-berry" aria-hidden />
                Tuorilanmäki 18 · Porvoo
              </p>
              <h1 className="mt-3 font-serif text-[3.5rem] leading-[0.9] tracking-tight text-linen sm:text-7xl lg:mt-4 lg:text-8xl">
                Soramäki
              </h1>
            </div>
          </header>

          <Suspense fallback={<BoardSkeleton />}>
            <TaskBoard />
          </Suspense>
        </main>
      </MutationFeedback>
    </>
  );
}

function PhotoBackdrop() {
  if (!existsSync(join(process.cwd(), 'public', PHOTO_SRC))) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Image
        src={PHOTO_SRC}
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover object-[50%_30%] saturate-[0.65]"
      />
      <div className="absolute inset-0 bg-ink/[0.86]" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-ink/30 to-ink/80" />
    </div>
  );
}

async function TaskBoard() {
  const supabase = await createClient();

  const [tasksResult, locationsResult, categoriesResult] = await Promise.all([
    tasksQuery(supabase).throwOnError(),
    supabase.from('locations').select('*').order('sort_order').order('name').throwOnError(),
    supabase.from('categories').select('*').order('sort_order').order('name').throwOnError(),
  ]);

  const tasks = tasksResult.data.map(toTask);
  const locations = locationsResult.data.map(toLocation);
  const categories = categoriesResult.data.map(toCategory);
  const tags: Tags = { locations, categories };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mt-8 lg:mt-10">
        <TaskForm locations={locations} categories={categories} />
      </div>

      <Board tasks={tasks} tags={tags} />

      <div className="mt-20">
        <TagManager locations={locations} categories={categories} />
      </div>
    </div>
  );
}

function Board({ tasks, tags }: { tasks: Task[]; tags: Tags }) {
  const { inProgress, upNext, someday, completed } = groupTasks(tasks);
  const columns = [
    { title: 'In progress', tasks: inProgress, emptyText: 'Nothing underway.' },
    {
      title: 'Up next',
      tasks: upNext,
      emptyText: 'The queue is clear.',
    },
    {
      title: 'Someday',
      tasks: someday,
      emptyText: 'No ideas parked here.',
    },
  ];

  return (
    <div className="mt-12 flex flex-col gap-10 lg:mt-14">
      <nav aria-label="Task sections" className="flex flex-wrap gap-2">
        {[...columns.map((column, index) => ({ title: column.title, id: `column-${index}` })),
        { title: 'Completed', id: 'column-done' }].map((column) => (
          <a key={column.id} href={`#${column.id}`} className="inline-flex min-h-11 items-center rounded-full border border-hairline px-3 text-sm text-mute transition-colors hover:bg-linen/5 hover:text-linen">
            {column.title}
          </a>
        ))}
      </nav>
      {columns.map((column, index) => (
        <section key={column.title} aria-labelledby={`column-${index}`}>
          <ColumnHeading
            id={`column-${index}`}
            index={index + 1}
            title={column.title}
            count={column.tasks.length}
            tasks={column.tasks}
          />
          <TaskList tasks={column.tasks} tags={tags} emptyText={column.emptyText} />
        </section>
      ))}
      <CompletedList tasks={completed} tags={tags} />
    </div>
  );
}

function CompletedList({ tasks, tags }: { tasks: Task[]; tags: Tags }) {
  return (
    <section aria-labelledby="column-done">
      <ColumnHeading id="column-done" title="Completed" count={tasks.length} />
      <TotalInvested tasks={tasks} />
      <TaskList
        tasks={tasks}
        tags={tags}
        emptyText="Nothing finished yet."
      />
    </section>
  );
}

function ColumnHeading({
  id,
  index,
  title,
  count,
  tasks,
}: {
  id: string;
  index?: number;
  title: string;
  count: number;
  tasks?: Task[];
}) {
  return (
    <div className="grid grid-cols-1 items-baseline gap-2 border-b border-hairline pb-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex items-baseline gap-3">
        {index !== undefined && (
          <span className="text-[11px] text-faint tabular-nums" aria-hidden>
            {String(index).padStart(2, '0')}
          </span>
        )}
        <h2 id={id} tabIndex={-1} className="scroll-mt-6 font-serif text-2xl text-linen">
          {title}
        </h2>
        <span className="text-xs text-faint tabular-nums">
          {count}<span className="sr-only"> {count === 1 ? 'task' : 'tasks'}</span>
        </span>
      </div>
      {tasks && <SectionStats tasks={tasks} title={title} />}
    </div>
  );
}

function TaskList({
  tasks,
  tags,
  emptyText,
}: {
  tasks: Task[];
  tags: Tags;
  emptyText: string;
}) {
  if (tasks.length === 0) {
    return <p className="py-8 font-serif text-lg text-faint italic">{emptyText}</p>;
  }

  return (
    <ul className="grid grid-cols-1">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} locations={tags.locations} categories={tags.categories} />
      ))}
    </ul>
  );
}

function BoardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl" aria-busy="true" aria-label="Loading tasks">
      <div className="mt-8 h-28 animate-pulse rounded-2xl bg-linen/5 motion-reduce:animate-none lg:mt-10" />
      <div className="mt-12 flex flex-col gap-10 lg:mt-14">
        {[0, 1, 2, 3].map((column) => (
          <div key={column}>
            <div className="h-9 border-b border-hairline" />
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-hairline py-4 pl-3">
                <div className="size-[22px] animate-pulse rounded-full bg-linen/5" />
                <div className="h-3.5 flex-1 animate-pulse rounded-full bg-linen/5" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
