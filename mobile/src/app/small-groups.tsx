import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
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
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const groupColors = ['#2563EB', '#DB2777', '#7C3AED', '#16A34A', '#D97706'];

const personName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';
const meetingLine = (group: GroupSummary) =>
  [group.meeting_day, group.meeting_time, group.location].filter(Boolean).join(' · ');
const isFull = (group: GroupSummary) => group.capacity !== null && group.member_count >= group.capacity;

export default function SmallGroupsScreen() {
  const theme = useTheme();
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
      return <BrandButton label="Leave group" variant="outline" onPress={() => !busy && leave(target)} />;
    }
    if (target.my_status === 'pending') {
      return <BrandButton label="Request pending · Cancel" variant="outline" onPress={() => !busy && leave(target)} />;
    }
    if (isFull(target)) {
      return (
        <ThemedText type="small" themeColor="textSecondary">
          This group is full.
        </ThemedText>
      );
    }
    return <BrandButton label={user ? 'Ask to join' : 'Sign in to join'} onPress={() => !busy && join(target.id)} />;
  };

  if (selectedId) {
    return (
      <BrandScreen>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => setSelectedId(undefined)}
            style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle} numberOfLines={1}>
            {group?.name || 'Group'}
          </ThemedText>
        </View>

        {groupQuery.isLoading ? (
          <ActivityIndicator color={theme.tint} />
        ) : groupQuery.isError || !group ? (
          <BrandCard>
            <ThemedText type="small">This group could not be loaded.</ThemedText>
            <BrandButton label="Back to groups" onPress={() => setSelectedId(undefined)} />
          </BrandCard>
        ) : (
          <>
            <BrandCard>
              {group.ministry_name ? <BrandPill>{group.ministry_name}</BrandPill> : null}
              {group.description ? <ThemedText type="small">{group.description}</ThemedText> : null}
              {meetingLine(group) ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {meetingLine(group)}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {`${group.member_count} members${group.capacity !== null ? ` of ${group.capacity}` : ''}`}
                {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
              </ThemedText>
              {statusAction(group)}
            </BrandCard>

            {canManage ? (
              <BrandCard>
                <ThemedText type="defaultSemiBold">Join requests ({requestsQuery.data?.length ?? 0})</ThemedText>
                {(requestsQuery.data ?? []).length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No pending requests.
                  </ThemedText>
                ) : (
                  (requestsQuery.data ?? []).map((request) => (
                    <View key={request.user_id} style={styles.requestRow}>
                      <ThemedText type="small" numberOfLines={1}>
                        {personName(request)}
                      </ThemedText>
                      <View style={styles.requestActions}>
                        <BrandButton label="Approve" onPress={() => !busy && decide(request.user_id, 'approve')} />
                        <BrandButton label="Decline" variant="outline" onPress={() => !busy && decide(request.user_id, 'decline')} />
                      </View>
                    </View>
                  ))
                )}
              </BrandCard>
            ) : null}

            {group.members ? (
              <BrandCard>
                <ThemedText type="defaultSemiBold">Members ({group.members.length})</ThemedText>
                {group.members.map((member) => (
                  <View key={member.user_id} style={styles.memberRow}>
                    <ThemedText type="small" style={styles.memberName} numberOfLines={1}>
                      {personName(member)}
                    </ThemedText>
                    {member.role === 'leader' ? <BrandPill>Leader</BrandPill> : null}
                  </View>
                ))}
              </BrandCard>
            ) : null}
          </>
        )}
      </BrandScreen>
    );
  }

  const groups = Array.isArray(groupsQuery.data) ? groupsQuery.data : [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Small Groups"
        title="Find your community"
        description="Join a small group to grow, pray and do life together during the week."
      />

      {groupsQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : groupsQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load groups.</ThemedText>
          <BrandButton label="Try again" onPress={() => groupsQuery.refetch()} />
        </BrandCard>
      ) : groups.length === 0 ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No groups are open yet.
          </ThemedText>
        </BrandCard>
      ) : (
        groups.map((item, index) => {
          const color = groupColors[index % groupColors.length];
          return (
            <Pressable key={item.id} onPress={() => setSelectedId(item.id)}>
              <BrandCard>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: `${color}22` }]}>
                    <Ionicons name="people-outline" size={20} color={color} />
                  </View>
                  <View style={styles.groupCopy}>
                    <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                    {meetingLine(item) ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {meetingLine(item)}
                      </ThemedText>
                    ) : null}
                  </View>
                  <BrandPill>
                    {item.my_status === 'active'
                      ? 'Member'
                      : item.my_status === 'pending'
                        ? 'Pending'
                        : `${item.member_count}${item.capacity !== null ? `/${item.capacity}` : ''}`}
                  </BrandPill>
                </View>
              </BrandCard>
            </Pressable>
          );
        })
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerTitle: { flex: 1 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  groupIcon: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  groupCopy: { flex: 1, gap: 2 },
  requestRow: { gap: Spacing.one },
  requestActions: { flexDirection: 'row', gap: Spacing.two },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  memberName: { flex: 1 },
});
