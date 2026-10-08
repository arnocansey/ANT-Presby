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

export default function ConfirmDialog({
  title = 'Confirm',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm animate-fade-in"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-lg rounded-panel border border-border bg-card p-6 text-foreground shadow-xl animate-slide-up"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h3>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant="danger" autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
