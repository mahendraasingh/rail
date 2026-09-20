import api from './api';

export const swapService = {
  getJourneyMatches: async (journeyId) => {
    const response = await api.get(`/journeys/${journeyId}/matches`);
    return response.data;
  },

  createSwapRequest: async (swapData) => {
    const response = await api.post('/swaps', swapData);
    return response.data;
  },

  getReceivedSwaps: async () => {
    const response = await api.get('/swaps/received');
    return response.data;
  },

  getSentSwaps: async () => {
    const response = await api.get('/swaps/sent');
    return response.data;
  },

  getSwapsByJourney: async (journeyId) => {
    const response = await api.get(`/swaps/journey/${journeyId}`);
    return response.data;
  },

  acceptSwap: async (id) => {
    const response = await api.post(`/swaps/${id}/accept`);
    return response.data;
  },

  rejectSwap: async (id) => {
    const response = await api.post(`/swaps/${id}/reject`);
    return response.data;
  },

  cancelSwap: async (id) => {
    const response = await api.post(`/swaps/${id}/cancel`);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/swaps/notifications');
    return response.data;
  },
};
