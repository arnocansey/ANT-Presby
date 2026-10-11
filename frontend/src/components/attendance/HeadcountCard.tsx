'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormSection } from '@/components/admin/form-layout';
import { useAdjustHeadcount, type EventAttendance } from '@/hooks/useApi';

// Adults and children counters, added on top of the people checked in by name.
export default function HeadcountCard({ sheet, disabled }: { sheet: EventAttendance; disabled: boolean }) {
  const adjust = useAdjustHeadcount(sheet.event.id);
  const rows = [
    { key: 'adults' as const, label: 'Adults', value: sheet.headcount.adults },
    { key: 'children' as const, label: 'Children', value: sheet.headcount.children },
  ];

  return (
    <FormSection title="Headcount" description="Count people you are not checking in by name.">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <span className="font-medium text-foreground">{row.label}</span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label={`One fewer ${row.label.toLowerCase()}`}
                disabled={disabled || row.value === 0}
                onClick={() => adjust.mutate({ [row.key]: -1 })}
              >
                <Minus className="h-5 w-5" aria-hidden="true" />
              </Button>
              <span className="w-12 text-center text-2xl font-bold tabular-nums text-foreground" aria-live="polite">
                {row.value}
              </span>
              <Button
                type="button"
                size="icon"
                aria-label={`One more ${row.label.toLowerCase()}`}
                disabled={disabled}
                onClick={() => adjust.mutate({ [row.key]: 1 })}
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
        <p className="border-t border-border pt-3 text-sm text-muted">
          <span className="font-semibold text-foreground">{sheet.totals.total} present</span>: {sheet.totals.named} named,{' '}
          {sheet.totals.adults} adults, {sheet.totals.children} children counted
        </p>
      </div>
    </FormSection>
  );
}
