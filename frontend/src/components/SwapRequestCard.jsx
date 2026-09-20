import React from 'react';
import Button from './Button';
import Badge from './Badge';
import { formatBerthName, formatDate } from '../utils/formatters';
import { DISCLAIMER_SHORT } from '../utils/constants';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

export const SwapRequestCard = ({
  swap,
  onAccept,
  onReject,
  onCancel,
  isTargetView = false,
  isProcessing = false,
}) => {
  const {
    _id,
    requesterSeat,
    targetSeat,
    reason,
    matchScore,
    status,
    createdAt,
    requesterPassengerId,
    targetPassengerId,
    requesterPassenger,
    targetPassenger,
  } = swap;

  const requesterName = requesterPassenger?.name || requesterPassengerId?.name || 'Requester Passenger';
  const targetName = targetPassenger?.name || targetPassengerId?.name || 'Target Passenger';

  const statusVariants = {
    PENDING: { badge: 'warning', label: 'Pending Response', icon: Clock },
    ACCEPTED: { badge: 'success', label: 'Exchange Confirmed', icon: CheckCircle2 },
    REJECTED: { badge: 'danger', label: 'Declined', icon: XCircle },
    CANCELLED: { badge: 'neutral', label: 'Cancelled', icon: AlertCircle },
  };

  const currentStatus = statusVariants[status] || statusVariants.PENDING;
  const StatusIcon = currentStatus.icon;

  return (
    <div
      className={clsx(
        'bg-white rounded-3xl border shadow-card p-5 sm:p-6 transition-all duration-200 animate-slide-up',
        status === 'ACCEPTED'
          ? 'border-emerald-300 bg-emerald-50/10'
          : status === 'PENDING'
          ? 'border-slate-200'
          : 'border-slate-200 opacity-90'
      )}
    >
      {/* Top row: Status Badge & Date */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Badge variant={currentStatus.badge} size="md" dot>
            {currentStatus.label}
          </Badge>
          {matchScore && (
            <span className="text-xs font-semibold text-slate-500">
              Match Score: {matchScore}%
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Seat Exchange Visualization */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-3">
          {/* Requester Passenger Side */}
          <div className="sm:col-span-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              From Passenger
            </span>
            <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{requesterName}</h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-bold text-xs text-slate-800">
                {requesterSeat.coach}-{requesterSeat.seatNumber}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {formatBerthName(requesterSeat.berthType)}
              </span>
            </div>
          </div>

          {/* Central Arrow */}
          <div className="sm:col-span-1 flex justify-center py-1 sm:py-0">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-rail-600 shadow-2xs">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Target Passenger Side */}
          <div className="sm:col-span-3 text-left sm:text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Exchange With
            </span>
            <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{targetName}</h4>
            <div className="mt-1 flex items-center justify-start sm:justify-end gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-bold text-xs text-slate-800">
                {targetSeat.coach}-{targetSeat.seatNumber}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {formatBerthName(targetSeat.berthType)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reason statement */}
      {reason && (
        <div className="mb-4 text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-600">
          <span className="font-bold text-slate-700">Reason: </span>
          <span>{reason}</span>
        </div>
      )}

      {/* Accepted Confirmation State Message */}
      {status === 'ACCEPTED' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs mb-4 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Voluntary Agreement Active</span>
          </div>
          <p className="text-emerald-700 leading-relaxed">
            Both passengers have mutually consented to this exchange. Seating arrangements have been rearranged in your journey plan.
          </p>
        </div>
      )}

      {/* Action Buttons for Pending State */}
      {status === 'PENDING' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
          {isTargetView ? (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={X}
                disabled={isProcessing}
                onClick={() => onReject && onReject(_id)}
              >
                Reject Request
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={Check}
                loading={isProcessing}
                onClick={() => onAccept && onAccept(_id)}
              >
                Accept Exchange
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={X}
              disabled={isProcessing}
              onClick={() => onCancel && onCancel(_id)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              Cancel Request
            </Button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-3 text-[10px] text-slate-400 italic">
        * {DISCLAIMER_SHORT}
      </div>
    </div>
  );
};

export default SwapRequestCard;
