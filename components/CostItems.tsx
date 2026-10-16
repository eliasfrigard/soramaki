'use client';

import { useRef, useState } from 'react';
import { Check, ExternalLink, Pencil, Plus, X } from 'lucide-react';
import { addCostItem, deleteCostItem, toggleCostItemPurchased, updateCostItem } from '@/app/actions/costs';
import { COST_TYPES, type CostItem, type CostType } from '@/lib/types';
import { formatEuro } from '@/lib/format';
import { SubmitButton } from '@/components/SubmitButton';
import { ActionForm } from '@/components/ActionForm';

const COST_TYPE_LABELS: Record<CostType, string> = {
  MATERIAL: 'Material',
  TOOL: 'Tool',
  CONTRACTOR: 'Contractor',
  OTHER: 'Other',
};

interface CostSectionProps {
  taskId: string;
  items: CostItem[];
  total: number;
}

export function CostSection({ taskId, items, total }: CostSectionProps) {
  const purchasedCount = items.filter((item) => item.isPurchased).length;

  return (
    <section aria-label="Costs" className="min-w-0 rounded-2xl bg-ink-sunken/60 p-3">
      {items.length > 0 && (
        <>
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-baseline gap-x-2 pb-2 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto_2.75rem_2.75rem]">
            <h3 className="col-span-full text-sm text-mute sm:col-span-2">
              Costs · {purchasedCount}/{items.length} bought
            </h3>
            <p className="col-start-2 min-w-0 text-right text-sm text-moss-soft tabular-nums [overflow-wrap:anywhere] sm:col-start-3 sm:row-start-1">
              <span className="block text-xs text-mute">Budget estimate</span>
              {formatEuro(total)}
            </p>
          </div>
          <ul className="border-t border-hairline">
            {items.map((item) => (
              <CostItemRow key={item.id} item={item} />
            ))}
          </ul>
        </>
      )}

      <details
        className="group"
        onToggle={(event) => {
          if (event.currentTarget.open) event.currentTarget.querySelector('input')?.focus();
        }}
      >
        <summary id={`task-${taskId}-add-cost`} className="disclosure min-h-11 text-sm text-mute transition-colors hover:text-linen">
          <Plus className="size-3.5 transition-transform group-open:rotate-45" strokeWidth={1.75} aria-hidden />
          <span className="group-open:hidden">Add cost item</span>
          <span className="hidden group-open:inline">Cancel</span>
        </summary>
        <CostItemForm taskId={taskId} />
      </details>
    </section>
  );
}

function CostItemRow({ item }: { item: CostItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const editRef = useRef<HTMLButtonElement>(null);
  const togglePurchased = toggleCostItemPurchased.bind(null, item.id, !item.isPurchased);
  const removeItem = deleteCostItem.bind(null, item.id);
  const amount = item.isPurchased ? item.actualCost ?? item.estimatedCost : item.estimatedCost;
  const closeEditor = () => {
    setIsEditing(false);
    editRef.current?.focus();
  };

  return (
    <li className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-x-2 border-b border-hairline py-2 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto_2.75rem_2.75rem]">
      <ActionForm
        action={togglePurchased}
        successMessage={`Marked "${item.name}" as ${item.isPurchased ? 'not purchased' : 'purchased'}.`}
        focusTargetId={`cost-${item.id}-purchase`}
        className="contents"
      >
        <SubmitButton
          ariaLabel={`Mark "${item.name}" as ${item.isPurchased ? 'not purchased' : 'purchased'}`}
          ariaPressed={item.isPurchased}
          id={`cost-${item.id}-purchase`}
          disabled={isEditing}
          className="col-start-1 row-start-1 row-span-2 size-11 self-start rounded-lg sm:row-span-1 sm:self-center"
        >
          <span
            aria-hidden
            className={`flex size-[18px] items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${item.isPurchased ? 'border-moss bg-moss text-linen' : 'border-faint hover:border-moss-soft'
              }`}
          >
            {item.isPurchased && <Check className="size-3" strokeWidth={3} />}
          </span>
        </SubmitButton>
      </ActionForm>

      <div className="col-start-2 row-start-1 min-w-0 pt-3 sm:pt-0">
        {item.storeUrl ? (
          <a
            href={item.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex max-w-full items-start gap-2 text-sm underline decoration-hairline underline-offset-4 transition-colors hover:decoration-accent ${item.isPurchased ? 'text-mute line-through' : 'text-linen'
              }`}
          >
            <span className="min-w-0 [overflow-wrap:anywhere]">{item.name}</span>
            <ExternalLink className="mt-1 size-3 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">(opens in new tab)</span>
          </a>
        ) : (
          <span className={`block text-sm [overflow-wrap:anywhere] ${item.isPurchased ? 'text-mute line-through' : 'text-linen'}`}>
            {item.name}
          </span>
        )}
        <span className="block text-xs text-mute">{COST_TYPE_LABELS[item.costType]}</span>
      </div>

      <span className="col-start-2 row-start-2 min-w-0 text-right text-sm text-mute tabular-nums [overflow-wrap:anywhere] sm:col-start-3 sm:row-start-1">
        <span className="block text-xs">{item.isPurchased && item.actualCost != null ? 'Paid' : 'Estimate'}</span>
        {formatEuro(amount)}
      </span>

      <button
        ref={editRef}
        type="button"
        aria-label={`Edit "${item.name}"`}
        aria-expanded={isEditing}
        aria-controls={`cost-${item.id}-editor`}
        onClick={() => setIsEditing((value) => !value)}
        className="col-start-3 row-start-1 inline-flex size-11 cursor-pointer items-center justify-center self-start rounded-full text-mute transition-colors hover:bg-linen/5 hover:text-linen sm:col-start-4 sm:self-center"
      >
        <Pencil className="size-4" aria-hidden />
      </button>

      <ActionForm
        action={removeItem}
        confirmMessage={`Delete "${item.name}"? This cannot be undone.`}
        successMessage={`Deleted "${item.name}".`}
        focusTargetId={`task-${item.taskId}-add-cost`}
        className="contents"
      >
        <SubmitButton
          ariaLabel={`Delete "${item.name}"`}
          disabled={isEditing}
          className="col-start-3 row-start-2 size-11 rounded-full text-mute hover:bg-berry/15 hover:text-berry-soft sm:col-start-5 sm:row-start-1"
        >
          <X className="size-3.5" strokeWidth={1.75} aria-hidden />
        </SubmitButton>
      </ActionForm>
      {isEditing && (
        <div id={`cost-${item.id}-editor`} className="col-span-full min-w-0 pt-3">
          <CostItemForm taskId={item.taskId} item={item} onSaved={closeEditor} onCancel={closeEditor} />
        </div>
      )}
    </li>
  );
}

function CostItemForm({
  taskId, item, onSaved, onCancel,
}: { taskId: string; item?: CostItem; onSaved?: () => void; onCancel?: () => void }) {
  const nameRef = useRef<HTMLInputElement>(null);
  const action = item ? updateCostItem.bind(null, item.id) : addCostItem.bind(null, taskId);

  return (
    <ActionForm
      action={action}
      ariaLabel={item ? `Edit cost: ${item.name}` : 'New cost item'}
      successMessage={item ? `Saved "${item.name}".` : 'Cost item added.'}
      onSuccess={() => {
        if (onSaved) onSaved();
        else nameRef.current?.focus();
      }}
      className="fade-in grid min-w-0 grid-cols-1 gap-3 pb-2 sm:grid-cols-2"
    >
      <label className="grid min-w-0 gap-1.5 text-sm text-mute sm:col-span-2">
        Item name
        <input
          ref={nameRef}
          name="name"
          required
          maxLength={255}
          autoComplete="off"
          autoFocus={Boolean(item)}
          defaultValue={item?.name ?? ''}
          className="field"
        />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm text-mute">
        Cost type
        <select name="cost_type" defaultValue={item?.costType ?? 'MATERIAL'} className="select">
          {COST_TYPES.map((type) => (
            <option key={type} value={type}>
              {COST_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm text-mute">
        Estimated cost (€)
        <input
          name="estimated_cost"
          inputMode="decimal"
          autoComplete="off"
          pattern="[0-9 ]*([.,][0-9]{1,2})?"
          defaultValue={item ? String(item.estimatedCost) : ''}
          placeholder="0.00"
          className="field"
        />
      </label>
      {item && (
        <div className="grid min-w-0 gap-1.5 text-sm text-mute sm:col-span-2">
          <label htmlFor={`cost-${item.id}-paid`}>Paid amount (€, optional)</label>
          <input
            id={`cost-${item.id}-paid`}
            name="actual_cost"
            inputMode="decimal"
            pattern="[0-9 ]*([.,][0-9]{1,2})?"
            defaultValue={item.actualCost != null ? String(item.actualCost) : ''}
            className="field"
            aria-describedby={`cost-${item.id}-paid-hint`}
          />
          <p id={`cost-${item.id}-paid-hint`} className="text-xs">Leave blank to use the estimate for purchased value.</p>
        </div>
      )}
      <label className="grid min-w-0 gap-1.5 text-sm text-mute sm:col-span-2">
        Store link (optional)
        <input
          name="store_url"
          type="url"
          inputMode="url"
          autoComplete="off"
          defaultValue={item?.storeUrl ?? ''}
          placeholder="https://"
          className="field"
        />
      </label>
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-11 cursor-pointer rounded-xl px-4 text-sm text-mute hover:text-linen">
            Cancel
          </button>
        )}
        <SubmitButton className="h-11 rounded-xl bg-linen px-5 text-sm font-medium text-ink hover:bg-white">
          {item ? 'Save changes' : 'Add item'}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
