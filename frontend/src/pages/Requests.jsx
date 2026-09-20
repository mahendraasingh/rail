import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { swapService } from '../services/swapService';
import SwapRequestCard from '../components/SwapRequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SectionLabel from '../components/Card';
import { DISCLAIMER_FULL } from '../utils/constants';
import { useReveal } from '../lib/motion';
import { Inbox, Send, ArrowLeftRight, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export const Requests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received');
  const [receivedSwaps, setReceivedSwaps] = useState([]);
  const [sentSwaps, setSentSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const listRef = useReveal({ selector: '[data-request]' });

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
      await swapService.acceptSwap(swapId);
      setSuccessMessage('Exchange confirmed with mutual consent. Seats updated in the application journey state.');
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <span className="platform-label">REQUESTS</span>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink mt-1">
          COORDINATION REQUESTS
        </h1>
        <p className="text-sm text-ink-muted mt-1.5">
          Track every coordination request from discovery to resolution.
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-steel-50 border border-steel-300 text-steel-900 text-sm flex items-start gap-3 animate-slide-up">
          <ShieldCheck className="w-5 h-5 text-steel-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-ink">Consent recorded.</strong>
            <p className="text-xs text-ink-muted mt-0.5">
              Check the coach seat map to see the newly arranged seating layout.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setActiveTab('received')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
            activeTab === 'received' ? 'bg-ink text-ivory' : 'text-ink-soft hover:bg-ivory-deep'
          )}
        >
          <Inbox className="w-4 h-4" />
          Received ({receivedSwaps.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
            activeTab === 'sent' ? 'bg-ink text-ivory' : 'text-ink-soft hover:bg-ivory-deep'
          )}
        >
          <Send className="w-4 h-4" />
          Sent ({sentSwaps.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Fetching coordination requests…" />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={activeTab === 'received' ? 'No incoming requests' : 'No outgoing requests'}
          description={
            activeTab === 'received'
              ? 'When another passenger sends a voluntary seat-swap request, it will appear here for your review.'
              : 'You have not initiated any voluntary exchange requests yet. Browse matches to discover opportunities.'
          }
          actionText={activeTab === 'sent' ? 'Browse Matches' : 'Go to Dashboard'}
          onAction={() => navigate(activeTab === 'sent' ? '/matches' : '/dashboard')}
        />
      ) : (
        <div ref={listRef} className="space-y-4">
          {currentList.map((swap) => (
            <div data-request key={swap._id || swap.id}>
              <SwapRequestCard
                swap={swap}
                isTargetView={activeTab === 'received'}
                isProcessing={processingId === (swap._id || swap.id)}
                onAccept={handleAccept}
                onReject={handleReject}
                onCancel={handleCancel}
              />
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 rounded-2xl bg-white/80 border border-line flex items-start gap-3 text-xs text-ink-muted">
        <ShieldCheck className="w-5 h-5 text-steel-500 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">{DISCLAIMER_FULL}</p>
      </div>
    </div>
  );
};

export default Requests;
