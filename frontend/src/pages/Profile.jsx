import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { journeyService } from '../services/journeyService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { DISCLAIMER_FULL } from '../utils/constants';
import {
  User,
  Mail,
  Phone,
  Database,
  FileCode,
  ShieldCheck,
  Server,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [datasetStatus, setDatasetStatus] = useState(null);

  useEffect(() => {
    const checkDataset = async () => {
      try {
        const res = await journeyService.getDatasetStatus();
        setDatasetStatus(res);
      } catch (e) {
        setDatasetStatus({ available: false, message: 'Dataset service status query error' });
      }
    };
    checkDataset();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Passenger Profile & System Info</h1>
          <p className="text-xs text-slate-500 mt-0.5">Account credentials and hackathon application diagnostics</p>
        </div>

        <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 pb-4 mb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-rail-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user?.name || 'Passenger'}</h3>
              <Badge variant="primary" size="sm" className="mt-1">
                Verified Account
              </Badge>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email || 'demo@railtogether.app'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{user?.phone || '+91 9876543210'}</span>
            </div>
          </div>
        </Card>

        {/* Dataset & System Diagnostics Card */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-rail-600" />
            <span>Dataset & System Diagnostics</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-600">Backend API:</span>
              <Badge variant="success" size="sm">Online (Express)</Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Synthetic Dataset Status:</span>
                <Badge variant={datasetStatus?.available ? 'success' : 'neutral'} size="sm">
                  {datasetStatus?.available ? 'Dataset Uploaded' : 'Empty Uploads Folder'}
                </Badge>
              </div>
              <p className="text-slate-500 pt-1">
                {datasetStatus?.message || 'No dataset uploaded. Please upload a synthetic railway dataset.'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Path: server/dataset/uploads/
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assistive Notice */}
      <Card className="p-6 bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-slate-900 mb-1">Assistive Coordination Disclaimer:</strong>
            <p>{DISCLAIMER_FULL}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
