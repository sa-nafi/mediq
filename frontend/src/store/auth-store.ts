import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export interface User {
  id: number;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isInitialized: boolean;
  setAccessToken: (token: string | null) => void;
  isAuthenticated: () => boolean;
  clearAuth: () => void;
  init: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  setAccessToken: (token) => {
    let user: User | null = null;
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        user = {
          id: decoded.user_id,
          role: decoded.role,
        };
      } catch (err) {
        console.error('Failed to decode JWT', err);
      }
    }
    set({ accessToken: token, user });
  },
  isAuthenticated: () => !!get().accessToken,
  clearAuth: () => set({ accessToken: null, user: null }),
  init: async () => {
    if (get().isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        get().setAccessToken(data.access_token);
      } catch (error) {
        console.error('Session refresh failed:', error);
        get().clearAuth();
      } finally {
        set({ isInitialized: true });
        initPromise = null;
      }
    })();

    return initPromise;
  },
}));
