'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { fieldClass } from '@/components/ui/input';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, 'h-11 pr-8', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export { Select };
export default Select;
