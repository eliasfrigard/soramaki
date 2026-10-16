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
    <details id="tag-manager" className="group scroll-mt-6 border-t border-hairline">
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
          <li key={tag.id} className="min-w-0 max-w-full">
            <ActionForm
              action={deleteAction.bind(null, tag.id)}
              confirmMessage={`Remove "${tag.name}"? Tasks using it will simply lose the tag.`}
              successMessage={`Removed "${tag.name}".`}
              focusTargetId={`new-${title.toLowerCase()}`}
              className="grid min-h-11 min-w-0 grid-cols-[minmax(0,1fr)_2.75rem] items-center rounded-2xl border border-hairline pl-3 text-sm text-linen"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{tag.name}</span>
              <SubmitButton
                ariaLabel={`Remove ${tag.name}`}
                className="size-11 rounded-full text-mute hover:bg-berry/15 hover:text-berry-soft"
              >
                <X className="size-3.5" strokeWidth={1.75} aria-hidden />
              </SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>

      <ActionForm action={createAction} successMessage={`${title.slice(0, -1)} added.`} focusTargetId={`new-${title.toLowerCase()}`} className="mt-4 flex flex-wrap gap-2">
        <input
          id={`new-${title.toLowerCase()}`}
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
