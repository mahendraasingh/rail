import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { journeyService } from '../services/journeyService';
import JourneySummary from '../components/JourneySummary';
import PassengerCard from '../components/PassengerCard';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { DISCLAIMER_SHORT } from '../utils/constants';
import {
  Train,
  Sparkles,
  Grid,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Trash2,
} from 'lucide-react';

export const JourneyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJourney = async () => {
    try {
      setLoading(true);
      const data = await journeyService.getJourneyById(id);
      setJourneyData(data);
    } catch (err) {
      setError(err.message || 'Failed to load journey details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this journey?')) {
      try {
        await journeyService.deleteJourney(id);
        navigate('/dashboard');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner text="Analyzing journey and coach seating..." className="min-h-[60vh]" />;
  }

  if (error || !journeyData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-sm max-w-md mx-auto mb-4">
          {error || 'Journey not found'}
        </div>
        <Link to="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { journey, passengers, groupPassengers, groupSplitInfo, recommendationCount } = journeyData;
  const isSplit = groupSplitInfo?.isSplit;
  const separatedIdSet = new Set(groupSplitInfo?.separatedPassengerIds || []);

  const otherPassengers = passengers.filter((p) => !p.groupId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Journey Header & Group Split Banner */}
      <JourneySummary
        journey={journey}
        groupSplitInfo={groupSplitInfo}
        passengerCount={passengers.length}
        recommendationCount={recommendationCount}
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <Sidebar journeyId={id} />

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quick Actions:
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Link to={`/journey/${id}/seats`}>
                <Button variant="outline" size="sm" icon={Grid}>
                  View Coach Seat Map
                </Button>
              </Link>

              <Link to={`/journey/${id}/recommendations`}>
                <Button variant="primary" size="sm" icon={Sparkles} className="bg-rail-600 hover:bg-rail-700">
                  Find Exchange Opportunities
                </Button>
              </Link>

              <button
                onClick={handleDelete}
                title="Delete Journey"
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Group Passengers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Your Travelling Group ({groupPassengers.length} Members)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Current seating configuration for members travelling together
                </p>
              </div>

              {isSplit ? (
                <Badge variant="separated" size="sm" dot>
                  {groupSplitInfo.separatedCount} Separated
                </Badge>
              ) : (
                <Badge variant="success" size="sm" dot>
                  Seated Together
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupPassengers.map((p) => {
                const pId = p._id || p.id;
                const isSeparated = separatedIdSet.has(pId.toString());
                return (
                  <PassengerCard
                    key={pId}
                    passenger={p}
                    isSeparated={isSeparated}
                    actionText={isSeparated ? 'Find Match' : null}
                    onActionClick={() => navigate(`/journey/${id}/recommendations`)}
                  />
                );
              })}
            </div>
          </div>

          {/* Coach Fellow Passengers Section */}
          {otherPassengers.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Other Passengers in Coach {journey.coach}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Registered fellow travellers available for voluntary coordination
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherPassengers.map((p) => {
                  const pId = p._id || p.id;
                  return (
                    <PassengerCard
                      key={pId}
                      passenger={p}
                      isSeparated={false}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Assistive Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">Assistive Journey Tool: </span>
              <span>{DISCLAIMER_SHORT}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetails;
