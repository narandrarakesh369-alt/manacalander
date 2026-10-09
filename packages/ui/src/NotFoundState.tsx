import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export interface NotFoundStateProps {
  title?: string;
  message?: string;
  homePath?: string;
  className?: string;
}

export const NotFoundState: React.FC<NotFoundStateProps> = ({
  title = 'Page Not Found',
  message = 'The page or resource you are looking for does not exist or has been moved.',
  homePath = '/',
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-[#F8FAFC] ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#EAF3FF] text-[#1677F2] flex items-center justify-center mb-4 shadow-sm">
        <SearchX size={32} />
      </div>
      <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
      <p className="mt-2 text-sm text-[#64748B] max-w-sm">{message}</p>
      <div className="mt-6">
        <Button variant="primary" size="md" onClick={() => navigate(homePath)}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};
