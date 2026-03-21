import { Platform } from 'react-native';

export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'ANT PRESS Mobile';

const HOSTED_API_URL = 'https://ant-presby-backend.onrender.com/api';

const defaultApiUrl = HOSTED_API_URL;

export const API_URL =
  (Platform.OS === 'web' ? process.env.EXPO_PUBLIC_API_URL_WEB : undefined) ||
  process.env.EXPO_PUBLIC_API_URL ||
  defaultApiUrl;
