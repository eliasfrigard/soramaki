import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Image from 'next/image';
import { Suspense, cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { parseTaskFilters, type StatusFilter, type TaskFilters } from '@/lib/filters';
import {
  toCategory,
  toLocation,
  toTask,
  type Category,
  type CategoryRow,
  type Location,
  type LocationRow,
  type Task,
  type TaskRow,
} from '@/lib/types';
import { FilterBar } from '@/components/FilterBar';
import { ProjectStats } from '@/components/ProjectStats';
import { TagManager } from '@/components/TagManager';
import { TaskForm } from '@/components/TaskForm';
import { TaskCard } from '@/components/TaskCard';

type SearchParamsProp = Pick<PageProps<'/'>, 'searchParams'>;

interface Tags {
  locations: Location[];
  categories: Category[];
}

const PHOTO_SRC = '/soramaki.jpg';

export default function Home({ searchParams }: PageProps<'/'>) {
  return (
    <>
      <PhotoBackdrop />
      <main className="mx-auto w-full max-w-[1320px] px-5 pt-10 pb-16 sm:px-8 lg:px-12 lg:pt-16">
        <header className="flex flex-col gap-8 border-b border-hairline pb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:pb-12">
          <div>
            <p className="eyebrow flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-berry" aria-hidden />
              Tuorilanmäki 18 · Porvoo
            </p>
            <h1 className="mt-3 font-serif text-[3.5rem] leading-[0.9] tracking-tight text-linen sm:text-7xl lg:mt-4 lg:text-8xl">
              Soramäki
            </h1>
          </div>
          <Suspense fallback={<StatsSkeleton />}>
            <HeaderStats searchParams={searchParams} />
          </Suspense>
        </header>

        <Suspense fallback={<BoardSkeleton />}>
          <TaskBoard searchParams={searchParams} />
        </Suspense>
      </main>
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

// Deduplicated per request so the header stats and the board share one query.
const getTasks = cache(
  async (status: StatusFilter, locationId?: string, categoryId?: string): Promise<Task[]> => {
    const supabase = await createClient();
    let query = supabase
      .from('tasks')
      .select('*, location:locations(*), category:categories(*), costItems:cost_items(*)');

    if (locationId) query = query.eq('location_id', locationId);
    if (categoryId) query = query.eq('category_id', categoryId);

    query =
      status === 'completed'
        ? query.eq('status', 'DONE').order('completed_at', { ascending: false })
        : query
            .in('status', ['BACKLOG', 'IN_PROGRESS'])
            .order('priority')
            .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`Failed to load tasks: ${error.message}`);
    return (data as TaskRow[]).map(toTask);
  },
);

function fetchTasks(filters: TaskFilters) {
  return getTasks(filters.status, filters.locationId, filters.categoryId);
}

async function HeaderStats({ searchParams }: SearchParamsProp) {
  const filters = parseTaskFilters(await searchParams);
  const tasks = await fetchTasks(filters);
  return <ProjectStats tasks={tasks} status={filters.status} />;
}

async function TaskBoard({ searchParams }: SearchParamsProp) {
  const filters = parseTaskFilters(await searchParams);
  const supabase = await createClient();

  const [tasks, locationsResult, categoriesResult] = await Promise.all([
    fetchTasks(filters),
    supabase.from('locations').select('*').order('sort_order').order('name'),
    supabase.from('categories').select('*').order('sort_order').order('name'),
  ]);

  const error = locationsResult.error ?? categoriesResult.error;
  if (error) throw new Error(`Failed to load data: ${error.message}`);

  const locations = (locationsResult.data as LocationRow[]).map(toLocation);
  const categories = (categoriesResult.data as CategoryRow[]).map(toCategory);
  const tags: Tags = { locations, categories };

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 lg:mt-10 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="lg:w-full lg:max-w-xl">
          <TaskForm
            key={`${filters.locationId}-${filters.categoryId}`}
            locations={locations}
            categories={categories}
            defaultLocationId={filters.locationId}
            defaultCategoryId={filters.categoryId}
          />
        </div>
        <FilterBar locations={locations} categories={categories} filters={filters} />
      </div>

      {filters.status === 'completed' ? <CompletedList tasks={tasks} tags={tags} /> : <Board tasks={tasks} tags={tags} />}

      <div className="mt-20">
        <TagManager locations={locations} categories={categories} />
      </div>
    </>
  );
}

function Board({ tasks, tags }: { tasks: Task[]; tags: Tags }) {
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const queued = tasks.filter((t) => t.status !== 'IN_PROGRESS');
  const columns = [
    { title: 'In progress', tasks: inProgress, emptyText: 'Nothing underway.' },
    {
      title: 'Up next',
      tasks: queued.filter((t) => t.priority === 'NEXT' || t.priority === 'SOON'),
      emptyText: 'The queue is clear.',
    },
    {
      title: 'Someday',
      tasks: queued.filter((t) => t.priority === 'LATER' || t.priority === 'MAYBE'),
      emptyText: 'No ideas parked here.',
    },
  ];

  return (
    <div className="mt-12 grid gap-14 lg:mt-14 lg:grid-cols-3 lg:gap-10">
      {columns.map((column, index) => (
        <section key={column.title} aria-labelledby={`column-${index}`}>
          <ColumnHeading id={`column-${index}`} index={index + 1} title={column.title} count={column.tasks.length} />
          <TaskList tasks={column.tasks} tags={tags} emptyText={column.emptyText} />
        </section>
      ))}
    </div>
  );
}

function CompletedList({ tasks, tags }: { tasks: Task[]; tags: Tags }) {
  return (
    <section aria-labelledby="column-done" className="mt-12 lg:mt-14">
      <ColumnHeading id="column-done" title="Completed" count={tasks.length} />
      <TaskList
        tasks={tasks}
        tags={tags}
        emptyText="Nothing finished yet."
        className="lg:grid-cols-2 lg:gap-x-10"
      />
    </section>
  );
}

function ColumnHeading({ id, index, title, count }: { id: string; index?: number; title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-hairline pb-3">
      {index !== undefined && (
        <span className="text-[11px] text-faint tabular-nums" aria-hidden>
          {String(index).padStart(2, '0')}
        </span>
      )}
      <h2 id={id} className="font-serif text-2xl text-linen">
        {title}
      </h2>
      <span className="ml-auto text-xs text-faint tabular-nums">{count}</span>
    </div>
  );
}

function TaskList({
  tasks,
  tags,
  emptyText,
  className = '',
}: {
  tasks: Task[];
  tags: Tags;
  emptyText: string;
  className?: string;
}) {
  if (tasks.length === 0) {
    return <p className="py-8 font-serif text-lg text-faint italic">{emptyText}</p>;
  }

  return (
    <ul className={`grid ${className}`}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} locations={tags.locations} categories={tags.categories} />
      ))}
    </ul>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:gap-10 lg:flex lg:gap-14" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-16 animate-pulse rounded-full bg-linen/5" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-linen/5" />
        </div>
      ))}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading tasks">
      <div className="mt-8 h-14 animate-pulse rounded-2xl bg-linen/5 lg:mt-10 lg:max-w-xl" />
      <div className="mt-12 grid gap-14 lg:mt-14 lg:grid-cols-3 lg:gap-10">
        {[0, 1, 2].map((column) => (
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
