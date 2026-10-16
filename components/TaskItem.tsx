'use client';

import { useState, type ReactNode } from 'react';
import { Check, ChevronDown, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { completeTask, deleteTask, moveTask, startTask, updateTask } from '@/app/actions/tasks';
import { PRIORITIES, type Category, type Location, type Priority, type Task } from '@/lib/types';
import { PRIORITY_META } from '@/lib/priority';
import { formatDate, formatEuro } from '@/lib/format';
import { HOURS_INPUT_PATTERN, formatMinutes } from '@/lib/time';
import { ActionForm } from '@/components/ActionForm';
import { SubmitButton } from '@/components/SubmitButton';

const PILL_BUTTON =
  'inline-flex h-10 items-center gap-2 rounded-full border border-hairline px-4 text-sm text-linen transition hover:border-linen/25 active:scale-[0.97]';

interface TaskItemProps {
  task: Task;
  costTotal: number;
  locations: Location[];
  categories: Category[];
  /** Server-rendered detail content (cost items). */
  children: ReactNode;
}

export function TaskItem({ task, costTotal, locations, categories, children }: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isInProgress = task.status === 'IN_PROGRESS';
  const isDone = task.status === 'DONE';
  const priority = PRIORITY_META[task.priority];
  const panelId = `task-${task.id}-details`;

  const meta: ReactNode[] = isDone
    ? [
        task.completedAt && `Done ${formatDate(task.completedAt)}`,
        task.actualMinutes != null && `${formatMinutes(task.actualMinutes)} spent`,
        task.location?.name,
        costTotal > 0 && formatEuro(costTotal),
      ]
    : [
        <span key="priority" className={priority.text}>
          {priority.label}
        </span>,
        task.location?.name,
        task.category?.name,
        task.estimatedMinutes ? formatMinutes(task.estimatedMinutes) : null,
        costTotal > 0 && formatEuro(costTotal),
      ];

  return (
    <li className="border-b border-hairline">
      <div className="flex items-start gap-1">
        {isDone ? (
          <span className="flex size-11 shrink-0 items-center justify-center" aria-label="Completed">
            <span className="flex size-[22px] items-center justify-center rounded-full bg-accent-deep text-linen">
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
            </span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsCompleting((value) => !value)}
            aria-label={`Complete "${task.title}"`}
            aria-expanded={isCompleting}
            className="group/ring flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <span
              className={`flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors group-hover/ring:border-accent ${
                isCompleting ? 'border-accent bg-accent/15' : isInProgress ? 'border-accent' : 'border-mute/45'
              }`}
            >
              {isInProgress && !isCompleting ? (
                <span className="size-2 rounded-full bg-accent" aria-hidden />
              ) : (
                <Check
                  className={`size-3 text-accent transition-opacity ${
                    isCompleting ? 'opacity-100' : 'opacity-0 group-hover/ring:opacity-100'
                  }`}
                  strokeWidth={2.5}
                  aria-hidden
                />
              )}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="group/title flex min-w-0 flex-1 items-start gap-3 py-3 pr-1 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className={`block text-[15px] leading-snug break-words ${isDone ? 'text-mute' : 'text-linen'}`}>
              {task.title}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-faint">
              {meta.filter(Boolean).map((item, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden>·</span>}
                  {item}
                </span>
              ))}
              {isInProgress && (
                <span className="flex items-center gap-2 text-accent">
                  <span aria-hidden>·</span>In progress
                </span>
              )}
            </span>
          </span>
          <ChevronDown
            className={`mt-0.5 size-4 shrink-0 text-faint transition group-hover/title:text-mute ${
              isOpen ? 'rotate-180' : ''
            }`}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </div>

      {isCompleting && (
        <ActionForm
          action={completeTask.bind(null, task.id)}
          onSuccess={() => setIsCompleting(false)}
          className="fade-in flex flex-wrap items-center gap-2 pb-4 pl-11"
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Hours spent (optional)</span>
            <input
              name="actual_hours"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              pattern={HOURS_INPUT_PATTERN}
              placeholder={task.estimatedMinutes ? `Est. ${formatMinutes(task.estimatedMinutes)}` : 'Hours spent'}
              title="Hours spent, e.g. 1.5 — leave empty to skip"
              className="field pr-8"
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-faint" aria-hidden>
              h
            </span>
          </label>
          <button
            type="button"
            onClick={() => setIsCompleting(false)}
            className="h-11 shrink-0 rounded-full px-3 text-sm text-mute transition-colors hover:text-linen"
          >
            Cancel
          </button>
          <SubmitButton className="h-11 shrink-0 rounded-full bg-accent-deep px-5 text-sm font-medium text-linen hover:bg-accent-deep/80">
            Done
          </SubmitButton>
        </ActionForm>
      )}

      {isOpen && (
        <div id={panelId} className="fade-in flex flex-col gap-4 pb-5 pl-11">
          {isEditing ? (
            <EditTaskForm
              task={task}
              locations={locations}
              categories={categories}
              onSaved={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            children
          )}

          <MoveChips task={task} />

          <div className="flex items-center gap-2">
            {!isDone && !isInProgress && (
              <ActionForm action={startTask.bind(null, task.id)}>
                <SubmitButton className={PILL_BUTTON}>
                  <Play className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Start
                </SubmitButton>
              </ActionForm>
            )}
            {isInProgress && (
              <ActionForm action={moveTask.bind(null, task.id, task.priority)}>
                <SubmitButton className={PILL_BUTTON}>
                  <Pause className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Pause
                </SubmitButton>
              </ActionForm>
            )}
            {!isDone && !isCompleting && (
              <button type="button" onClick={() => setIsCompleting(true)} className={PILL_BUTTON}>
                <Check className="size-3.5" strokeWidth={1.75} aria-hidden />
                Complete
              </button>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                aria-label={`Edit "${task.title}"`}
                className="ml-auto inline-flex size-10 items-center justify-center rounded-full text-faint transition-colors hover:bg-linen/5 hover:text-linen"
              >
                <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            )}
            <ActionForm action={deleteTask.bind(null, task.id)} className={isEditing ? 'ml-auto' : ''}>
              <SubmitButton
                ariaLabel={`Delete "${task.title}"`}
                className="size-10 rounded-full text-faint hover:bg-berry/15 hover:text-berry-soft"
              >
                <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
              </SubmitButton>
            </ActionForm>
          </div>
        </div>
      )}
    </li>
  );
}

function MoveChips({ task }: { task: Task }) {
  const isDone = task.status === 'DONE';
  const isQueued = task.status === 'BACKLOG';

  return (
    <div>
      <p className="eyebrow mb-2">{isDone ? 'Reopen in' : 'Move to'}</p>
      <div className="flex flex-wrap gap-1.5">
        {PRIORITIES.map((value: Priority) => {
          const isCurrent = isQueued && value === task.priority;
          return (
            <ActionForm key={value} action={moveTask.bind(null, task.id, value)}>
              <SubmitButton
                ariaLabel={`${isDone ? 'Reopen in' : 'Move to'} ${PRIORITY_META[value].label}`}
                className={`h-9 rounded-full border px-3 text-xs ${
                  isCurrent
                    ? 'pointer-events-none border-linen/25 bg-linen/10 text-linen'
                    : 'border-hairline text-mute hover:border-linen/25 hover:text-linen'
                }`}
              >
                <span className={`size-1.5 rounded-full ${PRIORITY_META[value].dot}`} aria-hidden />
                {PRIORITY_META[value].label}
              </SubmitButton>
            </ActionForm>
          );
        })}
      </div>
    </div>
  );
}

interface EditTaskFormProps {
  task: Task;
  locations: Location[];
  categories: Category[];
  onSaved: () => void;
  onCancel: () => void;
}

function EditTaskForm({ task, locations, categories, onSaved, onCancel }: EditTaskFormProps) {
  return (
    <ActionForm
      action={updateTask.bind(null, task.id)}
      onSuccess={onSaved}
      className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-sunken/60 p-3"
    >
      <input
        name="title"
        required
        maxLength={255}
        autoComplete="off"
        defaultValue={task.title}
        aria-label="Task title"
        className="field col-span-2"
      />
      <select name="location_id" defaultValue={task.locationId ?? ''} aria-label="Place" className="select">
        <option value="">No place</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <select name="category_id" defaultValue={task.categoryId ?? ''} aria-label="Type" className="select">
        <option value="">No type</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <label className="relative col-span-2">
        <span className="sr-only">Estimated hours</span>
        <input
          name="estimated_hours"
          inputMode="decimal"
          autoComplete="off"
          pattern={HOURS_INPUT_PATTERN}
          defaultValue={task.estimatedMinutes != null ? String(Number((task.estimatedMinutes / 60).toFixed(2))).replace('.', ',') : ''}
          placeholder="Estimate"
          title="Estimated hours, e.g. 1.5"
          className="field pr-8"
        />
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-faint" aria-hidden>
          h
        </span>
      </label>
      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-full px-4 text-sm text-mute transition-colors hover:text-linen"
        >
          Cancel
        </button>
        <SubmitButton className="h-10 rounded-full bg-linen px-5 text-sm font-medium text-ink hover:bg-white">
          Save
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
