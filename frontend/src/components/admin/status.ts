import type { BadgeTone } from '@/components/ui/badge';

// Status words used across admin (donations, prayers, news, devotionals, albums, events, users).
const TONES: Record<string, BadgeTone> = {
  active: 'success',
  answered: 'success',
  approved: 'success',
  completed: 'success',
  published: 'success',
  pending: 'warning',
  review: 'warning',
  scheduled: 'warning',
  archived: 'neutral',
  draft: 'neutral',
  cancelled: 'danger',
  failed: 'danger',
  inactive: 'danger',
};

export const statusTone = (status?: string | null): BadgeTone => TONES[String(status ?? '').toLowerCase()] ?? 'neutral';

/** "in_review" → "In review"; empty → fallback. */
export const statusLabel = (status?: string | null, fallback = 'Unknown') => {
  const text = String(status ?? '').replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : fallback;
};
