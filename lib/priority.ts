import type { Priority } from '@/lib/types';

export const PRIORITY_META: Record<Priority, { label: string; dot: string; text: string }> = {
  NEXT: { label: 'Seuraavaksi', dot: 'bg-berry', text: 'text-berry-soft' },
  SOON: { label: 'Pian', dot: 'bg-moss-soft', text: 'text-moss-soft' },
  LATER: { label: 'Myöhemmin', dot: 'bg-mute', text: 'text-mute' },
  MAYBE: { label: 'Epätodennäköistä', dot: 'bg-faint', text: 'text-faint' },
};
