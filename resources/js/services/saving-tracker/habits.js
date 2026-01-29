import axios from 'axios';

const API_URL = '/api/saving-tracker';

export const getHabits = async () => {
    const response = await axios.get(`${API_URL}/habits`);
    return response.data;
};

export const getHabitStats = async (habitId) => {
    const response = await axios.get(`${API_URL}/stats/habits/${habitId}`);
    return response.data;
};

export const getOverallStats = async () => {
    const response = await axios.get(`${API_URL}/stats/overall`);
    return response.data;
};

export const createHabit = async (habitData) => {
    const response = await axios.post(`${API_URL}/habits`, habitData);
    return response.data;
};

export const updateHabit = async (habitId, habitData) => {
    const response = await axios.put(`${API_URL}/habits/${habitId}`, habitData);
    return response.data;
};

export const deleteHabit = async (habitId) => {
    await axios.delete(`${API_URL}/habits/${habitId}`);
    return true;
};
