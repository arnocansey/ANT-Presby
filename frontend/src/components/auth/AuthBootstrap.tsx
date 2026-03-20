'use client';

import { useEffect } from 'react';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function AuthBootstrap() {
  const { setUser, setIsAuthenticated, setIsLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/auth/me');
        if (!mounted) return;

        const user = response.data?.data || null;
        setUser(user);
        setIsAuthenticated(Boolean(user));

        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch {
        if (!mounted) return;
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [setIsAuthenticated, setIsLoading, setUser]);

  return null;
}
