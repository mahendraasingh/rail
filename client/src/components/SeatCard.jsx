import React from 'react';
import { formatBerthName } from '../utils/formatters';
import { Users, AlertCircle, Sparkles, User } from 'lucide-react';
import clsx from 'clsx';

export const SeatCard = ({
  seat,
  isSelected = false,
  onClick,
  showPassengerName = true,
}) => {
  const { seatNumber, berthType, occupant, category, isGroup, isSeparated, isRecommended } = seat;

  // Short Berth code
  const berthShort = {
    LOWER: 'LB',
    MIDDLE: 'MB',
    UPPER: 'UB',
    SIDE_LOWER: 'SL',
    SIDE_UPPER: 'SU',
    WINDOW: 'W',
    AISLE: 'A',
  }[berthType] || 'B';

  const categoryStyles = {
    GROUP: 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-100/70',
    SEPARATED_GROUP: 'bg-rose-50 border-rose-400 text-rose-950 hover:border-rose-600 hover:bg-rose-100 animate-pulse-subtle',
    RECOMMENDED: 'bg-amber-50 border-amber-300 text-amber-950 hover:border-amber-500 hover:bg-amber-100 ring-2 ring-amber-400/40',
    OTHER: 'bg-slate-100/90 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-200/60',
    EMPTY: 'bg-white border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50',
  };

  const badgeIcon = {
    GROUP: <Users className="w-3 h-3 text-emerald-600" />,
    SEPARATED_GROUP: <AlertCircle className="w-3 h-3 text-rose-600" />,
    RECOMMENDED: <Sparkles className="w-3 h-3 text-amber-600" />,
    OTHER: <User className="w-3 h-3 text-slate-400" />,
    EMPTY: null,
  }[category];

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(seat)}
      className={clsx(
        'relative flex flex-col justify-between p-2 rounded-xl border text-left transition-all duration-150 min-h-[64px] select-none',
        categoryStyles[category] || categoryStyles.EMPTY,
        isSelected && 'ring-2 ring-rail-600 ring-offset-2 scale-[1.02] shadow-md z-10'
      )}
    >
      {/* Top row: Seat Number & Berth Type badge */}
      <div className="flex items-center justify-between gap-1 w-full">
        <span className="font-extrabold text-sm tracking-tight">{seatNumber}</span>
        <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-black/5 uppercase">
          {berthShort}
        </span>
      </div>

      {/* Bottom row: Occupant Name / status icon */}
      <div className="mt-1 w-full">
        {occupant ? (
          <div className="flex items-center gap-1 overflow-hidden">
            {badgeIcon}
            <span className="text-[11px] font-medium truncate leading-tight">
              {showPassengerName ? occupant.name : 'Occupied'}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Available</span>
        )}
      </div>

      {/* Category indicator dot */}
      {isSeparated && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
      )}
      {isRecommended && !isSeparated && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />
      )}
    </button>
  );
};

export default SeatCard;
