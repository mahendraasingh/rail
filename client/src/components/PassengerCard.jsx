import React from 'react';
import Badge from './Badge';
import { formatBerthName } from '../utils/formatters';
import { User, Users, AlertCircle, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export const PassengerCard = ({
  passenger,
  isSeparated = false,
  onActionClick,
  actionText,
}) => {
  const { name, coach, seatNumber, berthType, ageCategory, bookingStatus, groupId } = passenger;

  return (
    <div
      className={clsx(
        'p-4 rounded-2xl border transition-all duration-200 bg-white shadow-card flex items-center justify-between gap-4',
        isSeparated ? 'border-rose-300 ring-1 ring-rose-300/40 bg-rose-50/20' : 'border-slate-200/90'
      )}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={clsx(
            'w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs',
            isSeparated ? 'bg-rose-100 text-rose-700' : 'bg-rail-50 text-rail-700'
          )}
        >
          {seatNumber}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">{name}</h4>
            {groupId && (
              <Badge variant="group" size="sm">
                Group
              </Badge>
            )}
            {isSeparated && (
              <Badge variant="separated" size="sm" dot>
                Separated
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
            <span>Coach {coach}</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{formatBerthName(berthType)}</span>
            <span>•</span>
            <span>{ageCategory}</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">{bookingStatus}</span>
          </div>
        </div>
      </div>

      {actionText && onActionClick && (
        <button
          onClick={() => onActionClick(passenger)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rail-700 bg-rail-50 hover:bg-rail-100 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default PassengerCard;
