import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = `${import.meta.env.VITE_API_URL || 'https://fitness-nmmf.onrender.com/api'}/workouts/`;

const getAuthHeaders = () => {
  const userInfoStr = Cookies.get('userInfo');
  if (!userInfoStr) return { headers: {} };
  try {
    const userInfo = JSON.parse(userInfoStr);
    return { headers: { Authorization: `Bearer ${userInfo.token}` } };
  } catch {
    return { headers: {} };
  }
};

export const workoutService = {
  getWorkouts: async () => (await axios.get(API_URL, getAuthHeaders())).data,
  createWorkout: async (data) => (await axios.post(API_URL, data, getAuthHeaders())).data,
};
