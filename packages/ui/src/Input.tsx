import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-[#475569]"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-[10px]">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full h-[46px] rounded-[10px] border bg-white px-3.5 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:outline-none focus:border-[#1677F2] focus:ring-2 focus:ring-[#EAF3FF] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] ${
            error ? 'border-[#EF4444] focus:ring-[#FEF2F2] focus:border-[#EF4444]' : 'border-[#CBD5E1]'
          } ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#64748B]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#64748B] mt-1">{helperText}</p>}
    </div>
  );
};
