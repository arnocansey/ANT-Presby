import type { GroupSummary } from '@/hooks/useApi';

export const meetingLine = (group: Pick<GroupSummary, 'meeting_day' | 'meeting_time' | 'location'>) =>
  [group.meeting_day, group.meeting_time, group.location].filter(Boolean).join(' · ');

export const isGroupFull = (group: GroupSummary) => group.capacity !== null && group.member_count >= group.capacity;
