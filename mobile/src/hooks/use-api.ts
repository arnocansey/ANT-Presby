import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptedTerms: boolean;
};

type ProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

type PrayerPayload = {
  title: string;
  description: string;
  category: 'personal' | 'family' | 'health' | 'work' | 'financial' | 'other';
  isAnonymous?: boolean;
};

type DonationPayload = {
  amount: number;
  donationType: 'tithe' | 'offering' | 'ministry' | 'emergency' | 'general';
  paymentMethod: 'bank_transfer' | 'momo' | 'card' | 'cash';
  notes?: string;
  callbackUrl?: string;
};

type AdminNewsPayload = {
  title: string;
  content: string;
  excerpt?: string;
  status?: string;
  featured?: boolean;
  notifySubscribers?: boolean;
};

type AdminEventPayload = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations?: number | null;
};

type AdminSermonPayload = {
  title: string;
  speaker: string;
  description: string;
  videoUrl?: string;
  sermonDate?: string;
  ministryId: number;
};

type AdminSettingsPayload = {
  siteTitle: string;
  contactEmail: string;
  paymentPublicKey: string;
  donationSuccessMessage: string;
};

const getApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error;
  }

  if (typeof responseData?.details === 'string' && responseData.details.trim()) {
    return responseData.details;
  }

  const firstDetail = responseData?.details?.[0];
  if (typeof firstDetail?.message === 'string' && firstDetail.message.trim()) {
    return firstDetail.message;
  }

  return fallback;
};

const tryParseJson = (value: unknown) => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const findAuthPayload = (
  value: any,
  depth = 0
): { user: Record<string, unknown>; token: string } | null => {
  const parsed = tryParseJson(value);

  if (!parsed || typeof parsed !== 'object' || depth > 4) {
    return null;
  }

  if (parsed.user && parsed.token) {
    return {
      user: parsed.user as Record<string, unknown>,
      token: String(parsed.token),
    };
  }

  for (const nestedValue of Object.values(parsed)) {
    const found = findAuthPayload(nestedValue, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
};

export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get('/health');
      return response.data;
    },
  });

export const useNews = () =>
  useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const response = await apiClient.get('/news', { params: { page: 1, limit: 10 } });
      return response.data?.data || [];
    },
  });

export const useNewsPost = (newsId?: number | string, enabled = true) =>
  useQuery({
    queryKey: ['news', 'detail', newsId],
    enabled: enabled && Boolean(newsId),
    queryFn: async () => {
      const response = await apiClient.get(`/news/${newsId}`);
      return response.data?.data;
    },
  });

export const useUpcomingEvents = () =>
  useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const response = await apiClient.get('/events/upcoming');
      return response.data?.data || [];
    },
  });

export const useSermons = (page = 1, limit = 12, enabled = true) =>
  useQuery({
    queryKey: ['sermons', page, limit],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/sermons', {
        params: { page, limit },
      });
      return response.data?.data || [];
    },
  });

export const useSermonById = (sermonId?: number | string, enabled = true) =>
  useQuery({
    queryKey: ['sermons', 'detail', sermonId],
    enabled: enabled && Boolean(sermonId),
    queryFn: async () => {
      const response = await apiClient.get(`/sermons/${sermonId}`);
      return response.data?.data;
    },
  });

export const useMinistries = (enabled = true) =>
  useQuery({
    queryKey: ['ministries'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/ministries');
      return response.data?.data || [];
    },
  });

export const useMinistrySermons = (ministryId?: number | string, enabled = true) =>
  useQuery({
    queryKey: ['ministries', ministryId, 'sermons'],
    enabled: enabled && Boolean(ministryId),
    queryFn: async () => {
      const response = await apiClient.get(`/ministries/${ministryId}/sermons`);
      return response.data?.data || [];
    },
  });

export const useGlobalSearch = (searchQuery: string, enabled = true) =>
  useQuery({
    queryKey: ['search', searchQuery],
    enabled: enabled && searchQuery.trim().length >= 2,
    queryFn: async () => {
      const response = await apiClient.get('/search', {
        params: { q: searchQuery, page: 1, limit: 12 },
      });
      return response.data?.data || { sermons: [], events: [] };
    },
  });

export const useSubmitContactMessage = () =>
  useMutation({
    mutationFn: async (payload: { name: string; email: string; subject: string; message: string }) => {
      const response = await apiClient.post('/contact', payload);
      return response.data?.data;
    },
  });

export const useEventById = (eventId?: number | string, enabled = true) =>
  useQuery({
    queryKey: ['events', 'detail', eventId],
    enabled: enabled && Boolean(eventId),
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.data?.data;
    },
  });

export const useMyProfile = (enabled = true) =>
  useQuery({
    queryKey: ['me', 'profile'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/users/profile');
      return response.data?.data;
    },
  });

export const useMyDonations = (enabled = true) =>
  useQuery({
    queryKey: ['me', 'donations'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/donations/user/donations');
      return response.data?.data || [];
    },
  });

export const useMyPrayerRequests = (enabled = true) =>
  useQuery({
    queryKey: ['me', 'prayers'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/prayers/user/requests');
      return response.data?.data || [];
    },
  });

export const useMyEventRegistrations = (enabled = true) =>
  useQuery({
    queryKey: ['me', 'event-registrations'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/events/registrations/user');
      return response.data?.data || [];
    },
  });

export const useMyNotifications = (enabled = true) =>
  useQuery({
    queryKey: ['me', 'notifications'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      return response.data?.data || { notifications: [], unread_count: 0 };
    },
  });

export const useAdminDashboardOverview = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'dashboard', 'overview'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/overview');
      return response.data?.data;
    },
  });

export const useAdminRecentActivities = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'dashboard', 'activities'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/activities');
      return response.data?.data || [];
    },
  });

export const useAdminDashboardContentStats = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'dashboard', 'content'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/stats/content');
      return response.data?.data;
    },
  });

export const useAdminDashboardEngagementStats = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'dashboard', 'engagement'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/stats/engagement');
      return response.data?.data;
    },
  });

export const useAdminUsers = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'users'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/users');
      return response.data?.data || [];
    },
  });

export const useUpdateUserRole = () =>
  useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const response = await apiClient.put(`/admin/users/${id}/role`, { role });
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

export const useAdminDonations = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'donations'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/donations');
      return response.data?.data || [];
    },
  });

export const useUpdateDonationStatus = () =>
  useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiClient.put(`/admin/donations/${id}/status`, { status });
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'donations'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'overview'] }),
      ]);
    },
  });

export const useAdminPrayerRequests = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'prayers'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/prayers');
      return response.data?.data || [];
    },
  });

export const useApprovePrayer = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/admin/prayers/${id}/approve`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'prayers'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'engagement'] }),
      ]);
    },
  });

export const useAdminNews = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'news'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/news', {
        params: { page: 1, limit: 20 },
      });
      return response.data?.data || [];
    },
  });

export const useCreateNewsPost = () =>
  useMutation({
    mutationFn: async (payload: AdminNewsPayload) => {
      const response = await apiClient.post('/admin/news', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'news'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'content'] }),
        queryClient.invalidateQueries({ queryKey: ['news'] }),
      ]);
    },
  });

export const useUpdateNewsPost = () =>
  useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AdminNewsPayload }) => {
      const response = await apiClient.put(`/admin/news/${id}`, payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'news'] }),
        queryClient.invalidateQueries({ queryKey: ['news'] }),
      ]);
    },
  });

export const useDeleteNewsPost = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/admin/news/${id}`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'news'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'content'] }),
        queryClient.invalidateQueries({ queryKey: ['news'] }),
      ]);
    },
  });

export const useAdminEvents = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'events'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/events');
      return response.data?.data || [];
    },
  });

export const useCreateAdminEvent = () =>
  useMutation({
    mutationFn: async (payload: AdminEventPayload) => {
      const response = await apiClient.post('/admin/events', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'content'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] }),
      ]);
    },
  });

export const useUpdateAdminEvent = () =>
  useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AdminEventPayload }) => {
      const response = await apiClient.put(`/admin/events/${id}`, payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] }),
      ]);
    },
  });

export const useDeleteAdminEvent = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/admin/events/${id}`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'content'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] }),
      ]);
    },
  });

export const useAdminSermons = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'sermons'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/sermons');
      return response.data?.data || [];
    },
  });

export const useCreateAdminSermon = () =>
  useMutation({
    mutationFn: async (payload: AdminSermonPayload) => {
      const response = await apiClient.post('/admin/sermons', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'sermons'] }),
        queryClient.invalidateQueries({ queryKey: ['sermons'] }),
      ]);
    },
  });

export const useUpdateAdminSermon = () =>
  useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AdminSermonPayload }) => {
      const response = await apiClient.put(`/admin/sermons/${id}`, payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'sermons'] }),
        queryClient.invalidateQueries({ queryKey: ['sermons'] }),
      ]);
    },
  });

export const useDeleteAdminSermon = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/admin/sermons/${id}`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'sermons'] }),
        queryClient.invalidateQueries({ queryKey: ['sermons'] }),
      ]);
    },
  });

export const useAdminSettings = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'settings'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings');
      return response.data?.data;
    },
  });

export const useUpdateAdminSettings = () =>
  useMutation({
    mutationFn: async (payload: AdminSettingsPayload) => {
      const response = await apiClient.put('/admin/settings', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });

export const useAuditLogs = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'audit-logs'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/admin/audit-logs', {
        params: { page: 1, limit: 30 },
      });
      return response.data?.data || [];
    },
  });

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await apiClient.post('/auth/login', payload);
      const authPayload = findAuthPayload(response.data);

      if (!authPayload) {
        throw new Error('Login response is missing user or token data');
      }

      return authPayload;
    },
    onSuccess: async (data) => {
      await setSession(data.token, data.user as any);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me', 'profile'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'donations'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'prayers'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] }),
      ]);
    },
  });
};

export const useRegister = () => {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await apiClient.post('/auth/register', payload);
      const authPayload = findAuthPayload(response.data);

      if (!authPayload) {
        throw new Error('Registration response is missing user or token data');
      }

      return authPayload;
    },
    onSuccess: async (data) => {
      await setSession(data.token, data.user as any);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me', 'profile'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'donations'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'prayers'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] }),
      ]);
    },
  });
};

export { getApiErrorMessage };

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (payload: ProfilePayload) => {
      const response = await apiClient.put('/users/profile', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me', 'profile'] });
    },
  });

export const useCreatePrayerRequest = () =>
  useMutation({
    mutationFn: async (payload: PrayerPayload) => {
      const response = await apiClient.post('/prayers', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me', 'prayers'] });
    },
  });

export const useInitializeDonationPayment = () =>
  useMutation({
    mutationFn: async (payload: DonationPayload) => {
      const response = await apiClient.post('/donations/initialize-payment', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me', 'donations'] });
    },
  });

export const useVerifyDonationPayment = () =>
  useMutation({
    mutationFn: async (reference: string) => {
      const response = await apiClient.get(`/donations/verify/${reference}`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me', 'donations'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] }),
      ]);
    },
  });

export const useRegisterForEvent = () =>
  useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiClient.post(`/events/${eventId}/register`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'event-registrations'] }),
      ]);
    },
  });

export const useCancelEventRegistration = () =>
  useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiClient.delete(`/events/${eventId}/register`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] }),
        queryClient.invalidateQueries({ queryKey: ['me', 'event-registrations'] }),
      ]);
    },
  });

export const useMarkNotificationRead = () =>
  useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiClient.post(`/notifications/${notificationId}/read`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    },
  });

export const useMarkAllNotificationsRead = () =>
  useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/notifications/read-all');
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    },
  });
