import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-[#E2E8F0] rounded-xl ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#EAF3FF] text-[#1677F2] flex items-center justify-center mb-4">
        {icon || <Inbox size={24} />}
      </div>
      <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
      <p className="mt-1 text-sm text-[#64748B] max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
