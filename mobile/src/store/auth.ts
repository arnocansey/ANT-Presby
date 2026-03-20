import { create } from 'zustand';
import { secureStorage } from '@/lib/storage';

type MobileUser = {
  id: number;
  email: string;
  role: 'admin' | 'member';
  first_name?: string;
  last_name?: string;
};

type AuthState = {
  user: MobileUser | null;
  token: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: MobileUser) => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  hydrate: async () => {
    try {
      const [token, rawUser] = await Promise.all([
        secureStorage.getAccessToken(),
        secureStorage.getUser(),
      ]);

      set({
        token: token || null,
        user: rawUser ? JSON.parse(rawUser) : null,
        isHydrated: true,
      });
    } catch {
      set({
        token: null,
        user: null,
        isHydrated: true,
      });
    }
  },
  setSession: async (token, user) => {
    await Promise.all([
      secureStorage.setAccessToken(token),
      secureStorage.setUser(JSON.stringify(user)),
    ]);

    set({ token, user });
  },
  clearSession: async () => {
    await Promise.all([
      secureStorage.clearAccessToken(),
      secureStorage.clearUser(),
    ]);

    set({ token: null, user: null });
  },
}));
