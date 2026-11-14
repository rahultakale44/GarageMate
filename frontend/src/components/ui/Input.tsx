import React from 'react';

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftIcon, rightElement, className = '', ...props }, ref) => {
    const baseClasses = [
      'w-full bg-white border rounded-lg text-sm text-slate-900',
      'placeholder:text-slate-400 transition-all duration-150',
      'focus:outline-none focus:ring-2',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-orange-500/10',
      leftIcon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
      rightElement ? 'pr-10' : '',
      className,
    ].join(' ');

    return (
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input ref={ref} className={baseClasses} {...props} />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    const baseClasses = [
      'w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-slate-900',
      'placeholder:text-slate-400 transition-all duration-150 resize-y min-h-[80px]',
      'focus:outline-none focus:ring-2',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-orange-500/10',
      className,
    ].join(' ');

    return (
      <div>
        <textarea ref={ref} className={baseClasses} {...props} />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', children, ...props }, ref) => {
    const baseClasses = [
      'w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-slate-900',
      'transition-all duration-150 cursor-pointer',
      'focus:outline-none focus:ring-2',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-orange-500/10',
      className,
    ].join(' ');

    return (
      <div>
        <select ref={ref} className={baseClasses} {...props}>
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ── FormField ─────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className = '',
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-slate-700"
    >
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);
