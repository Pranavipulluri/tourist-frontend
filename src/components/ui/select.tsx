import React, { useState } from 'react';

export interface SelectProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
};

export interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  className = '',
  children,
}) => {
  return (
    <button
      type="button"
      className={`flex items-center justify-between w-full px-3 py-2 text-sm 
        bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 
        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      onClick={() => {}}
    >
      {children}
      <svg
        className="w-4 h-4 ml-2 -mr-1 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};

export interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  children,
}) => {
  return <span>{children || placeholder}</span>;
};

export interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={`absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 
        ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm ${className}`}
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

export interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  className = '',
  children,
}) => {
  return (
    <div
      className={`cursor-pointer select-none relative py-2 pl-3 pr-9 
        hover:bg-gray-100 text-gray-900 ${className}`}
      data-value={value}
      onClick={() => {}}
    >
      {children}
    </div>
  );
};