import React, { createContext, useCallback, useContext, useState } from 'react';
import type { AuthGateReason, User } from '../data/types';
import { authService } from '../services/authService';
import { getCurrentUser } from '../services/store';
import { useStore } from './useStore';
import { useToast } from './useToast';

export type AuthModalMode = 'join' | 'login';

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  reason?: AuthGateReason;
}

interface AuthContextValue {
  currentUser: User | null;
  authModal: AuthModalState;
  openAuthModal: (mode: AuthModalMode, reason?: AuthGateReason) => void;
  closeAuthModal: () => void;
  requireAuth: (reason: AuthGateReason, onAuthed: () => void) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useStore();
  const currentUser = getCurrentUser(state);
  const { showToast } = useToast();
  const [authModal, setAuthModal] = useState<AuthModalState>({
    open: false,
    mode: 'join',
  });

  const openAuthModal = useCallback((mode: AuthModalMode, reason?: AuthGateReason) => {
    setAuthModal({ open: true, mode, reason });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, open: false }));
  }, []);

  const requireAuth = useCallback(
    (reason: AuthGateReason, onAuthed: () => void) => {
      if (!currentUser) {
        openAuthModal('join', reason);
        return;
      }
      if (currentUser.status === 'suspended') {
        showToast({
          message: 'Your account is suspended from posting or interacting.',
          tone: 'error',
        });
        return;
      }
      onAuthed();
    },
    [currentUser, openAuthModal, showToast],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    showToast({ message: 'Signed out.' });
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authModal,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
