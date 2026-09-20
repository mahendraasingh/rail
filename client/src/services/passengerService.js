import api from './api';

export const passengerService = {
  addPassenger: async (passengerData) => {
    const response = await api.post('/passengers', passengerData);
    return response.data;
  },

  getPassengersByJourney: async (journeyId) => {
    const response = await api.get(`/passengers/journey/${journeyId}`);
    return response.data;
  },

  updatePassenger: async (id, updates) => {
    const response = await api.patch(`/passengers/${id}`, updates);
    return response.data;
  },
};
