'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({ title = 'Confirm', description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h3>
        {description && <p className="mt-2 text-sm text-ui-subtle">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">{cancelLabel}</Button>
          <Button onClick={onConfirm} variant="destructive">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
