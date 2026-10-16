'use client';

import { ArrowUp } from 'lucide-react';
import { createTask } from '@/app/actions/tasks';
import { CONTEXT_TEXT_MAX_LENGTH, PRIORITIES, type Category, type Location } from '@/lib/types';
import { PRIORITY_META } from '@/lib/priority';
import { formatCategoryName } from '@/lib/format';
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
      ariaLabel="Uusi tehtävä"
      successMessage="Tehtävä lisätty."
      focusTargetId="new-task"
      className="w-full rounded-2xl border border-hairline bg-ink-raised/70 p-2 transition-colors focus-within:border-accent/50"
    >
      <div className="flex items-center gap-1.5">
        <input
          id="new-task"
          name="title"
          type="text"
          required
          maxLength={255}
          autoComplete="off"
          placeholder="Mitä pitää tehdä?"
          aria-label="Tehtävän nimi"
          className="h-11 min-w-0 flex-1 scroll-mt-6 rounded-lg bg-transparent px-3 font-semibold text-lg text-linen placeholder:font-normal placeholder:text-faint"
        />
        <SubmitButton
          ariaLabel="Lisää tehtävä"
          className="size-11 shrink-0 rounded-xl bg-linen text-ink hover:bg-white"
        >
          <ArrowUp className="size-5" strokeWidth={1.75} aria-hidden />
        </SubmitButton>
      </div>

      <details className="mt-2 border-t border-hairline px-2">
        <summary className="disclosure min-h-11 rounded-lg text-sm text-mute transition-colors hover:bg-gray-50 hover:text-ink">
          Tehtävän tiedot (valinnainen)
        </summary>
        <div className="flex flex-col gap-3 pb-2">
          <label className="grid min-w-0 gap-1.5 text-sm text-mute">
            Kuvaus
            <textarea
              name="description"
              rows={3}
              maxLength={CONTEXT_TEXT_MAX_LENGTH}
              className="field h-auto min-h-24 resize-y py-3"
            />
          </label>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 text-sm text-mute">Prioriteetti</legend>
            {PRIORITIES.map((priority) => (
              <label
                key={priority}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-hairline px-3 text-sm text-mute transition-colors hover:text-linen has-checked:border-linen/25 has-checked:bg-linen/10 has-checked:text-linen has-focus-visible:outline-2 has-focus-visible:outline-accent"
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]">
            <label className="grid min-w-0 gap-1.5 text-sm text-mute">
              Paikka
              <select
                name="location_id"
                defaultValue=""
                className="select"
              >
                <option value="">Ei paikkaa</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm text-mute">
              Tyyppi
              <select
                name="category_id"
                defaultValue=""
                className="select"
              >
                <option value="">Ei tyyppiä</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {formatCategoryName(category.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm text-mute">
              Arvio (h)
              <input
                name="estimated_hours"
                inputMode="decimal"
                autoComplete="off"
                pattern={HOURS_INPUT_PATTERN}
                placeholder="esim. 1,5"
                title="Arvioidut tunnit, esim. 1,5"
                className="field"
              />
            </label>
          </div>
          <a href="#tag-manager" className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">
            Hallitse paikkoja ja tyyppejä
          </a>
        </div>
      </details>
    </ActionForm>
  );
}
