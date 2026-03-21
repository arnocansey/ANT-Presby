import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

const getApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error;
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

const findAuthPayload = (value: any, depth = 0): { user: any; token: string } | null => {
  const parsed = tryParseJson(value);

  if (!parsed || typeof parsed !== 'object' || depth > 4) {
    return null;
  }

  if (parsed.user && parsed.token) {
    return {
      user: parsed.user,
      token: parsed.token,
    };
  }

  for (const nestedValue of Object.values(parsed)) {
    const found = findAuthPayload(nestedValue, depth + 1);
    if (found) return found;
  }

  return null;
};

const getAuthPayload = (responseData: any) => findAuthPayload(responseData);

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data?.success === false) {
        throw new Error(response.data?.message || response.data?.error || 'Login failed');
      }
      const payload = getAuthPayload(response.data);
      if (!payload) {
        throw new Error('Login response is missing user or token data');
      }
      return payload;
    },
    onSuccess: (data) => {
      const user = data.user;
      const token = data.token;

      if (!user || !token) {
        throw new Error('Login response is missing user or token data');
      }

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('access_token', token);
      toast.success('Login successful');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Login failed'));
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/auth/register', data);
      if (response.data?.success === false) {
        throw new Error(response.data?.message || response.data?.error || 'Registration failed');
      }
      const payload = getAuthPayload(response.data);
      if (!payload) {
        throw new Error('Registration response is missing user or token data');
      }
      return payload;
    },
    onSuccess: (data) => {
      const user = data.user;
      const token = data.token;

      if (!user || !token) {
        throw new Error('Registration response is missing user or token data');
      }

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('access_token', token);
      toast.success('Registration successful');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Registration failed'));
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      queryClient.clear();
      toast.success('Logout successful');
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile');
      return response.data.data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put('/users/profile', data);
      return response.data;
    },
    onSuccess: (response) => {
      if (response?.data) {
        queryClient.setQueryData(['profile'], response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });
};

export const useSermons = (page = 1, limit = 10, filters = {}) => {
  return useQuery({
    queryKey: ['sermons', page, limit, filters],
    queryFn: async () => {
      const response = await apiClient.get('/sermons', {
        params: { page, limit, ...filters },
      });
      return response.data;
    },
  });
};

export const useSermon = (id: number) => {
  return useQuery({
    queryKey: ['sermon', id],
    queryFn: async () => {
      const response = await apiClient.get(`/sermons/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useRecentSermons = () => {
  return useQuery({
    queryKey: ['sermons', 'recent'],
    queryFn: async () => {
      const response = await apiClient.get('/sermons/recent');
      return response.data.data;
    },
  });
};

export const useEvents = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['events', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/events', {
        params: { page, limit },
      });
      return response.data;
    },
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const response = await apiClient.get('/events/upcoming');
      return response.data.data;
    },
  });
};

export const useEvent = (id: number) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useRegisterEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiClient.post(`/events/${eventId}/register`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast.success('Event registration successful');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });
};

export const usePrayerRequests = () => {
  return useQuery({
    queryKey: ['prayers', 'user'],
    queryFn: async () => {
      const response = await apiClient.get('/prayers/user/requests');
      return response.data.data;
    },
  });
};

export const useSubmitPrayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/prayers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      toast.success('Prayer request submitted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Submission failed');
    },
  });
};

export const useDonations = () => {
  return useQuery({
    queryKey: ['donations', 'user'],
    queryFn: async () => {
      const response = await apiClient.get('/donations/user/donations');
      return response.data.data;
    },
  });
};

export const useSubmitDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/donations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast.success('Donation submitted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Donation failed');
    },
  });
};

export const useInitializeDonationPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/donations/initialize-payment', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    },
  });
};

export const useMinistries = () => {
  return useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const response = await apiClient.get('/ministries');
      return response.data.data;
    },
  });
};

export const useMinistry = (id: number) => {
  return useQuery({
    queryKey: ['ministry', id],
    queryFn: async () => {
      const response = await apiClient.get(`/ministries/${id}/sermons`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/overview');
      return response.data.data;
    },
  });
};

export const useUserGrowthStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'user-growth'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/stats/users');
      return response.data.data;
    },
  });
};

export const useRevenueStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/stats/revenue');
      return response.data.data;
    },
  });
};

export const useDashboardContentStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'content'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/stats/content');
      return response.data.data;
    },
  });
};

export const useDashboardEngagementStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'engagement'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/stats/engagement');
      return response.data.data;
    },
  });
};

export const useRecentActivities = () => {
  return useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/activities');
      return response.data.data;
    },
  });
};

export const useAdminSermons = () => {
  return useQuery({
    queryKey: ['admin', 'sermons'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/sermons');
      return response.data.data;
    },
  });
};

export const useDeleteSermon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/admin/sermons/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sermons'] });
      toast.success('Sermon deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete sermon'),
  });
};

export const useAdminEvents = () => {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/events');
      return response.data.data;
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/admin/events/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success('Event deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete event'),
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users');
      return response.data.data;
    },
  });
};

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await apiClient.put(`/admin/users/${id}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update role'),
  });
};

export const useAdminPrayerRequests = () => {
  return useQuery({
    queryKey: ['admin', 'prayers'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/prayers');
      return response.data.data;
    },
  });
};

export const useApprovePrayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/admin/prayers/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'prayers'] });
      toast.success('Prayer approved');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to approve prayer'),
  });
};

export const useAdminDonations = () => {
  return useQuery({
    queryKey: ['admin', 'donations'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/donations');
      return response.data.data;
    },
  });
};

export const useUpdateDonationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiClient.put(`/admin/donations/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'donations'] });
      toast.success('Donation status updated');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update donation'),
  });
};

export const useGlobalSearch = (searchQuery: string, page = 1, limit = 8) => {
  return useQuery({
    queryKey: ['search', searchQuery, page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/search', {
        params: { q: searchQuery, page, limit },
      });
      return response.data.data;
    },
    enabled: searchQuery.trim().length >= 2,
  });
};

export const useNews = (page = 1, limit = 10, search?: string) => {
  return useQuery({
    queryKey: ['news', page, limit, search || ''],
    queryFn: async () => {
      const response = await apiClient.get('/news', {
        params: { page, limit, search },
      });
      return response.data;
    },
  });
};

export const useLatestNews = (limit = 3) => {
  return useQuery({
    queryKey: ['news', 'latest', limit],
    queryFn: async () => {
      const response = await apiClient.get('/news', { params: { page: 1, limit } });
      return response.data?.data || [];
    },
  });
};

export const useNewsPost = (id: number) => {
  return useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      const response = await apiClient.get(`/news/${id}`);
      return response.data?.data;
    },
    enabled: !!id,
  });
};

export const useCommunityFeed = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['community-feed', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/community', {
        params: { page, limit },
      });
      return response.data;
    },
  });
};

export const useCreateCommunityPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; imageUrl?: string | null }) => {
      const response = await apiClient.post('/community', payload);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-feed'] });
      toast.success('Post shared with the community');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to create post'));
    },
  });
};

export const useToggleCommunityLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiClient.post(`/community/${postId}/like`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-feed'] });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update like'));
    },
  });
};

export const useCreateCommunityComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await apiClient.post(`/community/${postId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-feed'] });
      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to add comment'));
    },
  });
};

export const useDeleteCommunityPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiClient.delete(`/community/${postId}`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-feed'] });
      toast.success('Post removed');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete post'));
    },
  });
};

export const useDeleteCommunityComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, commentId }: { postId: number; commentId: number }) => {
      const response = await apiClient.delete(`/community/${postId}/comments/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-feed'] });
      toast.success('Comment removed');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete comment'));
    },
  });
};

export const useSubmitContactMessage = () => {
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; subject: string; message: string }) => {
      const response = await apiClient.post('/contact', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });
};

export const useNotifications = (page = 1, limit = 10, unreadOnly = false) => {
  return useQuery({
    queryKey: ['notifications', page, limit, unreadOnly],
    queryFn: async () => {
      const response = await apiClient.get('/notifications', {
        params: { page, limit, unread_only: unreadOnly },
      });
      return response.data?.data;
    },
    refetchInterval: 30000,
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUploadProfilePhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await apiClient.put('/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (response) => {
      if (response?.data) {
        qc.setQueryData(['profile'], response.data);
      }
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile photo updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    },
  });
};

export const useAdminNews = (page = 1, limit = 20, status?: string, search?: string) => {
  return useQuery({
    queryKey: ['admin', 'news', page, limit, status || '', search || ''],
    queryFn: async () => {
      const response = await apiClient.get('/admin/news', {
        params: { page, limit, status, search },
      });
      return response.data;
    },
  });
};

export const useCreateNewsPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/admin/news', payload);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      qc.invalidateQueries({ queryKey: ['news'] });
      toast.success('News post created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create news post');
    },
  });
};

export const useUpdateNewsPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await apiClient.put(`/admin/news/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      qc.invalidateQueries({ queryKey: ['news'] });
      toast.success('News post updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update news post');
    },
  });
};

export const useDeleteNewsPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/admin/news/${id}`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'news'] });
      qc.invalidateQueries({ queryKey: ['news'] });
      toast.success('News post deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete news post');
    },
  });
};

export const useUploadNewsImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post('/admin/news/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Image uploaded');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    },
  });
};

export const useAuditLogs = (page = 1, limit = 20, entityType?: string) => {
  return useQuery({
    queryKey: ['admin', 'audit-logs', page, limit, entityType || ''],
    queryFn: async () => {
      const response = await apiClient.get('/admin/audit-logs', {
        params: {
          page,
          limit,
          entity_type: entityType,
        },
      });
      return response.data;
    },
  });
};
