import { Link } from 'react-router-dom';
import { APP_NAME, DISCLAIMER_SHORT } from '../utils/constants';
import { TrainGlyph } from './LoadingScreen';

export const Footer = ({ bare = false }) => {
  return (
    <footer className={bare ? '' : 'mt-16 border-t border-line bg-cream/60'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-saffron-300">
              <TrainGlyph className="w-5 h-5" />
            </span>
            <div>
              <p className="font-display font-semibold text-ink leading-none">
                {APP_NAME.toUpperCase().slice(0, 4)}
                <span className="text-crimson-600">{APP_NAME.toUpperCase().slice(4)}</span>
              </p>
              <p className="platform-label mt-1">Booked Together. Sit Together.</p>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-xs font-medium text-ink-muted">
            <Link to="/dashboard" className="hover:text-crimson-600 transition-colors">Dashboard</Link>
            <Link to="/groups" className="hover:text-crimson-600 transition-colors">Groups</Link>
            <Link to="/matches" className="hover:text-crimson-600 transition-colors">Matches</Link>
            <Link to="/requests" className="hover:text-crimson-600 transition-colors">Requests</Link>
          </nav>
        </div>

        <div className="metallic-rule" />

        <p className="text-[11px] leading-relaxed text-ink-faint max-w-3xl">
          {DISCLAIMER_SHORT} Prototype runs on synthetic railway data.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
