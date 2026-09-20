import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { journeyService } from '../services/journeyService';
import { swapService } from '../services/swapService';
import SeatMap from '../components/SeatMap';
import Sidebar from '../components/Sidebar';
import MatchCard from '../components/MatchCard';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatBerthName, formatDate } from '../utils/formatters';
import { DISCLAIMER_SHORT } from '../utils/constants';
import {
  Train,
  Sparkles,
  ArrowLeftRight,
  Info,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const SeatMapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seatData, setSeatData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Swap Request Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const fetchSeatMapData = async () => {
    try {
      setLoading(true);
      const sMap = await journeyService.getSeatMap(id);
      setSeatData(sMap);

      const mData = await swapService.getJourneyMatches(id);
      setMatches(mData.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to load seat map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatMapData();
  }, [id]);

  const handleOpenSwapModal = (recommendation) => {
    setSelectedMatch(recommendation);
    setRequestSuccess(false);
    setModalOpen(true);
  };

  const handleSendSwapRequest = async () => {
    if (!selectedMatch) return;
    setRequestLoading(true);
    try {
      await swapService.createSwapRequest({
        journeyId: id,
        requesterPassengerId: selectedMatch.requester.id,
        targetPassengerId: selectedMatch.target.id,
        matchScore: selectedMatch.matchScore,
        reason: 'Travelling with family group and looking to sit together.',
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        navigate('/swaps');
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to send swap request');
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Rendering interactive coach seat map..." className="min-h-[60vh]" />;
  }

  if (error || !seatData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-sm max-w-md mx-auto mb-4">
          {error || 'Seat map data not found'}
        </div>
        <Link to={`/journey/${id}`}>
          <Button variant="primary">Return to Journey</Button>
        </Link>
      </div>
    );
  }

  const { journey, seatMap, groupSplitInfo } = seatData;
  const isSplit = groupSplitInfo?.isSplit;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <Link to={`/journey/${id}`} className="hover:text-rail-600 transition-colors">
              {journey.trainNumber} {journey.trainName}
            </Link>
            <span>/</span>
            <span className="text-slate-800">Seat Map</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Coach {journey.coach} Interactive Seat Map
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/journey/${id}/recommendations`}>
            <Button variant="primary" size="sm" icon={Sparkles}>
              View {matches.length} Matches
            </Button>
          </Link>
        </div>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Interactive Coach Seat Map */}
        <div className="lg:col-span-8 space-y-6">
          <SeatMap
            seatMapData={seatMap}
            onRequestSwapWithSeat={(seat) => {
              const matchedRec = matches.find((m) => m.target.seatNumber === seat.seatNumber);
              if (matchedRec) {
                handleOpenSwapModal(matchedRec);
              } else {
                navigate(`/journey/${id}/recommendations`);
              }
            }}
          />
        </div>

        {/* RIGHT COLUMN: Journey summary & Top Recommendations */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Journey Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Journey Info
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {formatDate(journey.journeyDate)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Train:</span>
                <span className="font-bold text-slate-900">{journey.trainNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                  {journey.source} → {journey.destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coach:</span>
                <span className="font-bold text-rail-700">{journey.coach}</span>
              </div>
            </div>

            {/* Split Status */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {isSplit ? (
                  <Badge variant="separated" size="sm" dot>Group Split</Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>Group Together</Badge>
                )}
                <span className="text-xs text-slate-600 font-medium">
                  {groupSplitInfo.separatedCount || 0} member(s) separated
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Match Recommendations Sidebar List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Top Exchange Matches</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">{matches.length} found</span>
            </div>

            {matches.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No voluntary exchange matches found for this coach at the moment.
              </div>
            ) : (
              matches.slice(0, 2).map((rec) => (
                <MatchCard
                  key={rec.id}
                  recommendation={rec}
                  onRequestExchange={handleOpenSwapModal}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Voluntary Swap Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request Voluntary Seat Exchange"
        subtitle="Consent-based mutual exchange coordinator"
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
                  Status is now <strong>PENDING</strong>. The other passenger will receive a notification to accept or decline.
                </p>
              </div>
            ) : (
              <>
                {/* Visual Exchange Preview Box */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Your Group Passenger</span>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedMatch.requester.name}</h5>
                    <p className="text-xs font-bold text-rail-700 mt-0.5">
                      Seat {selectedMatch.requester.coach}-{selectedMatch.requester.seatNumber} ({formatBerthName(selectedMatch.requester.berthType)})
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-rail-600">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Target Passenger</span>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedMatch.target.name}</h5>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      Seat {selectedMatch.target.coach}-{selectedMatch.target.seatNumber} ({formatBerthName(selectedMatch.target.berthType)})
                    </p>
                  </div>
                </div>

                {/* Voluntary Notice & Policy */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <strong className="block font-bold">Voluntary Exchange Policy:</strong>
                  <p className="leading-relaxed text-amber-800">
                    This request is completely voluntary. The other passenger must accept it before the exchange is confirmed within this application.
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
                    onClick={handleSendSwapRequest}
                  >
                    Send Exchange Request
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

export default SeatMapPage;
