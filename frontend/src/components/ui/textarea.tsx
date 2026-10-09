'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { fieldClass } from '@/components/ui/input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea className={cn(fieldClass, 'min-h-[120px]', className)} ref={ref} {...props} />
));
Textarea.displayName = 'Textarea';

export { Textarea };
