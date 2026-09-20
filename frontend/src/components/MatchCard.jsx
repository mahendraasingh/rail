import React from 'react';
import Button from './Button';
import Badge from './Badge';
import { formatBerthName } from '../utils/formatters';
import { ArrowLeftRight, Check, Sparkles, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

export const MatchCard = ({
  recommendation,
  onRequestExchange,
  isRequesting = false,
}) => {
  const { requester, target, matchScore, whyReasons, bringsCloser } = recommendation;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-elevated transition-all duration-200 p-6 flex flex-col justify-between animate-slide-up">
      <div>
        {/* Header: Potential Exchange & Score */}
        <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rail-500 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Potential Exchange
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rail-50 border border-rail-200">
            <Sparkles className="w-3.5 h-3.5 text-rail-600" />
            <span className="text-xs font-extrabold text-rail-900">
              Score: {matchScore}/100
            </span>
          </div>
        </div>

        {/* Seat Exchange Visual Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
          <div className="flex items-center justify-between gap-3">
            {/* Requester (Family Passenger) */}
            <div className="flex-1 text-center sm:text-left">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">
                Family Passenger
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5 truncate">
                {requester.name}
              </h4>
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-bold text-xs text-slate-800">
                  {requester.coach}-{requester.seatNumber}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({formatBerthName(requester.berthType)})
                </span>
              </div>
            </div>

            {/* Swap Divider Icon */}
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-rail-600 flex-shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </div>

            {/* Target Passenger */}
            <div className="flex-1 text-center sm:text-right">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                Exchange Passenger
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5 truncate">
                {target.name}
              </h4>
              <div className="mt-1 flex items-center justify-center sm:justify-end gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-bold text-xs text-slate-800">
                  {target.coach}-{target.seatNumber}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({formatBerthName(target.berthType)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Why this match? Section */}
        <div className="mb-6">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Why this match?
          </h5>
          <div className="space-y-1.5">
            {whyReasons && whyReasons.length > 0 ? (
              whyReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] mt-0.5 flex-shrink-0">
                    ✓
                  </span>
                  <span>{reason.replace(/^✓\s*/, '')}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <span className="text-emerald-600">✓</span>
                <span>Voluntary exchange reduces group span</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Button
          variant="primary"
          className="w-full justify-center"
          icon={ArrowLeftRight}
          loading={isRequesting}
          onClick={() => onRequestExchange(recommendation)}
        >
          Request Exchange
        </Button>
        <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
          Requires mutual confirmation before applying in journey state
        </p>
      </div>
    </div>
  );
};

export default MatchCard;
