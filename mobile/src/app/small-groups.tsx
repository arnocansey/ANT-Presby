import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ErrorState, InfoLine, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useDecideGroupRequest,
  useGroup,
  useGroupRequests,
  useGroups,
  useJoinGroup,
  useLeaveGroup,
  type GroupSummary,
} from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const personName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';
const meetingLine = (group: GroupSummary) =>
  [group.meeting_day, group.meeting_time, group.location].filter(Boolean).join(' · ');
const isFull = (group: GroupSummary) => group.capacity !== null && group.member_count >= group.capacity;

export default function SmallGroupsScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const [selectedId, setSelectedId] = React.useState<number | undefined>();

  const groupsQuery = useGroups();
  const groupQuery = useGroup(selectedId);
  const group = groupQuery.data;
  const isAdmin = user?.role === 'admin';
  const canManage = Boolean(isAdmin || (group?.my_role === 'leader' && group?.my_status === 'active'));
  const requestsQuery = useGroupRequests(selectedId, canManage);
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();
  const decideMutation = useDecideGroupRequest(selectedId);

  const busy = joinMutation.isPending || leaveMutation.isPending || decideMutation.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));

  const join = (groupId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
    joinMutation.mutate(groupId, {
      onSuccess: () => Alert.alert('Request sent', 'The group leaders will review your request.'),
      onError: showError('Could not send your request'),
    });
  };

  const leave = (target: GroupSummary) =>
    Alert.alert(
      target.my_status === 'active' ? `Leave ${target.name}?` : 'Cancel your request?',
      target.my_status === 'active' ? 'You can ask to join again later.' : undefined,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: target.my_status === 'active' ? 'Leave' : 'Cancel request',
          style: 'destructive',
          onPress: () => leaveMutation.mutate(target.id, { onError: showError('Could not leave the group') }),
        },
      ]
    );

  const decide = (userId: number, decision: 'approve' | 'decline') =>
    decideMutation.mutate({ userId, decision }, { onError: showError('Could not update the request') });

  const statusAction = (target: GroupSummary) => {
    if (target.my_status === 'active') {
      return <AppButton label="Leave group" variant="secondary" onPress={() => !busy && leave(target)} />;
    }
    if (target.my_status === 'pending') {
      return <AppButton label="Request pending · Cancel" variant="secondary" onPress={() => !busy && leave(target)} />;
    }
    if (isFull(target)) {
      return (
        <AppText variant="small" tone="muted">
          This group is full.
        </AppText>
      );
    }
    return <AppButton label={user ? 'Ask to join' : 'Sign in to join'} onPress={() => !busy && join(target.id)} />;
  };

  if (selectedId) {
    return (
      <Screen>
        <ScreenHeader onBack={() => setSelectedId(undefined)} eyebrow="Small group" title={group?.name || 'Group'} />

        {groupQuery.isLoading ? (
          <LoadingList count={2} height={120} />
        ) : groupQuery.isError || !group ? (
          <EmptyState
            icon="people-outline"
            title="This group could not be loaded"
            action={<AppButton label="Back to groups" variant="secondary" onPress={() => setSelectedId(undefined)} />}
          />
        ) : (
          <>
            <AppCard>
              {group.ministry_name ? <AppBadge tone="gold">{group.ministry_name}</AppBadge> : null}
              {group.description ? <AppText variant="small">{group.description}</AppText> : null}
              {meetingLine(group) ? <InfoLine icon="time-outline">{meetingLine(group)}</InfoLine> : null}
              <InfoLine icon="people-outline">
                {`${group.member_count} members${group.capacity !== null ? ` of ${group.capacity}` : ''}`}
                {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
              </InfoLine>
              {statusAction(group)}
            </AppCard>

            {canManage ? (
              <AppCard>
                <AppText variant="bodyStrong">{`Join requests (${requestsQuery.data?.length ?? 0})`}</AppText>
                {(requestsQuery.data ?? []).length === 0 ? (
                  <AppText variant="small" tone="muted">
                    No pending requests.
                  </AppText>
                ) : (
                  (requestsQuery.data ?? []).map((request) => (
                    <View key={request.user_id} style={[styles.request, { borderTopColor: colors.border }]}>
                      <AppText variant="small" numberOfLines={1}>
                        {personName(request)}
                      </AppText>
                      <View style={styles.requestActions}>
                        <View style={styles.flex}>
                          <AppButton label="Approve" size="sm" onPress={() => !busy && decide(request.user_id, 'approve')} />
                        </View>
                        <View style={styles.flex}>
                          <AppButton
                            label="Decline"
                            size="sm"
                            variant="secondary"
                            onPress={() => !busy && decide(request.user_id, 'decline')}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </AppCard>
            ) : null}

            {group.members ? (
              <AppCard>
                <AppText variant="bodyStrong">{`Members (${group.members.length})`}</AppText>
                {group.members.map((member) => (
                  <View key={member.user_id} style={styles.memberRow}>
                    <AppText variant="small" style={styles.flex} numberOfLines={1}>
                      {personName(member)}
                    </AppText>
                    {member.role === 'leader' ? <AppBadge tone="gold">Leader</AppBadge> : null}
                  </View>
                ))}
              </AppCard>
            ) : null}
          </>
        )}
      </Screen>
    );
  }

  const groups = Array.isArray(groupsQuery.data) ? groupsQuery.data : [];

  return (
    <Screen>
      <ScreenHeader
        back
        title="Small groups"
        subtitle="Join a small group to grow, pray and do life together during the week."
      />

      {groupsQuery.isLoading ? (
        <LoadingList />
      ) : groupsQuery.isError ? (
        <ErrorState title="Could not load groups" onRetry={() => groupsQuery.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState icon="people-outline" title="No groups are open yet" message="New groups will appear here." />
      ) : (
        groups.map((item) => (
          <AppCard key={item.id} onPress={() => setSelectedId(item.id)} accessibilityLabel={`Open ${item.name}`} style={styles.groupCard}>
            <View style={[styles.groupIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{item.name}</AppText>
              {meetingLine(item) ? (
                <AppText variant="small" tone="muted">
                  {meetingLine(item)}
                </AppText>
              ) : null}
            </View>
            <AppBadge tone={item.my_status === 'active' ? 'success' : item.my_status === 'pending' ? 'warning' : 'neutral'}>
              {item.my_status === 'active'
                ? 'Member'
                : item.my_status === 'pending'
                  ? 'Pending'
                  : `${item.member_count}${item.capacity !== null ? `/${item.capacity}` : ''}`}
            </AppBadge>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  request: { gap: Space.sm, paddingTop: Space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  requestActions: { flexDirection: 'row', gap: Space.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm, minHeight: 32 },
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  groupIcon: { width: 44, height: 44, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
});
