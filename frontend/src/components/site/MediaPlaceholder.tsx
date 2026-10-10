import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Stands in for a missing image: a calm surface with an icon (replaces the old gradient bands).
export default function MediaPlaceholder({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-surface text-primary', className)} aria-hidden="true">
      <Icon className="h-10 w-10 opacity-80" />
    </div>
  );
}
