import React, { useState } from 'react';
import SeatCard from './SeatCard';
import Badge from './Badge';
import { formatBerthName } from '../utils/formatters';
import {
  Train,
  Info,
  Users,
  AlertCircle,
  Sparkles,
  User,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

export const SeatMap = ({
  seatMapData,
  onSeatClick,
  selectedSeat,
  onRequestSwapWithSeat,
}) => {
  const [internalSelected, setInternalSelected] = useState(null);

  if (!seatMapData || !seatMapData.bays) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No seat map data available for this coach.
      </div>
    );
  }

  const activeSelected = selectedSeat || internalSelected;

  const handleSeatSelect = (seat) => {
    setInternalSelected(seat);
    if (onSeatClick) onSeatClick(seat);
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Seat Legend:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span className="text-slate-700 font-medium">Group Member</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            </span>
            <span className="text-rose-700 font-semibold">Separated Member</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            </span>
            <span className="text-amber-800 font-semibold">Recommended Swap</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300" />
            <span className="text-slate-600 font-medium">Other Passenger</span>
          </div>
        </div>
      </div>

      {/* Main Coach Layout Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-card">
        {/* Coach Header Indicator */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-150">
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-rail-600" />
            <h3 className="font-extrabold text-slate-900">Coach {seatMapData.coach || 'B2'} Layout</h3>
            <span className="text-xs text-slate-500 font-medium">(Standard 72-Berth 3AC/Sleeper)</span>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {seatMapData.bays.length} Compartment Bays
          </div>
        </div>

        {/* Coach Door/Vestibule Top Graphic */}
        <div className="w-full h-3 bg-slate-200 rounded-t-lg mb-4 flex items-center justify-center text-[9px] text-slate-500 uppercase tracking-widest font-bold">
          ▲ Coach Entry / Door ▲
        </div>

        {/* Bay List */}
        <div className="space-y-4">
          {seatMapData.bays.map((bay) => {
            return (
              <div
                key={bay.bayNumber}
                className={clsx(
                  'p-3.5 rounded-2xl border transition-all',
                  bay.isClusterBay
                    ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50'
                )}
              >
                {/* Bay Header */}
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                      Bay {bay.bayNumber}
                    </span>
                    {bay.isClusterBay && (
                      <Badge variant="group" size="sm">
                        Family Group Base Bay
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Seats {bay.mainCabinSeats[0]?.seatNumber} - {bay.sideCabinSeats[bay.sideCabinSeats.length - 1]?.seatNumber || bay.mainCabinSeats[bay.mainCabinSeats.length - 1]?.seatNumber}
                  </span>
                </div>

                {/* Bay Grid Layout: Main Cabin (6 berths) | Aisle | Side Cabin (2 berths) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Main Cabin (6 seats: 3 left, 3 right) */}
                  <div className="md:col-span-8 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {bay.mainCabinSeats.map((seat) => (
                      <SeatCard
                        key={seat.seatNumber}
                        seat={seat}
                        isSelected={activeSelected?.seatNumber === seat.seatNumber}
                        onClick={handleSeatSelect}
                      />
                    ))}
                  </div>

                  {/* Aisle Spacer */}
                  <div className="hidden md:flex md:col-span-1 flex-col items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest h-full py-2 border-x border-dashed border-slate-300/80">
                    <span>A</span>
                    <span>I</span>
                    <span>S</span>
                    <span>L</span>
                    <span>E</span>
                  </div>

                  {/* Side Cabin (2 seats: Side Lower, Side Upper) */}
                  <div className="md:col-span-3 grid grid-cols-2 gap-2">
                    {bay.sideCabinSeats.map((seat) => (
                      <SeatCard
                        key={seat.seatNumber}
                        seat={seat}
                        isSelected={activeSelected?.seatNumber === seat.seatNumber}
                        onClick={handleSeatSelect}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coach Door/Vestibule Bottom Graphic */}
        <div className="w-full h-3 bg-slate-200 rounded-b-lg mt-4 flex items-center justify-center text-[9px] text-slate-500 uppercase tracking-widest font-bold">
          ▼ Coach Exit / Door ▼
        </div>
      </div>

      {/* Selected Seat Inspector Drawer / Card */}
      {activeSelected && (
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl animate-slide-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black">{activeSelected.seatNumber}</span>
              <span className="text-[10px] font-bold text-amber-300 uppercase">
                {activeSelected.berthType?.replace('_', ' ')}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Bay {activeSelected.bay}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/15 font-semibold">
                  {activeSelected.category?.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-0.5">
                {activeSelected.occupant ? activeSelected.occupant.name : 'Unassigned / Available'}
              </h4>
              {activeSelected.occupant?.groupId && (
                <p className="text-xs text-emerald-300 font-medium mt-0.5">
                  Travelling with Group ({activeSelected.occupant.groupId})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeSelected.isRecommended && onRequestSwapWithSeat && (
              <button
                onClick={() => onRequestSwapWithSeat(activeSelected)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Request Exchange with this Seat
              </button>
            )}
            <button
              onClick={() => setInternalSelected(null)}
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMap;
