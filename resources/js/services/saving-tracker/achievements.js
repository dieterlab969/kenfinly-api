import axios from 'axios';

const API_URL = '/api/saving-tracker';

export const getAchievements = async () => {
    const response = await axios.get(`${API_URL}/achievements`);
    return response.data;
};
