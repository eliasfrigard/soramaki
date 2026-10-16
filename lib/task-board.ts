import type { Task } from './types';

export function groupTasks(tasks: Task[]) {
  const inProgress: Task[] = [];
  const upNext: Task[] = [];
  const someday: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.status === 'DONE') {
      completed.push(task);
    } else if (task.status === 'IN_PROGRESS') {
      inProgress.push(task);
    } else if (task.priority === 'NEXT' || task.priority === 'SOON') {
      upNext.push(task);
    } else {
      someday.push(task);
    }
  }

  completed.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  return { inProgress, upNext, someday, completed };
}

export function summarizeTasks(tasks: Task[]) {
  let budget = 0;
  let spent = 0;
  let estimatedMinutes = 0;
  let actualMinutes = 0;

  for (const task of tasks) {
    estimatedMinutes += task.estimatedMinutes ?? 0;
    actualMinutes += task.actualMinutes ?? 0;
    for (const item of task.costItems) {
      budget += item.estimatedCost;
      if (item.isPurchased) spent += item.actualCost ?? item.estimatedCost;
    }
  }

  return {
    budget: Math.round(budget * 100) / 100,
    spent: Math.round(spent * 100) / 100,
    estimatedMinutes,
    actualMinutes,
  };
}
