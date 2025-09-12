import React, { useEffect, useRef, useState } from 'react';

export interface PopoverProps {
  children: React.ReactNode;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
    </div>
  );
};

export interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, asChild = false }) => {
  return (
    <div className="inline-block">
      {asChild ? children : <button>{children}</button>}
    </div>
  );
};

export interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export const PopoverContent: React.FC<PopoverContentProps> = ({ 
  children, 
  className = '',
  align = 'center',
  sideOffset = 4
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real implementation, you'd handle this with proper focus management
    setIsOpen(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const getAlignmentClass = () => {
    switch (align) {
      case 'start':
        return 'left-0';
      case 'end':
        return 'right-0';
      default:
        return 'left-1/2 transform -translate-x-1/2';
    }
  };

  return (
    <div 
      ref={contentRef}
      className={`absolute z-50 mt-${sideOffset} ${getAlignmentClass()} bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 ${className}`}
    >
      {children}
    </div>
  );
};