import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  useMinistries,
  useMyNotifications,
  useMyPrayerRequests,
  useMyProfile,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';
import { APP_NAME } from '@/lib/config';
const groupColors = [
  ['#2563EB', '#06B6D4'],
  ['#0F766E', '#16A34A'],
  ['#E11D48', '#DB2777'],
  ['#7C3AED', '#9333EA'],
];

export default function AccountScreen() {
  const theme = useTheme();
  const { user, clearSession } = useAuthStore();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const profileQuery = useMyProfile(Boolean(user));
  const notificationsQuery = useMyNotifications(Boolean(user));
  const prayersQuery = useMyPrayerRequests(Boolean(user));
  const ministriesQuery = useMinistries(Boolean(user));

  const displayName = [
    profileQuery.data?.first_name || profileQuery.data?.firstName,
    profileQuery.data?.last_name || profileQuery.data?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const initials = (displayName || user?.email || 'GP')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const ministries = Array.isArray(ministriesQuery.data) ? ministriesQuery.data : [];
  const groupItems = ministries.slice(0, 3);
  const appTitle = APP_NAME.replace(/\s+Mobile$/i, '');

  if (!user) {
    return (
      <BrandScreen>
        <View style={styles.headerBlock}>
          <ThemedText type="title" style={styles.headerTitle}>
            Connect
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Grow together in community
          </ThemedText>
        </View>

        <View style={[styles.guestCard, { backgroundColor: '#1A1A2E', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <ThemedText type="defaultSemiBold">Sign in to connect</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Access your profile, prayer requests, small groups, and admin tools from the same ANT PRESS account.
          </ThemedText>
          <View style={styles.guestActions}>
            <Pressable onPress={() => router.push('/login')} style={[styles.primaryButton, styles.guestActionButton, { backgroundColor: '#7C3AED' }]}>
              <ThemedText type="defaultSemiBold" style={styles.whiteText}>
                Sign In
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push('/register' as never)} style={[styles.secondaryGuestButton, { borderColor: 'rgba(255,255,255,0.12)' }]}>
              <ThemedText type="defaultSemiBold">Create Account</ThemedText>
            </Pressable>
          </View>
        </View>
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <View style={styles.headerBlock}>
        <ThemedText type="title" style={styles.headerTitle}>
          Connect
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Grow together in community
        </ThemedText>
      </View>

      <View style={[styles.profileCard, { backgroundColor: '#1A1A2E', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.whiteText}>
            {initials}
          </ThemedText>
        </View>
        <View style={styles.profileCopy}>
          <ThemedText type="defaultSemiBold">{displayName || user.email}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Member account active
          </ThemedText>
          <View style={styles.ratingRow}>
            {[0, 1, 2].map((value) => (
              <Ionicons key={value} name="star" size={12} color={theme.tint} />
            ))}
            <ThemedText type="small" themeColor="textSecondary">
              {user.role === 'admin' ? 'Admin account' : 'Member account'}
            </ThemedText>
          </View>
        </View>
        <Pressable onPress={() => router.push('/profile')} style={styles.editLink}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Edit
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.prayerCard, { backgroundColor: 'rgba(109,40,217,0.24)', borderColor: 'rgba(139,92,246,0.22)' }]}>
        <View style={styles.prayerHeader}>
          <View style={[styles.prayerIconWrap, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>
            <Ionicons name="heart-outline" size={18} color="#C084FC" />
          </View>
          <View style={styles.prayerCopy}>
            <ThemedText type="defaultSemiBold">Submit a Prayer Request</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Our prayer team is here for you
            </ThemedText>
          </View>
        </View>
        <View style={[styles.placeholderInput, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Share your prayer request...
          </ThemedText>
        </View>
        <Pressable onPress={() => router.push('/prayers')} style={[styles.primaryButton, { backgroundColor: '#7C3AED' }]}>
          <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
          <ThemedText type="defaultSemiBold" style={styles.whiteText}>
            Send Prayer Request
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        <ThemedText type="defaultSemiBold">Small Groups</ThemedText>
        <Pressable onPress={() => router.push('/small-groups' as never)}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            View All
          </ThemedText>
        </Pressable>
      </View>

      {groupItems.length > 0 ? groupItems.map((group: any, index: number) => (
        <View key={group.name} style={[styles.groupCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <View style={[styles.groupIcon, { backgroundColor: groupColors[index % groupColors.length][0] }]}>
            <Ionicons name="people-outline" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.groupBody}>
            <ThemedText type="defaultSemiBold">{group.name || 'Ministry'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {group.description || 'Tap to learn more about this ministry.'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {group.sermons?.length ? `${group.sermons.length} sermons available` : 'Explore ministry resources'}
            </ThemedText>
          </View>
          <Pressable onPress={() => router.push(`/ministries/${group.id}` as never)} style={[styles.joinButton, { backgroundColor: 'rgba(255,159,26,0.16)' }]}>
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              Open
            </ThemedText>
          </Pressable>
        </View>
      )) : (
        <View style={[styles.groupCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <View style={[styles.groupBody, { flex: 1 }]}>
            <ThemedText type="defaultSemiBold">No ministries published yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Published ministries from {appTitle} will show here.
            </ThemedText>
          </View>
        </View>
      )}

      <View style={styles.sectionRow}>
        <ThemedText type="defaultSemiBold">Contact Us</ThemedText>
      </View>

      <View style={[styles.contactCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <ContactRow icon="call-outline" label="Call Us" value="+1 (555) 234-5678" />
        <ContactRow icon="mail-outline" label="Email" value={user.email} />
        <ContactRow icon="location-outline" label="Platform" value={appTitle} />
        <ContactRow icon="business-outline" label="Prayer Requests" value={`${prayersQuery.data?.length ?? 0} submitted`} />
      </View>

      <View style={[styles.utilityCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <UtilityButton label={`Notifications (${notificationsQuery.data?.unread_count ?? 0})`} onPress={() => router.push('/notifications')} />
        <UtilityButton label={`Prayer History (${prayersQuery.data?.length ?? 0})`} onPress={() => router.push('/prayers')} />
        <UtilityButton label="Donation History" onPress={() => router.push('/donations')} />
        <UtilityButton label="Small Groups" onPress={() => router.push('/small-groups' as never)} />
        <UtilityButton label="Prayer Wall" onPress={() => router.push('/prayer-wall' as never)} />
        <UtilityButton label="Daily Devotional" onPress={() => router.push('/daily-devotional' as never)} />
        <UtilityButton label="News & Updates" onPress={() => router.push('/news' as never)} />
        <UtilityButton label="Open Dashboard" onPress={() => router.push('/dashboard')} />
        {user.role === 'admin' ? <UtilityButton label="Open Admin Console" onPress={() => router.push('/admin')} /> : null}
        {user.role === 'admin' ? <UtilityButton label="Admin Analytics" onPress={() => router.push('/admin-analytics' as never)} /> : null}
        {user.role === 'admin' ? <UtilityButton label="Send Announcement" onPress={() => router.push('/admin-announcements' as never)} /> : null}
        <UtilityButton label="Sign Out" onPress={() => setShowSignOutConfirm(true)} danger />
      </View>

      <Modal visible={showSignOutConfirm} transparent animationType="fade" onRequestClose={() => setShowSignOutConfirm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: '#151826', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(248,113,113,0.16)' }]}>
              <Ionicons name="log-out-outline" size={20} color="#F87171" />
            </View>
            <ThemedText type="subtitle" style={styles.centerText}>
              Sign out?
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              You will need to sign in again to access your profile, giving, and prayer history.
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowSignOutConfirm(false)} style={[styles.modalButton, styles.modalCancel, { borderColor: 'rgba(255,255,255,0.12)' }]}>
                <ThemedText type="defaultSemiBold">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setShowSignOutConfirm(false);
                  await clearSession();
                  router.replace('/login');
                }}
                style={[styles.modalButton, { backgroundColor: '#F87171' }]}>
                <ThemedText type="defaultSemiBold" style={styles.whiteText}>
                  Sign Out
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </BrandScreen>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.contactRow}>
      <Ionicons name={icon} size={16} color={theme.tint} />
      <View style={styles.contactCopy}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </View>
  );
}

function UtilityButton({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.utilityButton, { borderColor: 'rgba(255,255,255,0.08)' }]}>
      <ThemedText type="defaultSemiBold" style={{ color: danger ? '#F87171' : theme.text }}>
        {label}
      </ThemedText>
      <Ionicons name="chevron-forward" size={16} color={danger ? '#F87171' : theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: Spacing.one,
  },
  headerTitle: {
    fontSize: 30,
    lineHeight: 34,
  },
  fullCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  guestCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  guestActions: {
    gap: Spacing.two,
  },
  guestActionButton: {
    flex: 1,
  },
  secondaryGuestButton: {
    minHeight: 46,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  editLink: {
    alignSelf: 'flex-start',
  },
  prayerCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  prayerHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  prayerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerCopy: {
    flex: 1,
    gap: 2,
  },
  placeholderInput: {
    minHeight: 46,
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBody: {
    flex: 1,
    gap: 2,
  },
  joinButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  contactCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  contactCopy: {
    flex: 1,
    gap: 1,
  },
  utilityCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  utilityButton: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  centerText: {
    textAlign: 'center',
  },
});
