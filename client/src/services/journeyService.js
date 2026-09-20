import api from './api';

export const journeyService = {
  getJourneys: async () => {
    const response = await api.get('/journeys');
    return response.data;
  },

  getJourneyById: async (id) => {
    const response = await api.get(`/journeys/${id}`);
    return response.data;
  },

  createJourney: async (journeyData) => {
    const response = await api.post('/journeys', journeyData);
    return response.data;
  },

  getSeatMap: async (id) => {
    const response = await api.get(`/journeys/${id}/seatmap`);
    return response.data;
  },

  seedDemoJourney: async () => {
    const response = await api.post('/journeys/demo-seed');
    return response.data;
  },

  deleteJourney: async (id) => {
    const response = await api.delete(`/journeys/${id}`);
    return response.data;
  },

  getDatasetStatus: async () => {
    const response = await api.get('/dataset/status');
    return response.data;
  },
};
