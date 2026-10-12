import { Check, ExternalLink, Plus, X } from 'lucide-react';
import { addCostItem, deleteCostItem, toggleCostItemPurchased } from '@/app/actions/costs';
import { COST_TYPES, type CostItem, type CostType } from '@/lib/types';
import { formatEuro } from '@/lib/format';
import { SubmitButton } from '@/components/SubmitButton';

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
    <section aria-label="Costs" className="rounded-2xl bg-ink-sunken/60 px-3 py-2">
      {items.length > 0 && (
        <>
          <div className="flex items-baseline justify-between px-1 pt-1 pb-2">
            <h3 className="eyebrow">Costs</h3>
            <p className="text-xs text-faint tabular-nums">
              {purchasedCount}/{items.length} bought · <span className="text-moss-soft">{formatEuro(total)}</span>
            </p>
          </div>
          <ul className="border-t border-hairline">
            {items.map((item) => (
              <CostItemRow key={item.id} item={item} />
            ))}
          </ul>
        </>
      )}

      <details className="group">
        <summary className="disclosure h-10 px-1 text-sm text-mute transition-colors hover:text-linen">
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
  const togglePurchased = toggleCostItemPurchased.bind(null, item.id, !item.isPurchased);
  const removeItem = deleteCostItem.bind(null, item.id);

  return (
    <li className="group/item flex items-center gap-1 border-b border-hairline">
      <form action={togglePurchased}>
        <SubmitButton
          ariaLabel={`Mark "${item.name}" as ${item.isPurchased ? 'not purchased' : 'purchased'}`}
          className="size-10 shrink-0"
        >
          <span
            aria-hidden
            className={`flex size-[18px] items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
              item.isPurchased ? 'border-moss bg-moss text-linen' : 'border-faint hover:border-moss-soft'
            }`}
          >
            {item.isPurchased && <Check className="size-3" strokeWidth={3} />}
          </span>
        </SubmitButton>
      </form>

      <div className="min-w-0 flex-1 py-2">
        {item.storeUrl ? (
          <a
            href={item.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex max-w-full items-center gap-1.5 text-sm underline decoration-hairline underline-offset-4 transition-colors hover:decoration-accent ${
              item.isPurchased ? 'text-faint line-through' : 'text-linen'
            }`}
          >
            <span className="truncate">{item.name}</span>
            <ExternalLink className="size-3 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">(opens in new tab)</span>
          </a>
        ) : (
          <span className={`block truncate text-sm ${item.isPurchased ? 'text-faint line-through' : 'text-linen'}`}>
            {item.name}
          </span>
        )}
        <span className="block text-[11px] text-faint">{COST_TYPE_LABELS[item.costType]}</span>
      </div>

      <span className="shrink-0 pl-2 text-sm text-mute tabular-nums">{formatEuro(item.estimatedCost)}</span>

      <form action={removeItem}>
        <SubmitButton
          ariaLabel={`Delete "${item.name}"`}
          className="size-9 shrink-0 rounded-full text-faint hover:text-berry-soft lg:opacity-0 lg:group-hover/item:opacity-100 lg:focus-visible:opacity-100"
        >
          <X className="size-3.5" strokeWidth={1.75} aria-hidden />
        </SubmitButton>
      </form>
    </li>
  );
}

function CostItemForm({ taskId }: { taskId: string }) {
  const addItem = addCostItem.bind(null, taskId);

  return (
    <form action={addItem} className="fade-in grid grid-cols-2 gap-2 pb-2">
      <input
        name="name"
        required
        maxLength={255}
        autoComplete="off"
        placeholder="Item name"
        aria-label="Item name"
        className="field col-span-2"
      />
      <select name="cost_type" defaultValue="MATERIAL" aria-label="Cost type" className="select">
        {COST_TYPES.map((type) => (
          <option key={type} value={type}>
            {COST_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <label className="relative">
        <span className="sr-only">Estimated cost in euros</span>
        <input
          name="estimated_cost"
          inputMode="decimal"
          autoComplete="off"
          pattern="[0-9 ]*([.,][0-9]{1,2})?"
          placeholder="Estimate"
          className="field pr-8"
        />
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-faint" aria-hidden>
          €
        </span>
      </label>
      <input
        name="store_url"
        type="url"
        inputMode="url"
        autoComplete="off"
        placeholder="Store link (optional)"
        aria-label="Store URL"
        className="field col-span-2"
      />
      <SubmitButton className="col-span-2 h-11 rounded-xl bg-linen text-sm font-medium text-ink hover:bg-white">
        Add item
      </SubmitButton>
    </form>
  );
}
