import React, { useState, useEffect } from 'react';
import { swapService } from '../services/swapService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Bell,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Check,
} from 'lucide-react';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        const data = await swapService.getNotifications();
        setNotifications(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const typeConfig = {
    ALERT: { icon: AlertTriangle, color: 'bg-rose-100 text-rose-700', badge: 'danger' },
    MATCH: { icon: Sparkles, color: 'bg-amber-100 text-amber-700', badge: 'warning' },
    INFO: { icon: Info, color: 'bg-sky-100 text-sky-700', badge: 'info' },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Journey alerts, split updates, and swap request responses</p>
        </div>

        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" icon={Check} onClick={markAllAsRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="There are no active alerts or notifications for your journeys."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.INFO;
            const Icon = config.icon;

            return (
              <Card
                key={notif.id}
                className={`p-4 transition-all flex items-start gap-3.5 ${
                  notif.read ? 'bg-white opacity-80' : 'bg-slate-50/70 border-rail-200 shadow-xs'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
