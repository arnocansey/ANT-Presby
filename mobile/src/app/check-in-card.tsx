import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ErrorState, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { useMyCheckInCard } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

// The member's own QR card, scanned by ushers at the entrance.
export default function CheckInCardScreen() {
  const user = useAuthStore((state) => state.user);
  const cardQuery = useMyCheckInCard(Boolean(user));
  const card = cardQuery.data;

  return (
    <Screen>
      <ScreenHeader back title="My check-in card" subtitle="Show this at the entrance to be checked in" />
      {cardQuery.isLoading ? (
        <LoadingList count={1} height={320} />
      ) : cardQuery.isError || !card ? (
        <ErrorState title="Could not load your card" onRetry={() => cardQuery.refetch()} />
      ) : (
        <AppCard>
          <View style={styles.center}>
            {/* QR codes scan best dark-on-white, whatever the app theme. */}
            <View style={styles.qr} accessible accessibilityLabel="Your check-in card QR code">
              <QRCode value={card.qr_text} size={240} color="#000000" backgroundColor="#FFFFFF" />
            </View>
            <AppText variant="title" style={styles.code} selectable>
              {card.code}
            </AppText>
            <AppText variant="small" tone="muted" style={styles.hint}>
              If it doesn&apos;t scan, turn your screen brightness up.
            </AppText>
          </View>
        </AppCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: Space.md },
  qr: { padding: Space.md, backgroundColor: '#FFFFFF', borderRadius: 12 },
  code: { fontFamily: 'monospace', letterSpacing: 3 },
  hint: { textAlign: 'center' },
});
