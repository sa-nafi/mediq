import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-secondary text-white hover:bg-secondary-light shadow-soft hover:shadow-card',
        primary:
          'bg-primary text-white hover:bg-primary-light shadow-soft hover:shadow-card',
        accent:
          'bg-accent text-primary font-bold hover:bg-accent-dark shadow-soft hover:shadow-card',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 shadow-soft hover:shadow-card',
        outline:
          'border-2 border-secondary text-secondary bg-transparent hover:bg-secondary hover:text-white',
        ghost:
          'text-foreground hover:bg-background',
        link:
          'text-secondary underline-offset-4 hover:underline',
        white:
          'bg-white text-primary hover:bg-background shadow-soft',
      },
      size: {
        default: 'h-11 px-6 py-2.5 rounded-full',
        sm: 'h-9 px-4 py-2 text-xs rounded-full',
        lg: 'h-13 px-8 py-3 text-base rounded-full',
        xl: 'h-14 px-10 py-3.5 text-base rounded-full',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
