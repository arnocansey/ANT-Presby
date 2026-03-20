import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth';

type LoginPayload = {
  email: string;
  password: string;
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

export const useUpcomingEvents = () =>
  useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const response = await apiClient.get('/events/upcoming');
      return response.data?.data || [];
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

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await apiClient.post('/auth/login', payload);
      return response.data?.data;
    },
    onSuccess: async (data) => {
      if (data?.token && data?.user) {
        await setSession(data.token, data.user);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['me', 'profile'] }),
          queryClient.invalidateQueries({ queryKey: ['me', 'donations'] }),
          queryClient.invalidateQueries({ queryKey: ['me', 'prayers'] }),
        ]);
      }
    },
  });
};

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
