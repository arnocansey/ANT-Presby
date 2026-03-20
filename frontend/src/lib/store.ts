import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profileImageUrl?: string;
  profile_image_url?: string;
  role: 'member' | 'admin';
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
  hydrate: () => void;
}

/**
 * Authentication Store
 * Manages user state and authentication
 */
export const useAuthStore = create<AuthStore>()(
  immer((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    setUser: (user) =>
      set((state) => {
        state.user = user;
        state.isAuthenticated = user !== null;
      }),

    setIsAuthenticated: (value) =>
      set((state) => {
        state.isAuthenticated = value;
      }),

    setIsLoading: (value) =>
      set((state) => {
        state.isLoading = value;
      }),

    logout: () =>
      set((state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
      }),

    hydrate: () => {
      if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        if (user) {
          set((state) => {
            state.user = JSON.parse(user);
            state.isAuthenticated = true;
          });
        }
      }
    },
  }))
);

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

/**
 * UI Store
 * Manages UI state
 */
export const useUIStore = create<UIStore>()(
  immer((set) => ({
    sidebarOpen: true,
    theme: 'light',

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),
  }))
);
