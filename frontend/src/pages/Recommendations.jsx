import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { swapService } from '../services/swapService';
import { journeyService } from '../services/journeyService';
import Sidebar from '../components/Sidebar';
import MatchCard from '../components/MatchCard';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatBerthName } from '../utils/formatters';
import { DISCLAIMER_SHORT } from '../utils/constants';
import {
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';

export const Recommendations = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [matchesData, setMatchesData] = useState(null);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const jData = await journeyService.getJourneyById(id);
      setJourney(jData.journey);

      const mData = await swapService.getJourneyMatches(id);
      setMatchesData(mData);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [id]);

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
        journeyId: id,
        requesterPassengerId: selectedMatch.requester.id,
        targetPassengerId: selectedMatch.target.id,
        matchScore: selectedMatch.matchScore,
        reason: 'Travelling with group members and looking to sit closer together.',
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        navigate('/swaps');
      }, 1400);
    } catch (err) {
      alert(err.message || 'Failed to send exchange request');
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Computing deterministic compatibility matches..." className="min-h-[60vh]" />;
  }

  if (error || !matchesData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-sm max-w-md mx-auto mb-4">
          {error || 'Recommendations unavailable'}
        </div>
        <Link to={`/journey/${id}`}>
          <Button variant="primary">Return to Journey</Button>
        </Link>
      </div>
    );
  }

  const { recommendations = [], groupSplitInfo } = matchesData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <Link to={`/journey/${id}`} className="hover:text-rail-600 transition-colors">
              {journey?.trainNumber} {journey?.trainName}
            </Link>
            <span>/</span>
            <span className="text-slate-800">Recommendations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Possible Seat Exchanges
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ranked opportunities to sit closer to your group using transparent compatibility scoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            <Sparkles className="w-3.5 h-3.5 text-rail-600" />
            <span>{recommendations.length} Match Opportunities</span>
          </Badge>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <Sidebar journeyId={id} />

        {/* Main Matches Grid */}
        <div className="flex-1 space-y-6">
          {/* Split Status Alert */}
          {groupSplitInfo?.isSplit && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Group Split Detected:</strong>
                <span>{groupSplitInfo.statusMessage}</span>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {recommendations.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No voluntary exchanges found"
              description="No suitable exchange match was found at the moment with current passenger distribution. Check back as new fellow passengers register."
              actionText="View Coach Seat Map"
              onAction={() => navigate(`/journey/${id}/seats`)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((rec) => (
                <MatchCard
                  key={rec.id}
                  recommendation={rec}
                  onRequestExchange={handleOpenModal}
                />
              ))}
            </div>
          )}

          {/* Policy Footer */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center gap-3 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{DISCLAIMER_SHORT}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Seat Exchange Request"
        subtitle="Voluntary Passenger Coordination"
      >
        {selectedMatch && (
          <div className="space-y-5">
            {requestSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Exchange Request Sent!</h4>
                <p className="text-xs text-slate-500">
                  Status is now <strong>PENDING</strong>. The passenger has been notified.
                </p>
              </div>
            ) : (
              <>
                {/* Visual Exchange Box */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Your Group Passenger</span>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedMatch.requester.name}</h5>
                    <p className="text-xs font-bold text-rail-700 mt-0.5">
                      Current: {selectedMatch.requester.coach}-{selectedMatch.requester.seatNumber} ({formatBerthName(selectedMatch.requester.berthType)})
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-rail-600">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Target Passenger</span>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedMatch.target.name}</h5>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      Requested: {selectedMatch.target.coach}-{selectedMatch.target.seatNumber} ({formatBerthName(selectedMatch.target.berthType)})
                    </p>
                  </div>
                </div>

                {/* Voluntary Notice & Policy */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <strong className="block font-bold">Voluntary Consent Notice:</strong>
                  <p className="leading-relaxed text-amber-800">
                    This request is voluntary. The other passenger must accept it before the exchange is confirmed within this application.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button variant="ghost" size="md" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={ArrowLeftRight}
                    loading={requestLoading}
                    onClick={handleSendSwap}
                  >
                    Send Request
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

export default Recommendations;
