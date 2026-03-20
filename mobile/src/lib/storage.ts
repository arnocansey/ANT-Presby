import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'ant_press_access_token';
const USER_KEY = 'ant_press_user';

const webStorage = {
  async getItem(key: string) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.removeItem(key);
  },
};

const secureStore = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return webStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      return webStorage.setItem(key, value);
    }

    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      return webStorage.removeItem(key);
    }

    return SecureStore.deleteItemAsync(key);
  },
};

export const secureStorage = {
  async getAccessToken() {
    return secureStore.getItem(ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token: string) {
    return secureStore.setItem(ACCESS_TOKEN_KEY, token);
  },
  async clearAccessToken() {
    return secureStore.removeItem(ACCESS_TOKEN_KEY);
  },
  async getUser() {
    return secureStore.getItem(USER_KEY);
  },
  async setUser(payload: string) {
    return secureStore.setItem(USER_KEY, payload);
  },
  async clearUser() {
    return secureStore.removeItem(USER_KEY);
  },
};
