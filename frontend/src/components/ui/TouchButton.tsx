import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline' | 'emergency';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isActive?: boolean;
}

const variantStyles = {
  default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  success: 'bg-success text-success-foreground hover:bg-success/90',
  warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border-2 border-border bg-transparent text-foreground hover:bg-secondary',
  emergency: 'e-stop-button',
};

const sizeStyles = {
  sm: 'min-h-[48px] px-4 text-sm',
  md: 'min-h-[60px] px-5 text-base',
  lg: 'min-h-[72px] px-6 text-lg',
  xl: 'min-h-[90px] px-8 text-xl',
};

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    isActive,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'touch-button flex items-center justify-center gap-2 font-semibold rounded-xl',
          'transition-all duration-150 touch-none select-none',
          'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          isActive && variant === 'outline' && 'bg-primary text-primary-foreground border-primary',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';
