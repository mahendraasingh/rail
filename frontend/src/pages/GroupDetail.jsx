import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { journeyService } from '../services/journeyService';
import { swapService } from '../services/swapService';
import CoachViz from '../components/CoachViz';
import RouteMap from '../components/RouteMap';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionLabel from '../components/Card';
import { getSeparatedSeatNumbers, buildSeatClusters } from '../utils/groupUtils';
import { formatBerthName, formatDate } from '../utils/formatters';
import { TrainGlyph } from '../components/LoadingScreen';
import { ArrowLeft, Sparkles, Grid, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export const GroupDetail = () => {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigateSafe();

  const passedGroup = location.state?.group;
  const journeyId = passedGroup?.journeyId || groupId?.split('::')?.[0];
  const groupName = passedGroup?.name || groupId?.split('::')?.[1] || 'Group';

  const [detail, setDetail] = useState(null);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(!passedGroup);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!journeyId) return;
    setLoading(true);
    Promise.all([
      journeyService.getJourneyById(journeyId),
      swapService.getJourneyMatches(journeyId).catch(() => null),
    ])
      .then(([d, m]) => {
        if (cancelled) return;
        setDetail(d);
        setMatchCount((m?.recommendations || []).length);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load group');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [journeyId]);

  const group = useMemo(() => {
    if (!detail?.passengers) return passedGroup || null;
    const members = detail.passengers.filter((p) => p.groupId === groupName);
    if (!members.length) return passedGroup || null;
    const perList = (detail.groupSplitInfo?.perGroup || []).concat(
      detail.groupSplitInfo?.groupId === groupName ? [detail.groupSplitInfo] : []
    );
    const splitInfo = perList.find((g) => g.groupId === groupName) || null;
    return { groupId: groupName, name: groupName, passengers: members, coach: members[0]?.coach, splitInfo };
  }, [detail, groupName, passedGroup]);

  // Focused seats = group's seats; clusters = spatially-grouped separated seats
  const focusSeats = (group?.passengers || []).map((p) => p.seatNumber);
  const separatedSeatNumbers = getSeparatedSeatNumbers(group);
  const clusters = buildSeatClusters(separatedSeatNumbers);

  if (!journeyId) return <Navigate to="/groups" replace />;
  if (loading) return <LoadingSpinner text="Loading group coordination…" className="min-h-[50vh]" />;
  if (error || !group) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-crimson-700 bg-crimson-50 border border-crimson-200 rounded-xl p-4">{error || 'Group not found'}</p>
        <Link to="/groups"><Button variant="primary">Back to Groups</Button></Link>
      </div>
    );
  }

  const journey = detail?.journey;
  const isSplit = group.splitInfo?.isSplit;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back */}
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-crimson-700 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All Groups
      </Link>

      {/* Ticket-style header */}
      <div className="bg-white rounded-3xl border border-line shadow-ticket overflow-hidden">
        <div className="paper-texture px-6 sm:px-8 pt-6 pb-5 border-b border-dashed border-line-strong">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="platform-label">GROUP · {formatPNRSafe(groupName)}</span>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink mt-1">
                {group.name}
              </h1>
              <p className="platform-label !text-[9px] mt-1.5">
                {(group.passengers || []).length} PASSENGERS · JOURNEY {journey?.trainNumber} · {formatDate(journey?.journeyDate)}
              </p>
            </div>
            {isSplit ? (
              <Badge variant="separated" size="lg" dot>SEATS SEPARATED</Badge>
            ) : (
              <Badge variant="success" size="lg" dot>SEATED TOGETHER</Badge>
            )}
          </div>

          {/* Journey timeline */}
          <div className="mt-6">
            <RouteMap
              source={journey?.source}
              destination={journey?.destination}
              stops={[]}
            />
          </div>
        </div>

        {/* Details strip */}
        <div className="px-6 sm:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/85">
          <div>
            <span className="platform-label !text-[9px] block">Train</span>
            <span className="text-sm font-bold text-ink">{journey?.trainNumber} · {journey?.trainName}</span>
          </div>
          <div>
            <span className="platform-label !text-[9px] block">Coach</span>
            <span className="font-mono font-bold text-sm text-ink">{group.coach || journey?.coach}</span>
          </div>
          <div>
            <span className="platform-label !text-[9px] block">Seats</span>
            <span className="font-mono font-bold text-sm text-ink">
              {(group.passengers || []).map((p) => p.seatNumber).sort((a, b) => a - b).join(' · ')}
            </span>
          </div>
          <div>
            <span className="platform-label !text-[9px] block">Status</span>
            <span className={clsx('text-sm font-bold', isSplit ? 'text-ink' : 'text-steel-700')}>
              {isSplit ? 'SEPARATED' : 'TOGETHER'}
            </span>
          </div>
        </div>
      </div>

      {/* Coach viz + coordination panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <SectionLabel className="mb-3">COACH {group.coach || journey?.coach} · GROUP SEATS</SectionLabel>
          {detail?.seatMapData ? (
            <CoachViz
              bays={detail.seatMapData.bays}
              coach={group.coach || journey?.coach}
              focusSeats={focusSeats}
              clusters={clusters}
              onSeatClick={() => navigate(`/journey/${journeyId}/seats`)}
            />
          ) : (
            <div className="bg-white/80 border border-dashed border-line-strong rounded-2xl p-8 text-center text-sm text-ink-muted">
              Coach layout unavailable.
            </div>
          )}

          {/* Passengers list */}
          <div className="mt-6">
            <SectionLabel className="mb-3">PASSENGERS</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(group.passengers || []).map((p) => {
                const isSeparated = (group.splitInfo?.separatedPassengerIds || []).map(String).includes(String(p._id || p.id));
                return (
                  <div
                    key={p._id || p.id}
                    className={clsx(
                      'bg-white rounded-2xl border p-4 shadow-card flex items-center justify-between gap-3',
                      isSeparated ? 'border-ink/70' : 'border-line'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        'w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm border',
                        isSeparated ? 'bg-ink text-saffron-300 border-ink' : 'bg-crimson-50 text-crimson-700 border-crimson-200'
                      )}>
                        {p.seatNumber}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-ink">{p.name}</h4>
                        <p className="text-[11px] text-ink-muted font-medium">
                          {formatBerthName(p.berthType)} · {p.ageCategory} · {p.bookingStatus}
                        </p>
                      </div>
                    </div>
                    {isSeparated && (
                      <span className="text-[9px] font-bold tracking-widest2 text-saffron-800 bg-saffron-50 border border-saffron-300 rounded-full px-2 py-0.5">
                        SEPARATED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coordination panel */}
        <div className="lg:col-span-4 space-y-4">
          <SectionLabel className="mb-3">COORDINATION</SectionLabel>
          <div className="bg-white rounded-2xl border border-line shadow-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              {isSplit ? (
                <span className="w-10 h-10 rounded-xl bg-ivory-deep border border-ink/70 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-saffron-600" />
                </span>
              ) : (
                <span className="w-10 h-10 rounded-xl bg-steel-50 border border-steel-300 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-steel-700" />
                </span>
              )}
              <div>
                <span className="platform-label !text-[9px] block">Current status</span>
                <span className="text-sm font-bold text-ink">{isSplit ? 'SEATS SEPARATED' : 'SEATED TOGETHER'}</span>
              </div>
            </div>

            <div className="metallic-rule" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted font-medium">Potential matches</span>
              <span className="font-mono font-bold text-saffron-700">{isSplit ? matchCount : 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted font-medium">Separated clusters</span>
              <span className="font-mono font-bold text-ink">{clusters.length || 0}</span>
            </div>

            <div className="pt-2 space-y-2.5">
              <Link to={`/journey/${journeyId}/recommendations`} className="block">
                <Button variant="primary" className="w-full justify-center" icon={Sparkles}>
                  View Matches
                </Button>
              </Link>
              <Link to={`/journey/${journeyId}/seats`} className="block">
                <Button variant="outline" className="w-full justify-center" icon={Grid}>
                  Open Seat Map
                </Button>
              </Link>
            </div>

            <p className="text-[10px] text-ink-faint leading-relaxed">
              Matches are suggestions only. Every exchange requires the other passenger's explicit consent.
            </p>
          </div>

          {/* Journey link card */}
          <Link
            to={`/journey/${journeyId}`}
            className="block bg-ink text-ivory rounded-2xl p-5 hover:bg-ink-soft transition-colors group"
          >
            <TrainGlyph className="w-5 h-5 text-saffron-300 mb-2" />
            <span className="platform-label !text-[9px] !text-ivory/60">FULL JOURNEY VIEW</span>
            <p className="font-display font-semibold text-sm mt-0.5">{journey?.trainNumber} · {journey?.trainName}</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

// helpers
const formatPNRSafe = (s) => (s ? String(s).slice(0, 18) : '—');

export default GroupDetail;
