import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { DISCLAIMER_FULL } from '../utils/constants';
import {
  Train,
  Sparkles,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-rail-400/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <Badge variant="primary" size="lg" className="shadow-xs">
            <Sparkles className="w-4 h-4 text-rail-600" />
            <span>Voluntary Railway Seat Exchange Coordinator</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Keep Your Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-rail-700 via-rail-600 to-sky-500">Together.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Find intelligent, voluntary seat-exchange opportunities with fellow passengers when your family or group gets split across train coaches.
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/journey/create" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" icon={Train} className="w-full justify-center font-bold px-8 py-3.5">
                Create New Journey
              </Button>
            </Link>
          </div>
        </div>

        {/* Visual Coach Simulation Showcase Preview */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-elevated p-6 sm:p-8 relative overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rail-50 text-rail-600 flex items-center justify-center">
                  <Train className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">12011 Shatabdi Express — Coach B2</h3>
                  <p className="text-xs text-slate-500">Live Hackathon Seat Split Simulation</p>
                </div>
              </div>
              <Badge variant="separated" size="md" dot>
                Group Split Across Coach Detected
              </Badge>
            </div>

            {/* Visual demo seat representation */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Family Group Member 1 */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Family Group Base</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Mahendra & Father</h4>
                  <p className="text-xs text-slate-600 mt-0.5">B2-31 (UB) & B2-32 (SU)</p>
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>

              {/* Separated Family Member */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-center justify-between animate-pulse-subtle">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Separated Member</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Mother (Sunita)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">B2-57 (LB) — Bay 8</p>
                </div>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>

              {/* Recommended Exchange Passenger */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Recommended Match</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Rahul Sharma</h4>
                  <p className="text-xs text-slate-600 mt-0.5">B2-45 (LB) — 91% Match</p>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-amber-600" />
              </div>
            </div>

            {/* Bottom assistive notice */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Consent-Based & Voluntary · No forced seat changes</span>
              </div>
              <span className="text-[11px] text-slate-400">Deterministic scoring & transparent explainability</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Designed for Harmonious Travel
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Bringing families, senior citizens, and groups together through mutually agreed voluntary exchanges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-rail-50 text-rail-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Group Split Detection</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Automatically calculates coach bay distances and detects when group members are isolated across distant compartments.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Transparent Match Scoring</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Deterministic scoring (+30 Coach, +20 Berth, +30 Proximity, +10 Solo status) with clear explanations for why matches are suggested.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Voluntary Human Consent</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Every exchange requires mutual passenger approval. No automatic or unauthorized ticket modifications occur.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-rail-400" />
              <span className="text-white font-bold text-base">RailTogether</span>
              <span className="text-xs text-slate-500">Hackathon Edition</span>
            </div>
            <p className="text-xs text-slate-400 text-center sm:text-right">
              Assisting passenger comfort with ethical, consent-driven software.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Important Assistive Notice: </strong>
            {DISCLAIMER_FULL}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
