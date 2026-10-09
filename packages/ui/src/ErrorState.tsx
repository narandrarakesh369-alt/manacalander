import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while processing your request. Please try again.',
  onRetry,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-red-100 rounded-xl ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
      <p className="mt-1 text-sm text-[#64748B] max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw size={14} />}
          >
            Try Again
          </Button>
        </div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
