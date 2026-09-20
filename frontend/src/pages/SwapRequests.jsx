import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { swapService } from '../services/swapService';
import SwapRequestCard from '../components/SwapRequestCard';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { DISCLAIMER_FULL } from '../utils/constants';
import {
  ArrowLeftRight,
  Inbox,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import clsx from 'clsx';

export const SwapRequests = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [receivedSwaps, setReceivedSwaps] = useState([]);
  const [sentSwaps, setSentSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [arrangementModal, setArrangementModal] = useState(null);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const [rec, sent] = await Promise.all([
        swapService.getReceivedSwaps(),
        swapService.getSentSwaps(),
      ]);
      setReceivedSwaps(rec || []);
      setSentSwaps(sent || []);
    } catch (err) {
      console.error('Failed to fetch swaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, []);

  const handleAccept = async (swapId) => {
    setProcessingId(swapId);
    setSuccessMessage('');
    try {
      const result = await swapService.acceptSwap(swapId);
      setSuccessMessage('Exchange Confirmed! Seats have been updated in application journey state.');
      setArrangementModal(result);
      fetchSwaps();
    } catch (err) {
      alert(err.message || 'Failed to accept swap');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (swapId) => {
    setProcessingId(swapId);
    try {
      await swapService.rejectSwap(swapId);
      fetchSwaps();
    } catch (err) {
      alert(err.message || 'Failed to decline swap');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (swapId) => {
    setProcessingId(swapId);
    try {
      await swapService.cancelSwap(swapId);
      fetchSwaps();
    } catch (err) {
      alert(err.message || 'Failed to cancel swap');
    } finally {
      setProcessingId(null);
    }
  };

  const currentList = activeTab === 'received' ? receivedSwaps : sentSwaps;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Seat Exchange Requests
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage incoming proposals from fellow travellers and track outgoing requests
          </p>
        </div>

        {/* Demo POV Switcher Helper */}
        <div className="bg-rail-50 border border-rail-200/80 rounded-2xl p-2.5 px-3 flex items-center gap-2 text-xs font-semibold text-rail-900 shadow-2xs">
          <Sparkles className="w-4 h-4 text-rail-600" />
          <span>Hackathon Multi-Perspective Mode Active</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">{successMessage}</strong>
            <p className="text-xs text-emerald-700 mt-0.5">
              Check the Coach Seat Map to see the newly arranged seating layout.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('received')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors',
            activeTab === 'received'
              ? 'bg-rail-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Inbox className="w-4 h-4" />
          <span>Received Requests ({receivedSwaps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors',
            activeTab === 'sent'
              ? 'bg-rail-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Send className="w-4 h-4" />
          <span>Sent Requests ({sentSwaps.length})</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Fetching exchange requests..." />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={activeTab === 'received' ? 'No incoming exchange requests' : 'No outgoing exchange requests'}
          description={
            activeTab === 'received'
              ? 'When another passenger sends a voluntary seat-swap request, it will appear here for your review.'
              : 'You have not initiated any voluntary exchange requests yet. Go to recommendations to find matches.'
          }
          actionText={activeTab === 'sent' ? 'Find Seat Matches' : 'Go to Dashboard'}
          onAction={() => (window.location.href = '/dashboard')}
        />
      ) : (
        <div className="space-y-4">
          {currentList.map((swap) => (
            <SwapRequestCard
              key={swap._id || swap.id}
              swap={swap}
              isTargetView={activeTab === 'received'}
              isProcessing={processingId === (swap._id || swap.id)}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Official Railway Disclaimer */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold text-slate-800">Assistive Coordination Notice:</strong>
          <p className="leading-relaxed text-slate-500">
            {DISCLAIMER_FULL}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwapRequests;
