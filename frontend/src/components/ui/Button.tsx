import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-orange' | 'dark';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-orange-500 text-white',
    'hover:bg-orange-600 active:bg-orange-700',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500',
    'shadow-sm hover:shadow-brand',
  ].join(' '),
  secondary: [
    'bg-white text-slate-700 border border-slate-200',
    'hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400',
    'shadow-xs',
  ].join(' '),
  ghost: [
    'bg-transparent text-slate-600',
    'hover:bg-slate-100 hover:text-slate-900',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400',
  ].join(' '),
  danger: [
    'bg-red-600 text-white',
    'hover:bg-red-700 active:bg-red-800',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500',
    'shadow-sm',
  ].join(' '),
  'outline-orange': [
    'bg-transparent text-orange-600 border border-orange-300',
    'hover:bg-orange-50 hover:border-orange-400',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500',
  ].join(' '),
  dark: [
    'bg-slate-900 text-white border border-slate-800',
    'hover:bg-slate-800 active:bg-slate-950',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500',
    'shadow-sm',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1    text-xs  rounded-md  gap-1',
  sm: 'px-3.5 py-1.5  text-sm  rounded-lg  gap-1.5',
  md: 'px-4   py-2.5  text-sm  rounded-lg  gap-2',
  lg: 'px-5   py-3    text-sm  rounded-xl  gap-2',
  xl: 'px-7   py-3.5  text-base rounded-xl gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
};
