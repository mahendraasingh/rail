import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { journeyService } from '../services/journeyService';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate, formatPNR } from '../utils/formatters';
import {
  Train,
  PlusCircle,
  Users,
  Calendar,
  ArrowRight,
  Search,
  Sparkles,
  Map,
} from 'lucide-react';

export const Journeys = () => {
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        setLoading(true);
        const data = await journeyService.getJourneys();
        setJourneys(data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load journeys');
      } finally {
        setLoading(false);
      }
    };
    fetchJourneys();
  }, []);

  const filteredJourneys = journeys.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (j.trainName || '').toLowerCase().includes(q) ||
      (j.trainNumber || '').toString().includes(q) ||
      (j.source || '').toLowerCase().includes(q) ||
      (j.destination || '').toLowerCase().includes(q) ||
      (j.pnr || '').toString().includes(q)
    );
  });

  if (loading) {
    return <LoadingSpinner text="Loading journeys..." className="min-h-[60vh]" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            All Journeys
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Browse every registered train — open one to view coach, seat map & matches
          </p>
        </div>
        <Link to="/journey/create">
          <Button variant="primary" size="md" icon={PlusCircle} className="font-bold shadow-md">
            Create New Journey
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Search Bar */}
      {journeys.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by train, station or PNR..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-rail-500 focus:ring-2 focus:ring-rail-500/20"
          />
        </div>
      )}

      {/* Journeys Grid */}
      {journeys.length === 0 ? (
        <EmptyState
          icon={Train}
          title="No journeys available"
          description="Create a journey with your train and member details to detect and coordinate seat exchanges."
          actionText="Create New Journey"
          onAction={() => navigate('/journey/create')}
        />
      ) : filteredJourneys.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No journeys match your search"
          description={`No results for "${searchQuery}". Try a different train name, number or PNR.`}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJourneys.map((j) => {
            const jId = j._id || j.id;
            return (
              <Card key={jId} className="p-6 flex flex-col justify-between hoverEffect">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-xs text-slate-700">
                          PNR: {formatPNR(j.pnr)}
                        </span>
                        <Badge variant="primary" size="sm">
                          Coach {j.coach}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                        {j.trainNumber} — {j.trainName}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(j.journeyDate)}
                      </span>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="py-4 flex items-center justify-between text-sm font-semibold text-slate-700 border-b border-slate-100">
                    <span className="truncate">{j.source}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mx-2" />
                    <span className="truncate">{j.destination}</span>
                  </div>

                  {/* Feature Tag */}
                  <div className="py-3 flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Users className="w-4 h-4 text-rail-600" />
                    <span>Voluntary Seat Swapping & Split Detection Enabled</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-wrap items-center gap-2.5">
                  <Link to={`/journey/${jId}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full justify-center" icon={Map}>
                      View Journey
                    </Button>
                  </Link>
                  <Link to={`/journey/${jId}/recommendations`}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Sparkles}
                      className="text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100"
                    >
                      Find Seat Matches
                    </Button>
                  </Link>
                  <Link to={`/journey/${jId}/seats`}>
                    <Button variant="ghost" size="sm">
                      Seat Map
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Journeys;
