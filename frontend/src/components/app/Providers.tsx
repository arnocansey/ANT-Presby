'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import AuthBootstrap from '@/components/auth/AuthBootstrap';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--card))',
              color: 'rgb(var(--foreground))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
