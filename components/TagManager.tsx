'use client';

import { Plus, X } from 'lucide-react';
import {
  createCategory,
  createLocation,
  deleteCategory,
  deleteLocation,
} from '@/app/actions/tags';
import type { ActionState, FormAction } from '@/lib/action-state';
import type { Category, Location } from '@/lib/types';
import { ActionForm } from '@/components/ActionForm';
import { SubmitButton } from '@/components/SubmitButton';

interface TagManagerProps {
  locations: Location[];
  categories: Category[];
}

export function TagManager({ locations, categories }: TagManagerProps) {
  return (
    <details className="group border-t border-hairline">
      <summary className="disclosure h-14 text-sm text-mute transition-colors hover:text-linen">
        <Plus className="size-4 transition-transform group-open:rotate-45" strokeWidth={1.75} aria-hidden />
        Places &amp; types
      </summary>
      <div className="fade-in grid gap-10 pt-2 pb-6 sm:grid-cols-2 lg:gap-16">
        <TagGroup
          title="Places"
          placeholder="New place, e.g. Vintti"
          tags={locations}
          createAction={createLocation}
          deleteAction={deleteLocation}
        />
        <TagGroup
          title="Types"
          placeholder="New type, e.g. Painting"
          tags={categories}
          createAction={createCategory}
          deleteAction={deleteCategory}
        />
      </div>
    </details>
  );
}

interface TagGroupProps {
  title: string;
  placeholder: string;
  tags: { id: string; name: string }[];
  createAction: FormAction;
  deleteAction: (id: string) => Promise<ActionState>;
}

function TagGroup({ title, placeholder, tags, createAction, deleteAction }: TagGroupProps) {
  return (
    <section aria-label={title}>
      <h3 className="font-serif text-2xl text-linen">{title}</h3>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <li key={tag.id}>
            <ActionForm
              action={deleteAction.bind(null, tag.id)}
              confirmMessage={`Remove "${tag.name}"? Tasks using it will simply lose the tag.`}
              className="flex min-h-9 flex-wrap items-center rounded-full border border-hairline pr-1 pl-3.5 text-sm text-linen"
            >
              {tag.name}
              <SubmitButton
                ariaLabel={`Remove ${tag.name}`}
                className="ml-1 size-7 rounded-full text-faint hover:bg-berry/15 hover:text-berry-soft"
              >
                <X className="size-3.5" strokeWidth={1.75} aria-hidden />
              </SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>

      <ActionForm action={createAction} className="mt-4 flex flex-wrap gap-2">
        <input
          name="name"
          required
          maxLength={60}
          autoComplete="off"
          placeholder={placeholder}
          aria-label={`New ${title.toLowerCase().slice(0, -1)}`}
          className="field flex-1"
        />
        <SubmitButton className="h-11 shrink-0 rounded-xl bg-linen px-4 text-sm font-medium text-ink hover:bg-white">
          Add
        </SubmitButton>
      </ActionForm>
    </section>
  );
}
