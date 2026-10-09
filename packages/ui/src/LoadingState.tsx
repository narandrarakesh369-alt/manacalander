import React from 'react';

export interface LoadingStateProps {
  message?: string;
  description?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  description = 'Please wait while we retrieve the latest information.',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#EAF3FF] border-t-[#1677F2] animate-spin" />
        <div className="absolute w-3 h-3 bg-[#1677F2] rounded-full" />
      </div>
      <h4 className="mt-4 text-base font-semibold text-[#0F172A]">{message}</h4>
      {description && <p className="mt-1 text-xs text-[#64748B] max-w-xs">{description}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
