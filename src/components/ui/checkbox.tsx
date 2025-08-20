//importar bibliotecas e funções
import * as React from 'react';
import { cn } from '@/lib/utils';

//interface do checkbox
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, `type`> {
  onCheckedChange?: (checked: boolean) => void;
};

//função do checkbox
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      onChange?.(e);
    };

    return (
      <input
        type="checkbox"
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          "accent-blue-600 cursor-pointer",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Checkbox.displayName = `Checkbox`;
export { Checkbox };