import React from 'react';
import { formatDate, formatPNR } from '../utils/formatters';
import Badge from './Badge';
import {
  Train,
  MapPin,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Users,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

export const JourneySummary = ({ journey, groupSplitInfo, passengerCount = 0, recommendationCount = 0 }) => {
  if (!journey) return null;

  const isSplit = groupSplitInfo?.isSplit;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden mb-6 animate-fade-in">
      {/* Top Banner with train details */}
      <div className="train-coach-gradient p-6 sm:p-8 text-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white font-mono font-bold text-xs">
                PNR: {formatPNR(journey.pnr)}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white font-bold text-xs">
                Coach {journey.coach}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {journey.trainNumber} — {journey.trainName}
            </h1>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end gap-1 text-sm bg-black/15 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-rail-100 font-medium">
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>{formatDate(journey.journeyDate)}</span>
            </div>
            <div className="text-xs text-rail-200">Standard 3AC / Sleeper Layout</div>
          </div>
        </div>

        {/* Route Line */}
        <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-4 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
            <span className="text-base sm:text-lg">{journey.source}</span>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-white/30 relative flex items-center justify-center">
            <Train className="w-5 h-5 text-amber-300 bg-rail-800 px-0.5 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
            <span className="text-base sm:text-lg">{journey.destination}</span>
          </div>
        </div>
      </div>

      {/* Split Status & Quick Stats Bar */}
      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Indicator */}
          <div className="flex items-start gap-3">
            <div
              className={clsx(
                'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5',
                isSplit ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              {isSplit ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Group Status</span>
                {isSplit ? (
                  <Badge variant="separated" size="sm" dot>Group Split Detected</Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>Seated Together</Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {groupSplitInfo?.statusMessage || (isSplit ? 'Group members are separated across different compartments.' : 'All members are comfortably seated together.')}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
            <div className="text-center px-3">
              <span className="text-xs text-slate-500 font-medium block">Total In Coach</span>
              <span className="text-lg font-bold text-slate-900">{passengerCount}</span>
            </div>
            <div className="text-center px-3 border-l border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Separated</span>
              <span className={clsx('text-lg font-bold', isSplit ? 'text-rose-600' : 'text-slate-900')}>
                {groupSplitInfo?.separatedCount || 0}
              </span>
            </div>
            <div className="text-center px-3 border-l border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Exchanges Available</span>
              <span className="text-lg font-bold text-amber-600">{recommendationCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneySummary;
