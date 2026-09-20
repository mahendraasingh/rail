import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { swapService } from '../services/swapService';
import { journeyService } from '../services/journeyService';
import MatchCard from '../components/MatchCard';
import Modal from '../components/Modal';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SectionLabel from '../components/Card';
import { formatBerthName } from '../utils/formatters';
import { DISCLAIMER_SHORT } from '../utils/constants';
import { useReveal } from '../lib/motion';
import {
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Route,
} from 'lucide-react';
import clsx from 'clsx';

export const Matches = () => {
  const routeParams = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Journey id can come from /journey/:id/recommendations or /matches?journey=...
  const journeyId =
    routeParams.id || new URLSearchParams(location.search).get('journey') || '';

  const [matchesData, setMatchesData] = useState(null);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(!!journeyId);
  const [error, setError] = useState('');

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const listRef = useReveal({ selector: '[data-match]' });

  useEffect(() => {
    let cancelled = false;
    if (!journeyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      journeyService.getJourneyById(journeyId).catch(() => null),
      swapService.getJourneyMatches(journeyId),
    ])
      .then(([j, m]) => {
        if (cancelled) return;
        setJourney(j?.journey || null);
        setMatchesData(m);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to fetch matches');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [journeyId]);

  const handleOpenModal = (rec) => {
    setSelectedMatch(rec);
    setRequestSuccess(false);
    setModalOpen(true);
  };

  const handleSendSwap = async () => {
    if (!selectedMatch) return;
    setRequestLoading(true);
    try {
      await swapService.createSwapRequest({
        journeyId,
        requesterPassengerId: selectedMatch.requester.id,
        targetPassengerId: selectedMatch.target.id,
        matchScore: selectedMatch.matchScore,
        reason: 'Travelling with group members and looking to sit closer together.',
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        navigate('/requests');
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to send exchange request');
    } finally {
      setRequestLoading(false);
    }
  };

  if (!journeyId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={Route}
          title="Select a journey first"
          description="Open a journey from the Dashboard or use the journey selector to browse its potential matches."
          actionText="Go to Dashboard"
          onAction={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Computing transparent compatibility matches…" className="min-h-[50vh]" />;
  }

  if (error || !matchesData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-crimson-700 bg-crimson-50 border border-crimson-200 rounded-xl p-4 inline-block">
          {error || 'Matches unavailable'}
        </p>
        <div>
          <Link to={`/journey/${journeyId}`}><Button variant="primary">Return to Journey</Button></Link>
        </div>
      </div>
    );
  }

  const { recommendations = [], groupSplitInfo } = matchesData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-muted font-semibold mb-1">
            <Link to={`/journey/${journeyId}`} className="hover:text-crimson-700 transition-colors">
              {journey?.trainNumber} {journey?.trainName}
            </Link>
            <span>/</span>
            <span className="text-ink">Matches</span>
          </div>
          <span className="platform-label">MATCHES</span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink mt-1">
            POTENTIAL MATCHES
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">
            Compatible passengers identified for voluntary seat coordination.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/85 border border-line-strong rounded-full px-4 py-2 shadow-subtle">
          <Sparkles className="w-4 h-4 text-saffron-600" />
          <span className="text-xs font-bold font-mono text-ink">{recommendations.length} OPPORTUNITIES</span>
        </div>
      </div>

      {/* Split notice */}
      {groupSplitInfo?.isSplit && (
        <div className="p-4 rounded-2xl bg-saffron-50 border border-saffron-200 flex items-start gap-3 text-xs text-saffron-900">
          <Sparkles className="w-4 h-4 text-saffron-600 flex-shrink-0 mt-0.5" />
          <p><span className="font-bold">Group split detected:</span> {groupSplitInfo.statusMessage}</p>
        </div>
      )}

      {/* Matches grid */}
      {recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No voluntary exchanges found"
          description="No suitable exchange match exists right now with the current passenger distribution."
          actionText="View Coach Seat Map"
          onAction={() => navigate(`/journey/${journeyId}/seats`)}
        />
      ) : (
        <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {recommendations.map((rec) => (
            <div data-match key={rec.id} className="h-full">
              <MatchCard recommendation={rec} onRequestExchange={handleOpenModal} />
            </div>
          ))}
        </div>
      )}

      {/* Policy footer */}
      <div className="p-4 rounded-2xl bg-white/80 border border-line flex items-center gap-3 text-xs text-ink-muted">
        <ShieldCheck className="w-4 h-4 text-steel-500 flex-shrink-0" />
        <span>{DISCLAIMER_SHORT}</span>
      </div>

      {/* Split-screen comparison + consent modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Potential Exchange"
        subtitle="Review the comparison, then request passenger consent"
        maxWidth="max-w-2xl"
      >
        {selectedMatch && (
          <div className="space-y-5">
            {requestSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-steel-100 border border-steel-300 text-steel-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-display font-semibold text-lg text-ink">Request Sent</h4>
                <p className="text-xs text-ink-muted">
                  Status is now <strong className="text-ink">PENDING</strong>. The passenger must explicitly accept
                  before anything changes.
                </p>
              </div>
            ) : (
              <>
                {/* Split-screen comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                  {/* Your group */}
                  <div className="bg-ivory/80 border border-line rounded-2xl p-4">
                    <span className="platform-label !text-[9px]">Your Group</span>
                    <h5 className="font-display font-semibold text-sm text-ink mt-1">{selectedMatch.requester.name}</h5>
                    <p className="font-mono font-bold text-2xl text-crimson-700 mt-2">
                      {selectedMatch.requester.coach}-{selectedMatch.requester.seatNumber}
                    </p>
                    <p className="text-[11px] text-ink-muted font-medium">
                      Seats in group:{' '}
                      <span className="font-mono font-bold text-ink">
                        {selectedMatch.requester.groupSeatNumbers?.join(' · ') || selectedMatch.requester.seatNumber}
                      </span>
                    </p>
                  </div>

                  {/* Connection */}
                  <div className="flex sm:flex-col items-center justify-center gap-2 px-1">
                    <span className="sm:w-[2px] sm:h-4 sm:bg-line-strong rounded-full hidden sm:block" />
                    <span className="w-11 h-11 rounded-full bg-white border border-line-strong shadow-subtle flex items-center justify-center text-crimson-600">
                      <ArrowLeftRight className="w-4 h-4" />
                    </span>
                    <span className="platform-label !text-[8px] text-center">POTENTIAL<br />EXCHANGE</span>
                    <span className="sm:w-[2px] sm:h-4 sm:bg-line-strong rounded-full hidden sm:block" />
                  </div>

                  {/* Potential passenger */}
                  <div className="bg-saffron-50/70 border border-saffron-200 rounded-2xl p-4">
                    <span className="platform-label !text-[9px] !text-saffron-800">Potential Passenger</span>
                    <h5 className="font-display font-semibold text-sm text-ink mt-1">{selectedMatch.target.name}</h5>
                    <p className="font-mono font-bold text-2xl text-saffron-800 mt-2">
                      {selectedMatch.target.coach}-{selectedMatch.target.seatNumber}
                    </p>
                    <p className="text-[11px] text-saffron-800/80 font-medium">
                      {formatBerthName(selectedMatch.target.berthType)}
                    </p>
                  </div>
                </div>

                {/* Compatibility list */}
                <div className="bg-ivory/60 rounded-2xl border border-line p-4">
                  <span className="platform-label !text-[9px]">Compatibility</span>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(selectedMatch.whyReasons?.length
                      ? selectedMatch.whyReasons
                      : ['Reduces group span']
                    ).map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-ink-soft font-medium">
                        <span className="text-steel-700 mt-0.5">✓</span>
                        <span>{r.replace(/^✓\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consent notice */}
                <div className="p-4 rounded-2xl bg-ink text-ivory text-xs leading-relaxed flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-saffron-300 flex-shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold">Request passenger consent.</span> Nothing changes until{' '}
                    <span className="font-semibold text-saffron-300">{selectedMatch.target.name}</span> explicitly
                    accepts this voluntary request.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button variant="ghost" size="md" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" size="md" icon={ArrowLeftRight} loading={requestLoading} onClick={handleSendSwap}>
                    Request Passenger Consent
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Matches;
