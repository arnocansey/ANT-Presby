// Maps an API status word to a badge tone. The badge always shows the word itself too.
export function statusTone(status?: string | null): 'neutral' | 'success' | 'warning' | 'danger' {
  const value = String(status || '').toLowerCase();
  if (['completed', 'paid', 'published', 'answered', 'active', 'approved', 'verified'].includes(value)) return 'success';
  if (['pending', 'processing', 'draft', 'scheduled'].includes(value)) return 'warning';
  if (['failed', 'cancelled', 'canceled', 'rejected', 'declined'].includes(value)) return 'danger';
  return 'neutral';
}
