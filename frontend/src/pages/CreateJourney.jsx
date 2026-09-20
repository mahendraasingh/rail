import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { journeyService } from '../services/journeyService';
import { getBerthTypeFromSeat } from '../utils/seatUtils';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import {
  Train,
  Plus,
  Trash2,
  Users,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const CreateJourney = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    pnr: '',
    trainNumber: '',
    trainName: '',
    source: '',
    destination: '',
    journeyDate: '2026-09-21',
    coach: 'B2',
  });

  const [passengers, setPassengers] = useState([
    { name: 'Mahendra (Self)', seatNumber: 31, coach: 'B2', berthType: 'UPPER', isGroup: true, ageCategory: 'ADULT' },
    { name: 'Father (Rajesh)', seatNumber: 32, coach: 'B2', berthType: 'SIDE_UPPER', isGroup: true, ageCategory: 'SENIOR' },
    { name: 'Mother (Sunita)', seatNumber: 57, coach: 'B2', berthType: 'LOWER', isGroup: true, ageCategory: 'SENIOR' },
    { name: 'Sister (Pooja)', seatNumber: 58, coach: 'B2', berthType: 'MIDDLE', isGroup: true, ageCategory: 'ADULT' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;

    if (field === 'seatNumber') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        updated[index].berthType = getBerthTypeFromSeat(num);
      }
    }

    setPassengers(updated);
  };

  const addPassengerRow = () => {
    setPassengers((prev) => [
      ...prev,
      {
        name: '',
        seatNumber: '',
        coach: formData.coach || 'B2',
        berthType: 'LOWER',
        isGroup: true,
        ageCategory: 'ADULT',
      },
    ]);
  };

  const removePassengerRow = (index) => {
    if (passengers.length === 1) return;
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.pnr || !formData.trainNumber || !formData.trainName || !formData.source || !formData.destination || !formData.coach) {
      setError('Please fill in all mandatory journey fields.');
      return;
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) {
        setError(`Please provide a name for Passenger #${i + 1}`);
        return;
      }
      if (!p.seatNumber || isNaN(parseInt(p.seatNumber, 10))) {
        setError(`Please provide a valid seat number for Passenger #${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        passengers: passengers.map((p) => ({
          ...p,
          coach: p.coach || formData.coach,
          seatNumber: parseInt(p.seatNumber, 10),
          groupId: p.isGroup ? `GRP_${formData.pnr}` : null,
        })),
      };

      const result = await journeyService.createJourney(payload);
      const journeyId = result.journey?._id || result.journey?.id;
      navigate(`/journey/${journeyId}`);
    } catch (err) {
      setError(err.message || 'Failed to create journey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Train Journey
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Enter your journey info and group passengers to detect seat splitting
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Journey Details Card */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Train className="w-4 h-4 text-rail-600" />
            <span>1. Train & Route Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                PNR Number *
              </label>
              <input
                type="text"
                required
                name="pnr"
                value={formData.pnr}
                onChange={handleInputChange}
                placeholder="e.g. 8493027156"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-rail-500 focus:ring-2 focus:ring-rail-500/20 text-sm outline-none font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Train Number *
              </label>
              <input
                type="text"
                required
                name="trainNumber"
                value={formData.trainNumber}
                onChange={handleInputChange}
                placeholder="e.g. 12011"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-rail-500 focus:ring-2 focus:ring-rail-500/20 text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Train Name *
              </label>
              <input
                type="text"
                required
                name="trainName"
                value={formData.trainName}
                onChange={handleInputChange}
                placeholder="e.g. Kalka Shatabdi Express"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-rail-500 focus:ring-2 focus:ring-rail-500/20 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Source Station *
              </label>
              <input
                type="text"
                required
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                placeholder="e.g. New Delhi (NDLS)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-rail-500 focus:ring-2 focus:ring-rail-500/20 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Destination Station *
              </label>
              <input
                type="text"
                required
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="e.g. Chandigarh (CDG)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-rail-500 focus:ring-2 focus:ring-rail-500/20 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Coach *
              </label>
              <input
                type="text"
                required
                name="coach"
                value={formData.coach}
                onChange={handleInputChange}
                placeholder="e.g. B2, S4"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-rail-500 focus:ring-2 focus:ring-rail-500/20 text-sm outline-none font-bold uppercase"
              />
            </div>
          </div>
        </Card>

        {/* Passengers Entry Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-rail-600" />
                <span>2. Passengers & Assigned Seats</span>
              </h2>
              <p className="text-xs text-slate-500">
                Enter your group members' allocated seats to detect separation
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={addPassengerRow}
            >
              Add Passenger
            </Button>
          </div>

          <div className="space-y-3">
            {passengers.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 w-full">
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      required
                      placeholder="Passenger Name"
                      value={p.name}
                      onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-rail-500 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      placeholder="Seat No."
                      value={p.seatNumber}
                      onChange={(e) => handlePassengerChange(idx, 'seatNumber', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-rail-500 font-bold font-mono"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={p.berthType}
                      onChange={(e) => handlePassengerChange(idx, 'berthType', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-rail-500"
                    >
                      <option value="LOWER">Lower Berth (LB)</option>
                      <option value="MIDDLE">Middle Berth (MB)</option>
                      <option value="UPPER">Upper Berth (UB)</option>
                      <option value="SIDE_LOWER">Side Lower (SL)</option>
                      <option value="SIDE_UPPER">Side Upper (SU)</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={p.ageCategory}
                      onChange={(e) => handlePassengerChange(idx, 'ageCategory', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-rail-500"
                    >
                      <option value="ADULT">Adult</option>
                      <option value="SENIOR">Senior Citizen (60+)</option>
                      <option value="CHILD">Child</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removePassengerRow(idx)}
                  disabled={passengers.length === 1}
                  className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Create Journey & Analyze Seats
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateJourney;
