import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  asChild?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className = '',
  variant = 'default',
  size = 'md',
  children,
  asChild = false,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'secondary':
        return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
      case 'outline':
        return 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-700';
      case 'link':
        return 'bg-transparent text-blue-600 hover:underline';
      case 'destructive':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-gray-800 text-white hover:bg-gray-900';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2.5 py-1.5';
      case 'lg':
        return 'text-base px-6 py-3';
      default:
        return 'text-sm px-4 py-2';
    }
  };

  const classes = `rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
    transition-colors duration-200 ${getVariantClasses()} ${getSizeClasses()} ${className}`;

  return asChild ? (
    <div className={classes}>{children}</div>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};