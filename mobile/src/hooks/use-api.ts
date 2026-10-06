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
  shareOnWall?: boolean;
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
  seriesId?: number | null;
};

type AdminSettingsPayload = {
  siteTitle: string;
  contactEmail: string;
  paymentPublicKey: string;
  donationSuccessMessage: string;
};

type CommunityPostPayload = {
  content: string;
  imageUrl?: string | null;
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

export const useCommunityFeed = (page = 1, limit = 20, enabled = true) =>
  useQuery({
    queryKey: ['community-feed', page, limit],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/community', {
        params: { page, limit },
      });
      return response.data?.data || [];
    },
  });

export const useCreateCommunityPost = () =>
  useMutation({
    mutationFn: async (payload: CommunityPostPayload) => {
      const response = await apiClient.post('/community', payload);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });

export const useToggleCommunityLike = () =>
  useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiClient.post(`/community/${postId}/like`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });

export const useCreateCommunityComment = () =>
  useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await apiClient.post(`/community/${postId}/comments`, { content });
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });

export const useDeleteCommunityPost = () =>
  useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiClient.delete(`/community/${postId}`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });

export const useDeleteCommunityComment = () =>
  useMutation({
    mutationFn: async ({ postId, commentId }: { postId: number; commentId: number }) => {
      const response = await apiClient.delete(`/community/${postId}/comments/${commentId}`);
      return response.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['community-feed'] });
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

export const useSermons = (page = 1, limit = 12, enabled = true, seriesId?: number) =>
  useQuery({
    queryKey: ['sermons', page, limit, seriesId ?? 'all'],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get('/sermons', {
        params: { page, limit, ...(seriesId ? { series_id: seriesId } : {}) },
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

export type GroupSummary = {
  id: number;
  name: string;
  description: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  location: string | null;
  capacity: number | null;
  ministry_name: string | null;
  is_active: boolean;
  member_count: number;
  leaders: { user_id: number; first_name: string; last_name: string }[];
  my_status: 'pending' | 'active' | null;
  my_role: 'leader' | 'member' | null;
};

export type GroupDetail = GroupSummary & {
  members: { user_id: number; first_name: string; last_name: string; role: 'leader' | 'member' }[] | null;
};

export type GroupJoinRequest = { user_id: number; first_name: string; last_name: string; email: string; requested_at: string };

const invalidateGroups = () => queryClient.invalidateQueries({ queryKey: ['groups'] });

export const useGroups = () =>
  useQuery({
    queryKey: ['groups', 'list'],
    queryFn: async (): Promise<GroupSummary[]> => {
      const response = await apiClient.get('/groups');
      return response.data?.data || [];
    },
  });

export const useGroup = (id?: number) =>
  useQuery({
    queryKey: ['groups', 'detail', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<GroupDetail> => {
      const response = await apiClient.get(`/groups/${id}`);
      return response.data?.data;
    },
  });

export const useJoinGroup = () =>
  useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.post(`/groups/${groupId}/join`);
    },
    onSettled: invalidateGroups,
  });

export const useLeaveGroup = () =>
  useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.delete(`/groups/${groupId}/membership`);
    },
    onSettled: invalidateGroups,
  });

export const useGroupRequests = (groupId?: number, enabled = true) =>
  useQuery({
    queryKey: ['groups', 'requests', groupId],
    enabled: Boolean(groupId) && enabled,
    queryFn: async (): Promise<GroupJoinRequest[]> => {
      const response = await apiClient.get(`/groups/${groupId}/requests`);
      return response.data?.data || [];
    },
  });

export const useDecideGroupRequest = (groupId?: number) =>
  useMutation({
    mutationFn: async ({ userId, decision }: { userId: number; decision: 'approve' | 'decline' }) => {
      await apiClient.post(`/groups/${groupId}/requests/${userId}/${decision}`);
    },
    onSettled: invalidateGroups,
  });

export type Devotional = {
  id: number;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  body: string;
  prayer: string | null;
  publish_date: string;
  status: 'draft' | 'published';
  notified_at: string | null;
  is_today?: boolean;
};

export type DevotionalInput = {
  title: string;
  scriptureReference: string;
  scriptureText: string;
  body: string;
  prayer: string | null;
  publishDate: string;
};

const invalidateDevotionals = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['devotionals'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'devotionals'] }),
  ]);

export const useTodayDevotional = () =>
  useQuery({
    queryKey: ['devotionals', 'today'],
    queryFn: async (): Promise<Devotional | null> => {
      const response = await apiClient.get('/devotionals/today');
      return response.data?.data ?? null;
    },
  });

export const useDevotionalArchive = () =>
  useQuery({
    queryKey: ['devotionals', 'archive'],
    queryFn: async (): Promise<Devotional[]> => {
      const response = await apiClient.get('/devotionals', { params: { limit: 20 } });
      return response.data?.data || [];
    },
  });

export const useAdminDevotionals = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'devotionals'],
    enabled,
    queryFn: async (): Promise<Devotional[]> => {
      const response = await apiClient.get('/admin/devotionals');
      return response.data?.data || [];
    },
  });

export const useSaveDevotional = () =>
  useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: DevotionalInput }) => {
      const response = id ? await apiClient.put(`/admin/devotionals/${id}`, input) : await apiClient.post('/admin/devotionals', input);
      return response.data?.data as Devotional;
    },
    onSettled: invalidateDevotionals,
  });

export const useDeleteDevotional = () =>
  useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/devotionals/${id}`);
    },
    onSettled: invalidateDevotionals,
  });

export const usePublishDevotional = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/admin/devotionals/${id}/publish`);
      return response.data?.data as { devotional: Devotional; notified: boolean };
    },
    onSettled: invalidateDevotionals,
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

export type WallPrayer = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'approved' | 'answered';
  requester_name: string;
  prayer_count: number;
  prayed_by_me: boolean;
  created_at: string;
};

export const usePrayerWall = (enabled = true) =>
  useQuery({
    queryKey: ['prayers', 'wall'],
    enabled,
    queryFn: async (): Promise<WallPrayer[]> => {
      const response = await apiClient.get('/prayers/wall', { params: { limit: 50 } });
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

export type AttendancePerson = { user_id: number; first_name: string; last_name: string; email: string };

export type EventAttendance = {
  event: { id: number; name: string; event_date: string; location: string; status: string };
  registered: (AttendancePerson & { checked_in: boolean; record_id: number | null; checked_in_at: string | null })[];
  walk_in_members: (AttendancePerson & { record_id: number; checked_in_at: string })[];
  guests: { record_id: number; guest_name: string; checked_in_at: string }[];
  totals: { registered: number; checked_in_members: number; guests: number; total: number };
};

export type AttendanceSummaryRow = {
  event_id: number;
  name: string;
  event_date: string;
  registered: number;
  members: number;
  guests: number;
  total: number;
};

export type MemberSearchResult = { id: number; first_name: string; last_name: string; email: string };

export type CheckInEvent = { id: number; name: string; event_date: string; location: string; status: string };

// Events two weeks either side of today (not cancelled), soonest first.
export const useCheckInEvents = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'attendance', 'events'],
    enabled,
    queryFn: async (): Promise<CheckInEvent[]> => {
      const response = await apiClient.get('/admin/attendance/events');
      return response.data?.data || [];
    },
  });

export const useEventAttendance = (eventId?: number) =>
  useQuery({
    queryKey: ['admin', 'attendance', 'event', eventId],
    enabled: Boolean(eventId),
    queryFn: async (): Promise<EventAttendance> => {
      const response = await apiClient.get(`/admin/attendance/events/${eventId}`);
      return response.data?.data;
    },
  });

export const useAttendanceSummary = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'attendance', 'summary'],
    enabled,
    queryFn: async (): Promise<AttendanceSummaryRow[]> => {
      const response = await apiClient.get('/admin/attendance/summary', { params: { limit: 8 } });
      return response.data?.data || [];
    },
  });

const invalidateAttendance = () => queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });

export const useCheckIn = (eventId?: number) =>
  useMutation({
    mutationFn: async (input: { userId: number } | { guestName: string }) => {
      const response = await apiClient.post(`/admin/attendance/events/${eventId}/check-in`, input);
      return response.data?.data;
    },
    onSettled: invalidateAttendance,
  });

export const useUndoCheckIn = () =>
  useMutation({
    mutationFn: async (recordId: number) => {
      await apiClient.delete(`/admin/attendance/records/${recordId}`);
    },
    onSettled: invalidateAttendance,
  });

export const useMemberSearch = (term: string, enabled = true) => {
  const search = term.trim();
  return useQuery({
    queryKey: ['admin', 'users', 'search', search],
    enabled: enabled && search.length >= 2,
    queryFn: async (): Promise<MemberSearchResult[]> => {
      const response = await apiClient.get('/admin/users', { params: { search, limit: 10 } });
      return response.data?.data || [];
    },
  });
};

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
        queryClient.invalidateQueries({ queryKey: ['sermon-series'] }),
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
        queryClient.invalidateQueries({ queryKey: ['sermon-series'] }),
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
        queryClient.invalidateQueries({ queryKey: ['sermon-series'] }),
      ]);
    },
  });

export type SermonSeriesSummary = {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  sermon_count: number;
};

export type SeriesInput = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
};

export const useSermonSeriesList = (enabled = true) =>
  useQuery({
    queryKey: ['sermon-series'],
    enabled,
    queryFn: async (): Promise<SermonSeriesSummary[]> => {
      const response = await apiClient.get('/sermon-series');
      return response.data?.data || [];
    },
  });

const invalidateSeries = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['sermon-series'] }),
    queryClient.invalidateQueries({ queryKey: ['sermons'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'sermons'] }),
  ]);

export const useSaveSermonSeries = () =>
  useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: SeriesInput }) => {
      const response = id
        ? await apiClient.put(`/admin/sermon-series/${id}`, input)
        : await apiClient.post('/admin/sermon-series', input);
      return response.data?.data;
    },
    onSuccess: invalidateSeries,
  });

export const useDeleteSermonSeries = () =>
  useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/sermon-series/${id}`);
    },
    onSuccess: invalidateSeries,
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

export const useGoogleLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (accessToken: string) => {
      const response = await apiClient.post('/auth/google', { accessToken });
      const authPayload = findAuthPayload(response.data);

      if (!authPayload) {
        throw new Error('Google login response is missing user or token data');
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
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await apiClient.post('/auth/register', payload);
      if (response.data?.success === false) {
        throw new Error(response.data?.message || response.data?.error || 'Registration failed');
      }
      return response.data;
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

export const usePrayForRequest = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/prayers/${id}/pray`);
      return response.data?.data as { prayer_count: number; prayed_by_me: boolean };
    },
    // Refresh on failure too: a 404 usually means the request just left the wall.
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prayers', 'wall'] });
    },
  });

type PrayerSharingInput = {
  id: number;
  title: string;
  description: string;
  category: PrayerPayload['category'];
  shareOnWall: boolean;
};

// The update endpoint validates the full form, so the existing text is sent back unchanged.
export const useSetPrayerSharing = () =>
  useMutation({
    mutationFn: async ({ id, ...body }: PrayerSharingInput) => {
      const response = await apiClient.put(`/prayers/${id}`, body);
      return response.data?.data;
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me', 'prayers'] }),
        queryClient.invalidateQueries({ queryKey: ['prayers', 'wall'] }),
      ]);
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
