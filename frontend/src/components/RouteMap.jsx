import clsx from 'clsx';
import { TrainGlyph } from './LoadingScreen';

/**
 * Premium railway route line: A ── train ──▶ B with optional intermediate stops.
 * Pure SVG/CSS — no external data required.
 */
export const RouteMap = ({
  source,
  destination,
  stops = [],
  compact = false,
  dark = false,
  className = '',
}) => {
  const stopsShort = stops.slice(0, 3);
  const segs = stopsShort.length + 1;

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Origin */}
        <div className="flex flex-col items-start gap-1.5 min-w-0">
          <span className={clsx('w-2.5 h-2.5 rounded-full bg-crimson-500 ring-4 ring-crimson-400/20', compact && 'w-2 h-2')} />
          <span className={clsx('font-display font-semibold leading-tight truncate max-w-[140px]', dark ? 'text-ivory' : 'text-ink', compact ? 'text-xs' : 'text-sm sm:text-base')}>
            {source}
          </span>
          <span className={clsx('platform-label !text-[9px]', dark && '!text-ivory/50')}>ORIGIN</span>
        </div>

        {/* Line with optional stops */}
        <div className="flex-1 flex items-center min-w-0 px-1">
          {stopsShort.length === 0 ? (
            <div className="flex-1 relative h-[2px] bg-line-strong rounded-full">
              <span className="absolute inset-y-0 left-0 w-1/3 bg-crimson-500/50 rounded-full" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-ivory px-2">
                <TrainGlyph className="w-4 h-4 text-ink" />
              </span>
            </div>
          ) : (
            stopsShort.map((stop, i) => (
              <React.Fragment key={i}>
                <div className={clsx('flex-1 relative h-[2px] rounded-full min-w-[16px]', dark ? 'bg-ivory/25' : 'bg-line-strong')}>
                  {i === 0 && <span className="absolute inset-y-0 left-0 w-1/3 bg-crimson-500/60 rounded-full" />}
                </div>
                <div className="flex flex-col items-center gap-1 px-0.5">
                  <span className={clsx('w-1.5 h-1.5 rounded-full border border-white', dark ? 'bg-ivory/50' : 'bg-steel-400')} />
                  <span className={clsx('hidden md:block text-[9px] font-bold uppercase tracking-wider whitespace-nowrap max-w-[70px] overflow-hidden text-ellipsis', dark ? 'text-ivory/60' : 'text-ink-faint')}>
                    {stop}
                  </span>
                </div>
              </React.Fragment>
            ))
          )}
          {/* Final segment */}
          {stopsShort.length > 0 && (
            <div className={clsx('flex-1 relative h-[2px] rounded-full min-w-[16px]', dark ? 'bg-ivory/25' : 'bg-line-strong')} />
          )}
        </div>

        {/* Destination */}
        <div className="flex flex-col items-end gap-1.5 min-w-0 text-right">
          <span className={clsx('w-2.5 h-2.5 rounded-full bg-saffron-400 ring-4 ring-saffron-300/20', compact && 'w-2 h-2')} />
          <span className={clsx('font-display font-semibold leading-tight truncate max-w-[140px]', dark ? 'text-ivory' : 'text-ink', compact ? 'text-xs' : 'text-sm sm:text-base')}>
            {destination}
          </span>
          <span className={clsx('platform-label !text-[9px]', dark && '!text-ivory/50')}>DESTINATION</span>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
