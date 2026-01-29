import axios from 'axios';

const API_URL = '/api/saving-tracker';

export const getTracking = async (habitId) => {
    const response = await axios.get(`${API_URL}/tracking/${habitId}`);
    return response.data;
};

export const toggleTracking = async (habitId, date) => {
    const response = await axios.post(`${API_URL}/tracking/toggle`, {
        habit_id: habitId,
        date
    });
    return response.data;
};
