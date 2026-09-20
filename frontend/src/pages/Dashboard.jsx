import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { journeyService } from '../services/journeyService';
import { swapService } from '../services/swapService';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate, formatPNR } from '../utils/formatters';
import {
  Train,
  PlusCircle,
  Sparkles,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pendingRequests: 0,
    confirmedSwaps: 0,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const journeysData = await journeyService.getJourneys();
      setJourneys(journeysData || []);

      const receivedSwaps = await swapService.getReceivedSwaps();
      const sentSwaps = await swapService.getSentSwaps();
      const allSwaps = [...(receivedSwaps || []), ...(sentSwaps || [])];

      const pending = allSwaps.filter((s) => s.status === 'PENDING').length;
      const confirmed = allSwaps.filter((s) => s.status === 'ACCEPTED').length;

      setStats({
        pendingRequests: pending,
        confirmedSwaps: confirmed,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading journeys..." className="min-h-[60vh]" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rail-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <Badge variant="primary" size="sm" className="bg-white/10 text-rail-200 border-white/10">
            Passenger Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Passenger'}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Track and coordinate voluntary seat exchanges for your upcoming train trips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/journey/create">
            <Button variant="primary" size="md" icon={PlusCircle} className="font-bold shadow-md">
              Create New Journey
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rail-50 text-rail-600 flex items-center justify-center flex-shrink-0">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Active Journeys</span>
            <p className="text-xl font-extrabold text-slate-900">{journeys.length}</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
            <p className="text-xl font-extrabold text-slate-900">{stats.pendingRequests}</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Confirmed Swaps</span>
            <p className="text-xl font-extrabold text-slate-900">{stats.confirmedSwaps}</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Algorithm Status</span>
            <p className="text-xs font-bold text-emerald-600 mt-1">Deterministic Active</p>
          </div>
        </Card>
      </div>

      {/* Journey List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Your Journeys</h2>
          <span className="text-xs text-slate-500 font-medium">{journeys.length} registered</span>
        </div>

        {journeys.length === 0 ? (
          <EmptyState
            icon={Train}
            title="No journeys registered yet"
            description="Create a journey or browse loaded dataset trips to detect and coordinate seat exchanges."
            actionText="Create New Journey"
            onAction={() => navigate('/journey/create')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {journeys.map((j) => {
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
                          <span className="px-2 py-0.5 rounded bg-rail-100 font-bold text-xs text-rail-800">
                            Coach {j.coach}
                          </span>
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

                    {/* Simulation Split Info Tag */}
                    <div className="py-3 flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Users className="w-4 h-4 text-rail-600" />
                      <span>Voluntary Seat Swapping & Split Detection Enabled</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex flex-wrap items-center gap-2.5">
                    <Link to={`/journey/${jId}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full justify-center">
                        View Journey
                      </Button>
                    </Link>
                    <Link to={`/journey/${jId}/recommendations`}>
                      <Button variant="outline" size="sm" icon={Sparkles} className="text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100">
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
    </div>
  );
};

export default Dashboard;
