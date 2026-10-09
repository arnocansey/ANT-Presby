'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const fieldClass =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger sm:text-sm';

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn(fieldClass, 'h-11', className)} ref={ref} {...props} />
));
Input.displayName = 'Input';

export { Input };
