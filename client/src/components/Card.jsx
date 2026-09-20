import React from 'react';
import clsx from 'clsx';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-slate-200/80 shadow-card transition-all duration-200',
        hoverEffect && 'hover:shadow-elevated hover:border-slate-300 hover:-translate-y-0.5',
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={clsx('pb-4 mb-4 border-b border-slate-100', className)}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <h3 className={clsx('text-lg font-bold text-slate-900 tracking-tight', className)}>{children}</h3>;
};

export const CardDescription = ({ children, className = '' }) => {
  return <p className={clsx('text-sm text-slate-500 mt-1', className)}>{children}</p>;
};

export default Card;
