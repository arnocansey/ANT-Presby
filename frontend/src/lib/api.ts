import axios from 'axios';

const API_URL = '/api';

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

const isAuthEndpoint = (url?: string) => {
  const u = String(url || '');
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/register') ||
    u.includes('/auth/logout') ||
    u.includes('/auth/refresh')
  );
};

const subscribeTokenRefresh = (cb: (success: boolean) => void) => {
  refreshSubscribers.push(cb);
};

const notifyRefreshSubscribers = (success: boolean) => {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
};

const redirectToLoginIfNeeded = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('user');
  localStorage.removeItem('access_token');

  const path = window.location.pathname;
  const isPublicAuthPage = path.startsWith('/login') || path.startsWith('/register');

  if (!isPublicAuthPage) {
    window.location.href = '/login';
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await apiClient.post('/auth/refresh');
        const refreshedToken = refreshResponse.data?.data?.token;

        if (refreshedToken && typeof window !== 'undefined') {
          localStorage.setItem('access_token', refreshedToken);
        }

        isRefreshing = false;
        notifyRefreshSubscribers(true);
      } catch (refreshError) {
        isRefreshing = false;
        notifyRefreshSubscribers(false);
        redirectToLoginIfNeeded();
        return Promise.reject(refreshError);
      }
    }

    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((success) => {
        if (!success) {
          reject(error);
          return;
        }

        resolve(apiClient(originalRequest));
      });
    });
  }
);

export default apiClient;
