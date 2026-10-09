import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  isHoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  padding = 'md',
  isHoverable = false,
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-[16px] shadow-[0_2px_8px_rgba(15,23,42,0.05)] ${
        isHoverable ? 'hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] hover:border-[#CBD5E1] transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div>
            {title && <h3 className="font-semibold text-base text-[#0F172A]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-5 py-3 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};
