import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

export type AuthRole = 'USER' | 'GARAGE_OWNER' | 'ADMIN';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: AuthRole;
  avatar?: string;
  isBlocked?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (payload: Record<string, unknown>) => Promise<{ message: string }>;
  registerGarageOwner: (payload: Record<string, unknown>) => Promise<{ message: string }>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  loginWithGoogle: (idToken: string, role: AuthRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

const readStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)));
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    setIsAuthenticated(false);
  };

  const persistSession = (authData: { user: AuthUser; accessToken: string; refreshToken: string }) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));
    setUser(authData.user);
    setIsAuthenticated(true);
  };

  const refreshAuth = async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!storedToken) {
      clearSession();
      return;
    }

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
      const payload = response.data?.data;
      if (payload?.user) {
        persistSession({
          user: payload.user,
          accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || '',
          refreshToken: storedToken,
        });
      }
    } catch {
      clearSession();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        await refreshAuth();
      } finally {
        setLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.USER_LOGIN, { email, password });
    const payload = response.data?.data;

    if (!payload?.user || !payload?.accessToken || !payload?.refreshToken) {
      throw new Error('Authentication response was incomplete');
    }

    persistSession(payload);
  };

  const registerUser = async (payload: Record<string, unknown>): Promise<{ message: string }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.USER_REGISTER, payload);
    return {
      message: response.data?.message || 'Account created successfully. Please sign in to continue.',
    };
  };

  const registerGarageOwner = async (payload: Record<string, unknown>): Promise<{ message: string }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.GARAGE_REGISTER, payload);
    return {
      message: response.data?.message || 'Registration submitted successfully. Please sign in to view your verification status.',
    };
  };

  const adminLogin = async (email: string, password: string) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.ADMIN_LOGIN, { email, password });
    const payload = response.data?.data;

    if (!payload?.user || !payload?.accessToken || !payload?.refreshToken) {
      throw new Error('Authentication response was incomplete');
    }

    persistSession(payload);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } catch {
      // Ignore logout errors and clear session locally.
    } finally {
      clearSession();
    }
  };

  const loginWithGoogle = async (idToken: string, role: AuthRole) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.GOOGLE_AUTH, { idToken, role });
    const payload = response.data?.data;

    if (!payload?.user || !payload?.accessToken || !payload?.refreshToken) {
      throw new Error('Google authentication response was incomplete');
    }

    persistSession(payload);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      loading,
      login,
      registerUser,
      registerGarageOwner,
      adminLogin,
      logout,
      refreshAuth,
      loginWithGoogle,
    }),
    [user, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
