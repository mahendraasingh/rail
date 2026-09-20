import React from 'react';
import { Button } from './Button';
import { Train, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export const EmptyState = ({
  icon: Icon = Train,
  title = 'No records found',
  description = 'There is currently no data to display.',
  actionText,
  onAction,
  actionIcon = ArrowRight,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 animate-fade-in',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} icon={actionIcon} iconPosition="right">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
