import { API_URL } from '@/lib/config';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Older images are stored as /uploads/... on the API server; newer ones are full Cloudinary URLs.
export const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  return url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : url;
};
