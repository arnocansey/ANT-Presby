import { Platform } from 'react-native';

export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'ANT PRESS Mobile';

const defaultApiUrl =
  Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'web' ? process.env.EXPO_PUBLIC_API_URL_WEB : undefined) ||
  defaultApiUrl;
