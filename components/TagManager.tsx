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
import { formatCategoryName } from '@/lib/format';
import { ActionForm } from '@/components/ActionForm';
import { SubmitButton } from '@/components/SubmitButton';

interface TagManagerProps {
  locations: Location[];
  categories: Category[];
}

export function TagManager({ locations, categories }: TagManagerProps) {
  return (
    <details id="tag-manager" className="group scroll-mt-6 border-t border-hairline">
      <summary className="disclosure h-14 rounded-lg text-sm text-mute transition-colors hover:bg-gray-50 hover:text-ink">
        <Plus className="size-4 transition-transform group-open:rotate-45" strokeWidth={1.75} aria-hidden />
        Paikat ja tyypit
      </summary>
      <div className="fade-in grid gap-10 pt-2 pb-6 sm:grid-cols-2 lg:gap-16">
        <TagGroup
          title="Paikat"
          singularTitle="paikka"
          inputId="new-places"
          successMessage="Paikka lisätty."
          placeholder="Uusi paikka, esim. vintti"
          tags={locations}
          createAction={createLocation}
          deleteAction={deleteLocation}
        />
        <TagGroup
          title="Tyypit"
          singularTitle="tyyppi"
          inputId="new-types"
          successMessage="Tyyppi lisätty."
          placeholder="Uusi tyyppi, esim. maalaus"
          tags={categories.map((category) => ({ id: category.id, name: formatCategoryName(category.name) }))}
          createAction={createCategory}
          deleteAction={deleteCategory}
        />
      </div>
    </details>
  );
}

interface TagGroupProps {
  title: string;
  singularTitle: string;
  inputId: string;
  successMessage: string;
  placeholder: string;
  tags: { id: string; name: string }[];
  createAction: FormAction;
  deleteAction: (id: string) => Promise<ActionState>;
}

function TagGroup({ title, singularTitle, inputId, successMessage, placeholder, tags, createAction, deleteAction }: TagGroupProps) {
  return (
    <section aria-label={title}>
      <h3 className="font-serif text-2xl text-linen">{title}</h3>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <li key={tag.id} className="min-w-0 max-w-full">
            <ActionForm
              action={deleteAction.bind(null, tag.id)}
              confirmMessage={`Poistetaanko "${tag.name}"? Tunniste poistetaan myös sitä käyttävistä tehtävistä.`}
              successMessage={`Poistettu "${tag.name}".`}
              focusTargetId={inputId}
              className="grid min-h-11 min-w-0 grid-cols-[minmax(0,1fr)_2.75rem] items-center rounded-2xl border border-hairline pl-3 text-sm text-linen"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{tag.name}</span>
              <SubmitButton
                ariaLabel={`Poista ${tag.name}`}
                className="size-11 rounded-full text-mute hover:bg-berry/15 hover:text-berry-soft"
              >
                <X className="size-3.5" strokeWidth={1.75} aria-hidden />
              </SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>

      <ActionForm action={createAction} successMessage={successMessage} focusTargetId={inputId} className="mt-4 flex flex-wrap gap-2">
        <input
          id={inputId}
          name="name"
          required
          maxLength={60}
          autoComplete="off"
          placeholder={placeholder}
          aria-label={`Uusi ${singularTitle}`}
          className="field flex-1"
        />
        <SubmitButton className="h-11 shrink-0 rounded-xl bg-linen px-4 text-sm font-medium text-ink hover:bg-white">
          Lisää
        </SubmitButton>
      </ActionForm>
    </section>
  );
}
