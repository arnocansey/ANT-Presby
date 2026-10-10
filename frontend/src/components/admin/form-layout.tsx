'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Put this on the <form>: two columns from md up, one column on phones. */
export const formGridClass = 'grid gap-5 md:grid-cols-2';

export function FormSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  full = false,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  /** Span both columns on md and up. */
  full?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', full && 'md:col-span-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 border-t border-border pt-5 md:col-span-2', className)}>
      {children}
    </div>
  );
}

type CheckboxFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode;
  /** Span both columns on md and up (default true). */
  full?: boolean;
};

// forwardRef so react-hook-form's register() can attach its ref.
export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, full = true, className, ...props }, ref) => (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground',
        full && 'md:col-span-2',
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        className="h-5 w-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        {...props}
      />
      <span>{label}</span>
    </label>
  )
);
CheckboxField.displayName = 'CheckboxField';
