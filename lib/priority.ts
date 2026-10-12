import type { Priority } from '@/lib/types';

export const PRIORITY_META: Record<Priority, { label: string; dot: string; text: string }> = {
  NEXT: { label: 'Next', dot: 'bg-berry', text: 'text-berry-soft' },
  SOON: { label: 'Soon', dot: 'bg-moss-soft', text: 'text-moss-soft' },
  LATER: { label: 'Later', dot: 'bg-mute', text: 'text-mute' },
  MAYBE: { label: 'Maybe', dot: 'bg-faint', text: 'text-faint' },
};
