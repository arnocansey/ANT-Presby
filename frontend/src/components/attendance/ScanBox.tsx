'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// A USB or Bluetooth card scanner types the code and presses Enter, so this box stays focused.
export default function ScanBox({ onScan, disabled }: { onScan: (text: string) => void; disabled: boolean }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const text = value.trim();
        setValue('');
        if (text) onScan(text);
        ref.current?.focus();
      }}
      className="space-y-2"
    >
      <Label htmlFor="scan-card">Scan a card</Label>
      <Input
        id="scan-card"
        ref={ref}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Scan or type a card code, then Enter"
        autoComplete="off"
        disabled={disabled}
      />
    </form>
  );
}
