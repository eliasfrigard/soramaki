'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { completeTask, deleteTask, moveTask, startTask, updateTask } from '@/app/actions/tasks';
import { PRIORITIES, type Category, type Location, type Priority, type Task } from '@/lib/types';
import { PRIORITY_META } from '@/lib/priority';
import { formatDate, formatEuro } from '@/lib/format';
import { HOURS_INPUT_PATTERN, formatMinutes } from '@/lib/time';
import { ActionForm } from '@/components/ActionForm';
import { SubmitButton } from '@/components/SubmitButton';
import { MutationScope } from '@/components/MutationFeedback';

const PILL_BUTTON =
  'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-hairline px-4 text-sm text-linen transition hover:border-linen/25 active:scale-[0.97]';

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
  const titleRef = useRef<HTMLButtonElement>(null);
  const completeRef = useRef<HTMLButtonElement>(null);
  const isInProgress = task.status === 'IN_PROGRESS';
  const isDone = task.status === 'DONE';
  const priority = PRIORITY_META[task.priority];
  const panelId = `task-${task.id}-details`;
  const focusTargetId = `task-${task.id}-toggle`;
  const sectionId = isDone ? 'column-done' : isInProgress ? 'column-0'
    : task.priority === 'NEXT' || task.priority === 'SOON' ? 'column-1' : 'column-2';
  const closeEditor = () => {
    setIsEditing(false);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const meta: ReactNode[] = isDone
    ? [
      task.completedAt && `Done ${formatDate(task.completedAt)}`,
      task.actualMinutes != null && `${formatMinutes(task.actualMinutes)} spent`,
      task.location?.name,
      costTotal > 0 && `Budget: ${formatEuro(costTotal)}`,
    ]
    : [
      <span key="priority" className={priority.text}>
        {priority.label}
      </span>,
      task.location?.name,
      task.category?.name,
      task.estimatedMinutes != null ? `Estimate: ${formatMinutes(task.estimatedMinutes)}` : null,
      costTotal > 0 && `Budget: ${formatEuro(costTotal)}`,
    ];

  return (
    <li className="min-w-0 border-b border-hairline">
      <MutationScope>
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
              ref={completeRef}
              disabled={isEditing}
              onClick={() => setIsCompleting((value) => !value)}
              aria-label={`Complete "${task.title}"`}
              aria-expanded={isCompleting}
              aria-controls={`task-${task.id}-completion`}
              className="group/ring flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={`flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors group-hover/ring:border-accent ${isCompleting ? 'border-accent bg-accent/15' : isInProgress ? 'border-accent' : 'border-mute/45'
                  }`}
              >
                {isInProgress && !isCompleting ? (
                  <span className="size-2 rounded-full bg-accent" aria-hidden />
                ) : (
                  <Check
                    className={`size-3 text-accent transition-opacity ${isCompleting ? 'opacity-100' : 'opacity-0 group-hover/ring:opacity-100'
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
            ref={titleRef}
            id={focusTargetId}
            disabled={isEditing || isCompleting}
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="group/title flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg py-3 pr-1 text-left transition-colors hover:bg-linen/5 disabled:cursor-default"
          >
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] leading-snug [overflow-wrap:anywhere] ${isDone ? 'text-mute' : 'text-linen'}`}>
                {task.title}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
                {meta.filter(Boolean).map((item, index) => (
                  <span key={index} className="flex items-center gap-2">
                    {item}
                  </span>
                ))}
                {isInProgress && (
                  <span className="flex items-center gap-2 text-accent">
                    In progress
                  </span>
                )}
              </span>
            </span>
            <ChevronDown
              className={`mt-0.5 size-4 shrink-0 text-faint transition group-hover/title:text-mute ${isOpen ? 'rotate-180' : ''
                }`}
              strokeWidth={1.75}
              aria-hidden
            />
          </button>
        </div>

        {isCompleting && (
          <div id={`task-${task.id}-completion`}>
            <ActionForm
              action={completeTask.bind(null, task.id)}
              onSuccess={() => setIsCompleting(false)}
              successMessage={`Completed "${task.title}".`}
              focusTargetId={focusTargetId}
              className="fade-in grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2 pb-4 sm:pl-12"
            >
              <label className="col-span-full grid min-w-0 gap-1.5 text-sm text-mute sm:col-span-1">
                Hours spent (optional)
                <input
                  name="actual_hours"
                  inputMode="decimal"
                  autoComplete="off"
                  autoFocus
                  pattern={HOURS_INPUT_PATTERN}
                  placeholder={task.estimatedMinutes != null ? `Est. ${formatMinutes(task.estimatedMinutes)}` : 'e.g. 1.5'}
                  title="Hours spent, e.g. 1.5 — leave empty to skip"
                  className="field"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCompleting(false);
                  completeRef.current?.focus();
                }}
                className="col-start-2 h-11 shrink-0 cursor-pointer rounded-full px-3 text-sm text-mute transition-colors hover:text-linen sm:col-start-auto"
              >
                Cancel
              </button>
              <SubmitButton className="h-11 shrink-0 rounded-full bg-accent-deep px-5 text-sm font-medium text-linen hover:bg-accent-deep/80">
                Done
              </SubmitButton>
            </ActionForm>
          </div>
        )}

        {isOpen && (
          <div id={panelId} className="fade-in flex min-w-0 flex-col gap-4 pb-5 sm:pl-12">
            <div hidden={isEditing}>{children}</div>
            {isEditing && (
              <EditTaskForm
                task={task}
                locations={locations}
                categories={categories}
                onSaved={closeEditor}
                onCancel={closeEditor}
              />
            )}

            {!isEditing && !isCompleting && <MoveChips task={task} />}

            <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_2.75rem] items-center gap-2 sm:grid-cols-[auto_auto_minmax(0,1fr)_2.75rem_2.75rem]">
              {!isEditing && !isCompleting && !isDone && !isInProgress && (
                <ActionForm
                  action={startTask.bind(null, task.id)}
                  successMessage={`Started "${task.title}".`}
                  focusTargetId={focusTargetId}
                  className="contents"
                >
                  <SubmitButton className={`${PILL_BUTTON} col-start-1 row-start-1 w-fit`}>
                    <Play className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Start
                  </SubmitButton>
                </ActionForm>
              )}
              {!isEditing && !isCompleting && isInProgress && (
                <ActionForm
                  action={moveTask.bind(null, task.id, task.priority)}
                  successMessage={`Paused "${task.title}".`}
                  focusTargetId={focusTargetId}
                  className="contents"
                >
                  <SubmitButton className={`${PILL_BUTTON} col-start-1 row-start-1 w-fit`}>
                    <Pause className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Pause
                  </SubmitButton>
                </ActionForm>
              )}
              {!isDone && !isCompleting && !isEditing && (
                <button type="button" onClick={() => setIsCompleting(true)} className={`${PILL_BUTTON} col-start-1 row-start-2 w-fit sm:col-start-2 sm:row-start-1`}>
                  <Check className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Complete
                </button>
              )}
              {!isEditing && !isCompleting && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    aria-label={`Edit "${task.title}"`}
                    className="col-start-2 row-start-1 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-mute transition-colors hover:bg-linen/5 hover:text-linen sm:col-start-4"
                  >
                    <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
                  </button>
                  <ActionForm
                    action={deleteTask.bind(null, task.id)}
                    confirmMessage={`Delete "${task.title}" and its ${task.costItems.length} cost items? This cannot be undone.`}
                    successMessage={`Deleted "${task.title}".`}
                    focusTargetId={sectionId}
                    className="contents"
                  >
                    <SubmitButton
                      ariaLabel={`Delete "${task.title}"`}
                      className="col-start-3 row-start-1 size-11 rounded-full text-mute hover:bg-berry/15 hover:text-berry-soft sm:col-start-5"
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                    </SubmitButton>
                  </ActionForm>
                </>
              )}
            </div>
          </div>
        )}
      </MutationScope>
    </li>
  );
}

function MoveChips({ task }: { task: Task }) {
  const isDone = task.status === 'DONE';
  const isQueued = task.status === 'BACKLOG';
  const label = isDone ? 'Reopen as' : task.status === 'IN_PROGRESS' ? 'Pause and queue as' : 'Set priority';

  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      <p className="mb-2 text-xs text-mute">Next / Soon: Up next · Later / Maybe: Someday</p>
      <div className="flex flex-wrap gap-2">
        {PRIORITIES.map((value: Priority) => {
          const isCurrent = isQueued && value === task.priority;
          return isCurrent ? (
            <span key={value} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-linen/25 bg-linen/10 px-3 text-sm text-linen">
              <span className={`size-1.5 rounded-full ${PRIORITY_META[value].dot}`} aria-hidden />
              {PRIORITY_META[value].label}<span className="sr-only"> (current priority)</span>
            </span>
          ) : (
            <ActionForm
              key={value}
              action={moveTask.bind(null, task.id, value)}
              successMessage={`Queued "${task.title}" as ${PRIORITY_META[value].label}.`}
              focusTargetId={`task-${task.id}-toggle`}
              className="contents"
            >
              <SubmitButton
                ariaLabel={`${label} ${PRIORITY_META[value].label}`}
                className="min-h-11 rounded-full border border-hairline px-3 text-sm text-mute hover:border-linen/25 hover:text-linen"
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
      successMessage={`Saved "${task.title}".`}
      className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl bg-ink-sunken/60 p-3 sm:grid-cols-2"
    >
      <label className="grid min-w-0 gap-1.5 text-sm text-mute sm:col-span-2">
        Task title
        <input
          name="title"
          required
          maxLength={255}
          autoComplete="off"
          defaultValue={task.title}
          autoFocus
          className="field"
        />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm text-mute">
        Place
        <select name="location_id" defaultValue={task.locationId ?? ''} className="select">
          <option value="">No place</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm text-mute">
        Type
        <select name="category_id" defaultValue={task.categoryId ?? ''} className="select">
          <option value="">No type</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm text-mute sm:col-span-2">
        Estimated hours
        <input
          name="estimated_hours"
          inputMode="decimal"
          autoComplete="off"
          pattern={HOURS_INPUT_PATTERN}
          defaultValue={task.estimatedMinutes != null ? String(Number((task.estimatedMinutes / 60).toFixed(2))).replace('.', ',') : ''}
          placeholder="Estimate"
          title="Estimated hours, e.g. 1.5"
          className="field"
        />
      </label>
      <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 cursor-pointer rounded-full px-4 text-sm text-mute transition-colors hover:text-linen"
        >
          Cancel
        </button>
        <SubmitButton className="h-11 rounded-full bg-linen px-5 text-sm font-medium text-ink hover:bg-white">
          Save
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
