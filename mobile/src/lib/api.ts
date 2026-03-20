import axios from 'axios';
import { API_URL } from '@/lib/config';
import { secureStorage } from '@/lib/storage';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
