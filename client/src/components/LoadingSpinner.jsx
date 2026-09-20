import React from 'react';
import { Loader2, Train } from 'lucide-react';
import clsx from 'clsx';

export const LoadingSpinner = ({ text = 'Loading details...', size = 'md', className = '' }) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center p-8 gap-3 animate-fade-in', className)}>
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-rail-50 flex items-center justify-center border border-rail-100 animate-pulse">
          <Train className="w-6 h-6 text-rail-600 animate-bounce" />
        </div>
        <Loader2 className="w-16 h-16 text-rail-500 animate-spin absolute -inset-2 opacity-40" />
      </div>
      {text && <p className="text-sm font-medium text-slate-600 tracking-wide">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
