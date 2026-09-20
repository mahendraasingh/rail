import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { journeyService } from '../services/journeyService';

const JourneyContext = createContext(null);

export const JourneyProvider = ({ children }) => {
  const [journeys, setJourneys] = useState([]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('railsaathi_journey') || '');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await journeyService.getJourneys();
      const list = data || [];
      setJourneys(list);
      setSelectedId((current) => {
        const exists = current && list.some((j) => (j._id || j.id) === current);
        if (!exists && list.length) {
          const first = list[0]._id || list[0].id;
          localStorage.setItem('railsaathi_journey', first);
          return first;
        }
        return exists ? current : '';
      });
    } catch (e) {
      // Journey list is decorative in the navbar; page-level fetches surface errors.
      console.error('JourneyContext load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const selected = useMemo(
    () => journeys.find((j) => (j._id || j.id) === selectedId) || null,
    [journeys, selectedId]
  );

  const select = (id) => {
    setSelectedId(id);
    localStorage.setItem('railsaathi_journey', id);
  };

  return (
    <JourneyContext.Provider value={{ journeys, selected, selectedId, select, loading, refresh }}>
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourneys = () => {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourneys must be used within JourneyProvider');
  return ctx;
};
