import type { Category, Location, Task } from '@/lib/types';
import { CostSection } from '@/components/CostItems';
import { TaskItem } from '@/components/TaskItem';

interface TaskCardProps {
  task: Task;
  locations: Location[];
  categories: Category[];
}

export function TaskCard({ task, locations, categories }: TaskCardProps) {
  const costItems = task.costItems ?? [];
  const costTotal = costItems.reduce((sum, item) => sum + item.estimatedCost, 0);

  return (
    <TaskItem task={task} costTotal={costTotal} locations={locations} categories={categories}>
      <CostSection taskId={task.id} items={costItems} total={costTotal} />
    </TaskItem>
  );
}
