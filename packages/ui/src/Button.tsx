import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs rounded-[10px] gap-1.5',
    md: 'h-11 px-4 text-sm rounded-[11px] gap-2',
    lg: 'h-12 px-5 text-base rounded-[12px] gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#1677F2] text-white hover:bg-[#0F63D8] focus:ring-[#1677F2] shadow-sm active:translate-y-[0.5px]',
    secondary:
      'border border-[#1677F2] bg-white text-[#1677F2] hover:bg-[#EAF3FF] focus:ring-[#1677F2]',
    outline:
      'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] focus:ring-[#1677F2]',
    ghost:
      'bg-transparent text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] focus:ring-[#1677F2]',
    danger:
      'bg-[#EF4444] text-white hover:bg-red-600 focus:ring-red-500 shadow-sm',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
