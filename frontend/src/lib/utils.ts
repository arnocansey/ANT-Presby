import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Utility Helper Functions
 */

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'GHS'): string => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Get initials from name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const getUserFirstName = (user: any): string => {
  return user?.firstName || user?.first_name || '';
};

export const getUserLastName = (user: any): string => {
  return user?.lastName || user?.last_name || '';
};

export const getUserFullName = (user: any): string => {
  const first = getUserFirstName(user);
  const last = getUserLastName(user);
  return `${first} ${last}`.trim();
};

export const getApiOrigin = (): string => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiBase.replace(/\/api\/?$/, '');
};

export const resolveAssetUrl = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return '';

  if (pathOrUrl.startsWith('/uploads/')) {
    return pathOrUrl;
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const parsedUrl = new URL(pathOrUrl);

      if (parsedUrl.pathname.startsWith('/uploads/')) {
        return parsedUrl.pathname;
      }
    } catch {
      return pathOrUrl;
    }

    return pathOrUrl;
  }
  return `${getApiOrigin()}${pathOrUrl}`;
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number = 100): string => {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};

/**
 * Check if user is admin
 */
export const isAdmin = (role: string): boolean => {
  return role === 'admin';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate email
 */
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Get color based on status
 */
export const getStatusColor = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'approved':
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

