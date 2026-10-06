import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import PushRegistration from '@/components/push-registration';
import { queryClient } from '@/lib/query-client';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PushRegistration />
      {children}
    </QueryClientProvider>
  );
}
