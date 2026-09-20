import React, { useEffect, useMemo, useState } from 'react';
import { useJourneys } from '../context/JourneyContext';
import { journeyService } from '../services/journeyService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SectionLabel from '../components/Card';
import GroupTicket from '../components/GroupTicket';
import { extractGroups } from '../utils/groupUtils';
import { useReveal } from '../lib/motion';
import { Users } from 'lucide-react';
import clsx from 'clsx';

export const Groups = () => {
  const { journeys } = useJourneys();
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | SEPARATED | TOGETHER

  const listRef = useReveal({ selector: '[data-ticket]' });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const targets = journeys.slice(0, 12); // keep it fast: first 12 journeys
      const results = await Promise.allSettled(
        targets.map((j) => journeyService.getJourneyById(j._id || j.id))
      );
      if (cancelled) return;
      const map = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') map[targets[i]._id || targets[i].id] = r.value;
      });
      setDetails(map);
      setLoading(false);
    };
    if (journeys.length) load();
    else setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [journeys]);

  const groups = useMemo(() => {
    const out = [];
    journeys.forEach((j) => {
      const jId = j._id || j.id;
      const d = details[jId];
      if (!d?.passengers) return;
      extractGroups(d).forEach((g) => {
        out.push({
          ...g,
          groupId: `${jId}::${g.groupId}`,
          journeyId: jId,
          journey: j,
        });
      });
    });
    return out;
  }, [journeys, details]);

  const filtered = groups.filter((g) => {
    if (filter === 'SEPARATED') return g.splitInfo?.isSplit;
    if (filter === 'TOGETHER') return !g.splitInfo?.isSplit;
    return true;
  });

  if (loading) return <LoadingSpinner text="Collecting your travel groups…" className="min-h-[50vh]" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <span className="platform-label">GROUPS</span>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink mt-1">
          YOUR TRAVEL GROUPS
        </h1>
        <p className="text-sm text-ink-muted mt-2">
          Families and parties travelling on the loaded dataset journeys — together or separated.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        {[
          { key: 'ALL', label: `All (${groups.length})` },
          { key: 'SEPARATED', label: `Separated (${groups.filter((g) => g.splitInfo?.isSplit).length})` },
          { key: 'TOGETHER', label: `Together (${groups.filter((g) => !g.splitInfo?.isSplit).length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              filter === t.key
                ? 'bg-ink text-ivory'
                : 'text-ink-soft hover:bg-ivory-deep'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ticket grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups found"
          description="No group bookings match this filter on the currently loaded journeys."
        />
      ) : (
        <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.slice(0, 24).map((g, i) => (
            <div data-ticket key={g.groupId} className="h-full">
              <GroupTicket group={g} journey={g.journey} index={i} />
            </div>
          ))}
        </div>
      )}

      {groups.length > 24 && (
        <p className="text-[11px] text-ink-faint text-center">
          Showing 24 of {groups.length} groups
        </p>
      )}
    </div>
  );
};

export default Groups;
