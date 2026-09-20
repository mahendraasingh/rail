import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Badge from './Badge';
import { formatBerthName } from '../utils/formatters';
import { Users, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Railway-ticket-inspired group card.
 * Variant 'ticket' = full ticket card; 'mini' = compact list row (group status panel).
 */
export const GroupTicket = ({
  group,
  journey,
  variant = 'ticket',
  index = 0,
}) => {
  const seats = (group.passengers || []).map((p) => p.seatNumber).sort((a, b) => a - b);
  const isSplit = group.splitInfo?.isSplit;
  const serial = `RS-${String(index + 1).padStart(4, '0')}`;

  if (variant === 'mini') {
    return (
      <Link
        to={`/groups/${group.groupId || index}`}
        state={{ group }}
        className="block bg-white/85 border border-line rounded-2xl p-4 shadow-card hover:shadow-elevated hover:border-line-strong transition-all duration-200 group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-sm text-ink truncate">{group.name}</h4>
              {isSplit ? (
                <Badge variant="separated" size="sm" dot>SEPARATED</Badge>
              ) : (
                <Badge variant="success" size="sm" dot>TOGETHER</Badge>
              )}
            </div>
            <p className="text-[11px] text-ink-muted font-mono mt-1 truncate">
              Coach {group.coach || journey?.coach} · Seats {seats.join(' · ') || '—'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-faint group-hover:translate-x-0.5 group-hover:text-crimson-600 transition-all flex-shrink-0" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/groups/${group.groupId || index}`}
      state={{ group }}
      className="block bg-white rounded-2xl border border-line shadow-ticket hover:shadow-elevated hover:border-line-strong transition-all duration-200 overflow-hidden group"
    >
      {/* Ticket head — journey line */}
      <div className="paper-texture px-5 pt-4 pb-3 border-b border-dashed border-line-strong">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="platform-label !text-[9px]">PNR {journey?.pnr || '·····'}</span>
              <span className="platform-label !text-[9px]">COACH {group.coach || journey?.coach}</span>
            </div>
            <h3 className="font-display font-semibold text-lg text-ink mt-0.5">{group.name}</h3>
          </div>
          <span className="font-mono text-[10px] text-ink-faint border border-line-strong rounded px-1.5 py-0.5">
            {serial}
          </span>
        </div>

        {/* Route row */}
        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="truncate">{journey?.source}</span>
          <span className="flex-1 h-[2px] bg-line-strong rounded-full relative">
            <span className="absolute inset-y-0 left-0 w-1/3 bg-crimson-500/40 rounded-full" />
          </span>
          <span className="truncate">{journey?.destination}</span>
        </div>
      </div>

      {/* Perforation */}
      <div className="relative px-5">
        <div className="perforation" />
        <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-ivory border border-line" />
        <span className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-ivory border border-line" />
      </div>

      {/* Ticket stub — passengers & status */}
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
            <Users className="w-3.5 h-3.5 text-steel-500" />
            <span>{(group.passengers || []).length} passengers</span>
            <span className="text-ink-faint">·</span>
            <span className="font-mono text-[11px] truncate">Seats {seats.join(' · ') || '—'}</span>
          </div>
        </div>

        {isSplit ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink bg-ivory-deep border border-ink/80 rounded-full px-3 py-1.5 flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-saffron-400" />
            SEPARATED
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel-800 bg-steel-50 border border-steel-300 rounded-full px-3 py-1.5 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            TOGETHER
          </span>
        )}
      </div>
    </Link>
  );
};

export default GroupTicket;
