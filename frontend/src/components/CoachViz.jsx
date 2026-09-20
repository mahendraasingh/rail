import React, { useMemo, useRef } from 'react';
import clsx from 'clsx';
import { useGsap, prefersReducedMotion } from '../lib/motion';
import { formatBerthName } from '../utils/formatters';

/**
 * Premium interactive coach visualization.
 * A linear bay strip (1..N) with berth blocks; separated clusters get
 * GSAP-animated connection lines and pulse highlights when a group is focused.
 *
 * Props:
 *  - bays: [{ bayNumber, mainCabinSeats: [seat...], sideCabinSeats: [seat...] }]
 *  - focusSeats: array of seatNumbers to highlight (e.g. the selected group's seats)
 *  - clusters: array of arrays of seatNumbers (the separated seat clusters)
 *  - onSeatClick(seat), selectedSeat, highlightedSeatNumbers (Set) for matches
 */
export const CoachViz = ({
  bays = [],
  coach = 'B2',
  focusSeats = [],
  clusters = [],
  selectedSeat,
  highlightedSeatNumbers = new Set(),
  onSeatClick,
}) => {
  const stripRef = useRef(null);
  const svgRef = useRef(null);

  const seatIndex = useMemo(() => {
    const map = new Map();
    bays.forEach((bay) => {
      [...(bay.mainCabinSeats || []), ...(bay.sideCabinSeats || [])].forEach((s) =>
        map.set(s.seatNumber, s)
      );
    });
    return map;
  }, [bays]);

  const focusSet = useMemo(() => new Set(focusSeats), [focusSeats]);
  const clusterSet = useMemo(() => {
    const s = new Set();
    (clusters || []).forEach((c) => c.forEach((n) => s.add(n)));
    return s;
  }, [clusters]);

  const focusGroups = useMemo(() => {
    // Group focused seat numbers by bay for cluster lines
    const byBay = new Map();
    focusSeats.forEach((n) => {
      const seat = seatIndex.get(n);
      if (!seat) return;
      const bayNo = seat.bay ?? seat.bayNumber;
      if (!byBay.has(bayNo)) byBay.set(bayNo, []);
      byBay.get(bayNo).push(n);
    });
    return Array.from(byBay.entries())
      .map(([bayNo, seats]) => ({ bayNo, seats: seats.sort((a, b) => a - b) }))
      .sort((a, b) => a.bayNo - b.bayNo);
  }, [focusSeats, seatIndex]);

  // Draw animated connection lines between separated clusters
  useGsap(
    (gsap) => {
      const svg = svgRef.current;
      const strip = stripRef.current;
      if (!svg || !strip || !focusGroups.length || focusGroups.length < 2) return;
      if (prefersReducedMotion()) {
        svg.innerHTML = '';
        return;
      }
      const stripRect = strip.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${stripRect.width} 60`);
      svg.innerHTML = '';

      const positions = focusGroups.map((g) => {
        const first = g.seats[0];
        const el = strip.querySelector(`[data-bay="${g.bayNo}"]`);
        const rect = el ? el.getBoundingClientRect() : null;
        return {
          x: rect ? rect.left - stripRect.left + rect.width / 2 : 20 + g.bayNo * 40,
          label: g.seats.join('·'),
        };
      });

      positions.forEach((p, i) => {
        const ns = 'http://www.w3.org/2000/svg';
        const path = document.createElementNS(ns, 'path');
        const x1 = i === 0 ? p.x : positions[i - 1].x;
        const midY = 44;
        path.setAttribute('d', `M ${x1} ${midY} C ${(x1 + p.x) / 2} ${midY - 18}, ${(x1 + p.x) / 2} ${midY - 18}, ${p.x} ${midY}`);
        path.setAttribute('stroke', '#971C26');
        path.setAttribute('stroke-width', '1.4');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '4 4');
        svg.appendChild(path);
        gsap.fromTo(
          path,
          { strokeDashoffset: 120, opacity: 0 },
          { strokeDashoffset: 0, opacity: 1, duration: 0.8, delay: 0.15 * i, ease: 'power2.out' }
        );
      });
    },
    [JSON.stringify(focusSeats), bays.length]
  );

  const seatState = (seat) => {
    if (selectedSeat && seat.seatNumber === selectedSeat.seatNumber) return 'selected';
    if (focusSet.has(seat.seatNumber)) {
      return clusterSet.has(seat.seatNumber) ? 'separated' : 'focus';
    }
    if (clusterSet.has(seat.seatNumber)) return 'separated';
    if (highlightedSeatNumbers.has(seat.seatNumber)) return 'match';
    return 'idle';
  };

  const stateStyles = {
    focus: 'bg-crimson-600 text-ivory border-crimson-700 shadow-sm',
    separated: 'bg-ink text-saffron-300 border-ink shadow-sm animate-pulse-subtle',
    match: 'bg-saffron-100 text-saffron-800 border-saffron-400',
    selected: 'bg-ink text-ivory border-ink ring-2 ring-crimson-500 ring-offset-1',
    idle: 'bg-white text-steel-600 border-line hover:border-steel-400 hover:bg-cream',
  };

  return (
    <div className="bg-white/85 border border-line rounded-2xl shadow-card p-4 sm:p-6">
      {/* Coach header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
        <div className="flex items-center gap-2.5">
          <span className="platform-label">COACH</span>
          <span className="font-mono font-bold text-sm text-ink bg-ivory-deep border border-line-strong rounded px-2 py-0.5">
            {coach}
          </span>
        </div>
        <span className="text-[11px] text-ink-faint font-medium">{bays.length} bays · 72 berths · 3AC</span>
      </div>

      {/* Vestibule strip */}
      <div className="flex items-center gap-2 mb-3">
        <span className="h-[6px] flex-1 bg-ivory-dark rounded-full border border-line" />
        <span className="platform-label !text-[9px]">COACH ENTRY</span>
        <span className="h-[6px] flex-1 bg-ivory-dark rounded-full border border-line" />
      </div>

      {/* Bay strip + cluster connection lines */}
      <div className="relative">
        <svg ref={svgRef} className="absolute -top-[52px] left-0 w-full h-[60px] pointer-events-none" aria-hidden="true" />
        <div ref={stripRef} className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            {bays.map((bay) => {
              const baySeats = [...(bay.mainCabinSeats || []), ...(bay.sideCabinSeats || [])];
              const isFocusBay = focusGroups.some((g) => g.bayNo === bay.bayNumber);
              return (
                <div
                  key={bay.bayNumber}
                  data-bay={bay.bayNumber}
                  className={clsx(
                    'flex flex-col rounded-xl border p-1.5 transition-colors',
                    isFocusBay ? 'border-crimson-400 bg-crimson-50/50' : 'border-line bg-ivory/60'
                  )}
                >
                  <span className="text-[9px] font-bold text-ink-faint text-center mb-1">B{bay.bayNumber}</span>
                  <div className="grid grid-cols-2 gap-1">
                    {baySeats.map((seat) => {
                      const st = seatState(seat);
                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          onClick={() => onSeatClick && onSeatClick(seat)}
                          title={
                            seat.occupant
                              ? `Seat ${seat.seatNumber} · ${seat.occupant.name}${seat.occupant.groupId ? ' · Group' : ''}`
                              : `Seat ${seat.seatNumber} · ${formatBerthName(seat.berthType)} · Available`
                          }
                          aria-label={`Seat ${seat.seatNumber}, ${formatBerthName(seat.berthType)}${
                            seat.occupant ? `, occupied by ${seat.occupant.name}` : ', available'
                          }${st === 'separated' ? ', separated group member' : ''}${
                            st === 'match' ? ', recommended exchange' : ''
                          }`}
                          className={clsx(
                            'w-7 h-6 rounded-[5px] border font-mono text-[9px] font-bold flex items-center justify-center transition-all duration-150 select-none',
                            stateStyles[st]
                          )}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cluster summary */}
      {clusters.length > 0 && (
        <p className="mt-3 text-xs text-ink-muted font-medium">
          {focusSeats.length || clusterSet.size} passengers ·{' '}
          <span className="text-crimson-700 font-bold">{clusters.length} separated seat cluster{clusters.length > 1 ? 's' : ''}</span>
        </p>
      )}
    </div>
  );
};

export default CoachViz;
