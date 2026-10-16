'use client';

import { ArrowUp } from 'lucide-react';
import { createTask } from '@/app/actions/tasks';
import { PRIORITIES, type Category, type Location } from '@/lib/types';
import { PRIORITY_META } from '@/lib/priority';
import { HOURS_INPUT_PATTERN } from '@/lib/time';
import { ActionForm } from '@/components/ActionForm';
import { SubmitButton } from '@/components/SubmitButton';

interface TaskFormProps {
  locations: Location[];
  categories: Category[];
}

export function TaskForm({ locations, categories }: TaskFormProps) {
  return (
    <ActionForm
      action={createTask}
      ariaLabel="New task"
      className="group/form w-full rounded-2xl border border-hairline bg-ink-raised/70 p-1.5 transition-colors focus-within:border-linen/15"
    >
      <div className="flex items-center gap-1.5">
        <input
          name="title"
          type="text"
          required
          maxLength={255}
          autoComplete="off"
          placeholder="What needs doing?"
          aria-label="Task title"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-linen outline-none placeholder:text-faint"
        />
        <SubmitButton
          ariaLabel="Add task"
          className="size-11 shrink-0 rounded-xl bg-linen text-ink hover:bg-white"
        >
          <ArrowUp className="size-5" strokeWidth={1.75} aria-hidden />
        </SubmitButton>
      </div>

      <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out group-focus-within/form:grid-rows-[1fr] group-focus-within/form:opacity-100 motion-reduce:transition-none">
        <div className="invisible min-h-0 overflow-hidden group-focus-within/form:visible">
          <div className="mt-1.5 flex flex-col gap-3 border-t border-hairline px-1.5 pt-3 pb-1.5">
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">Priority</legend>
              {PRIORITIES.map((priority) => (
                <label
                  key={priority}
                  className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-hairline px-3.5 text-sm text-mute transition-colors hover:text-linen has-checked:border-linen/25 has-checked:bg-linen/10 has-checked:text-linen has-focus-visible:outline-2 has-focus-visible:outline-accent"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    defaultChecked={priority === 'NEXT'}
                    className="sr-only"
                  />
                  <span className={`size-1.5 rounded-full ${PRIORITY_META[priority].dot}`} aria-hidden />
                  {PRIORITY_META[priority].label}
                </label>
              ))}
            </fieldset>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_7rem]">
              <select
                name="location_id"
                defaultValue=""
                aria-label="Location"
                className="select"
              >
                <option value="">Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <select
                name="category_id"
                defaultValue=""
                aria-label="Category"
                className="select"
              >
                <option value="">Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="relative col-span-2 sm:col-span-1">
                <span className="sr-only">Estimated hours</span>
                <input
                  name="estimated_hours"
                  inputMode="decimal"
                  autoComplete="off"
                  pattern={HOURS_INPUT_PATTERN}
                  placeholder="Estimate"
                  title="Estimated hours, e.g. 1.5"
                  className="field pr-8"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-faint" aria-hidden>
                  h
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </ActionForm>
  );
}
