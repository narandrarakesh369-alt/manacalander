import React from 'react';

export interface SegmentedControlOption<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  variant?: 'pill' | 'subtle';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  variant = 'pill',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-[#EEF2F7] rounded-full border border-[#E2E8F0] ${className}`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.id)}
            className={`flex items-center justify-center gap-1.5 transition-all duration-150 select-none ${
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
            } rounded-full ${
              isSelected
                ? variant === 'subtle'
                  ? 'bg-[#EAF3FF] text-[#1677F2] font-semibold shadow-xs'
                  : 'bg-[#1677F2] text-white font-semibold shadow-sm'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60 font-medium'
            }`}
          >
            {opt.icon && <span className="text-current">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
