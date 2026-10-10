import React from 'react';
import { router } from 'expo-router';

import {
  ErrorState,
  ListGroup,
  ListRow,
  LoadingList,
  Screen,
  ScreenHeader,
  SignInPrompt,
  StatGrid,
  StatTile,
  statusTone,
} from '@/components/kit';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useMyDonations } from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

export default function DonationsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch } = useMyDonations(Boolean(user));
  const donations = Array.isArray(data) ? data : [];
  const completed = donations.filter((item: any) => String(item.status || '').toLowerCase() === 'completed').length;

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="Donation history" />
        <SignInPrompt
          icon="receipt-outline"
          title="Sign in to see your giving"
          message="Your donations and their payment status appear here."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back title="Donation history" subtitle="Your recent gifts and their status" />

      <StatGrid>
        <StatTile label="Total" value={donations.length} icon="receipt-outline" />
        <StatTile label="Completed" value={completed} icon="checkmark-circle-outline" />
      </StatGrid>

      <AppButton label="Make a donation" onPress={() => router.push('/donate')} />

      {isLoading ? (
        <LoadingList />
      ) : isError ? (
        <ErrorState title="Could not load your donations" onRetry={() => refetch()} />
      ) : donations.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No donations yet" message="Your completed and pending giving will appear here." />
      ) : (
        <ListGroup>
          {donations.map((item: any) => (
            <ListRow
              key={String(item.id)}
              label={formatCedis(item.amount)}
              description={[
                item.donation_type || item.donationType || 'general',
                item.payment_method || item.paymentMethod || 'payment',
                item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent donation',
              ].join(' · ')}
              trailing={<AppBadge tone={statusTone(item.status || 'pending')}>{String(item.status || 'pending')}</AppBadge>}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}
