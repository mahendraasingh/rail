import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Info,
  Grid,
  Sparkles,
  ArrowLeftRight,
  ChevronLeft,
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = ({ journeyId }) => {
  const params = useParams();
  const activeJourneyId = journeyId || params.id;

  if (!activeJourneyId) return null;

  const links = [
    { label: 'Journey Overview', path: `/journey/${activeJourneyId}`, icon: Info, end: true },
    { label: 'Interactive Seat Map', path: `/journey/${activeJourneyId}/seats`, icon: Grid },
    { label: 'Seat Recommendations', path: `/journey/${activeJourneyId}/recommendations`, icon: Sparkles },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200 p-3 h-fit shadow-xs mb-6 lg:mb-0">
      <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        Journey Navigation
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-rail-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
