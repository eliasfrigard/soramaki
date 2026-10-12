'use client';

import { useOptimistic, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toSearchParams, type StatusFilter, type TaskFilters } from '@/lib/filters';
import type { Category, Location } from '@/lib/types';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
];

interface FilterBarProps {
  locations: Location[];
  categories: Category[];
  filters: TaskFilters;
}

export function FilterBar({ locations, categories, filters }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);

  function applyFilters(next: TaskFilters) {
    const query = toSearchParams(next).toString();
    startTransition(() => {
      setOptimisticFilters(next);
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  const hasPlaceFilters = Boolean(optimisticFilters.locationId || optimisticFilters.categoryId);

  return (
    <div
      role="search"
      aria-label="Filter tasks"
      aria-busy={isPending}
      className={`flex flex-col gap-2 transition-opacity sm:flex-row sm:items-center ${
        isPending ? 'opacity-50' : ''
      }`}
    >
      <div role="group" aria-label="Task status" className="flex rounded-full border border-hairline p-1">
        {STATUS_TABS.map((tab) => {
          const isSelected = optimisticFilters.status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => !isSelected && applyFilters({ ...optimisticFilters, status: tab.value })}
              className={`h-9 flex-1 rounded-full px-5 text-sm transition-colors sm:flex-none ${
                isSelected ? 'bg-linen text-ink' : 'text-mute hover:text-linen'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex">
        <select
          aria-label="Filter by location"
          value={optimisticFilters.locationId ?? ''}
          onChange={(e) => applyFilters({ ...optimisticFilters, locationId: e.target.value || undefined })}
          className={`select rounded-full sm:w-44 ${optimisticFilters.locationId ? 'border-linen/25' : ''}`}
        >
          <option value="">All places</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by category"
          value={optimisticFilters.categoryId ?? ''}
          onChange={(e) => applyFilters({ ...optimisticFilters, categoryId: e.target.value || undefined })}
          className={`select rounded-full sm:w-44 ${optimisticFilters.categoryId ? 'border-linen/25' : ''}`}
        >
          <option value="">All types</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {hasPlaceFilters && (
          <button
            type="button"
            onClick={() => applyFilters({ status: optimisticFilters.status })}
            aria-label="Clear place and type filters"
            className="inline-flex size-11 items-center justify-center rounded-full text-mute transition-colors hover:bg-linen/5 hover:text-linen"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
