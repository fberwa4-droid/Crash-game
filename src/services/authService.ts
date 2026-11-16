import type { User, UserRole } from '../data/types';
import { makeId, ServiceError, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export interface RegisterInput {
  displayName: string;
  handle: string;
  email: string;
  password: string;
  acknowledgePublic: boolean;
  inviteCode?: string;
}

export interface LoginInput {
  identifier: string; // email or @handle
  password: string;
}

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export const authService = {
  getSessionUser(): User | null {
    return getCurrentUser(store.getState());
  },

  login(input: LoginInput): Promise<User> {
    return withLatency(() => {
      const idOrHandle = input.identifier.trim().toLowerCase().replace(/^@/, '');
      if (!idOrHandle || !input.password) {
        throw new ServiceError('Enter your handle or email and password.', 'INVALID_INPUT');
      }
      const state = store.getState();
      const user = state.users.find(
        (u) =>
          u.email.toLowerCase() === idOrHandle ||
          u.handle.toLowerCase() === idOrHandle,
      );
      if (!user || user.mockPassword !== input.password) {
        throw new ServiceError('Invalid handle/email or password.', 'AUTH_FAILED');
      }
      store.setState((prev) => ({
        ...prev,
        session: {
          currentUserId: user.id,
          loggedInAt: new Date().toISOString(),
        },
      }));
      return user;
    });
  },

  register(input: RegisterInput): Promise<User> {
    return withLatency(() => {
      const state = store.getState();
      const displayName = input.displayName.trim();
      const handle = normalizeHandle(input.handle);
      const email = input.email.trim().toLowerCase();

      if (displayName.length < 2) {
        throw new ServiceError('Display name must be at least 2 characters.', 'INVALID_NAME');
      }
      if (!/^[a-z0-9._]{3,24}$/.test(handle)) {
        throw new ServiceError(
          'Handle must be 3–24 characters using letters, numbers, dots, or underscores.',
          'INVALID_HANDLE',
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ServiceError('Please enter a valid email address.', 'INVALID_EMAIL');
      }
      if (input.password.length < 6) {
        throw new ServiceError('Password must be at least 6 characters.', 'INVALID_PASSWORD');
      }
      if (!input.acknowledgePublic) {
        throw new ServiceError(
          'Please acknowledge that identities and posts on Commons are public.',
          'ACK_REQUIRED',
        );
      }
      if (state.settings.registrationMode === 'invite-only') {
        const expected = state.settings.inviteCode.trim().toUpperCase();
        if ((input.inviteCode ?? '').trim().toUpperCase() !== expected) {
          throw new ServiceError('Valid invite code is required while registration is invite-only.', 'INVALID_INVITE');
        }
      }
      if (state.users.some((u) => u.handle.toLowerCase() === handle)) {
        throw new ServiceError(`The handle @${handle} is already taken.`, 'DUPLICATE_HANDLE');
      }
      if (state.users.some((u) => u.email.toLowerCase() === email)) {
        throw new ServiceError('An account with that email already exists.', 'DUPLICATE_EMAIL');
      }

      const newUser: User = {
        id: makeId('u'),
        handle,
        displayName,
        email,
        mockPassword: input.password,
        role: 'member',
        status: 'active',
        bio: '',
        location: '',
        link: '',
        joinedAt: new Date().toISOString(),
        avatarSeed: Math.floor(Math.random() * 16) + 1,
        bannerSeed: Math.floor(Math.random() * 16) + 10,
        interestTopics: [],
        verified: false,
        baseFollowersCount: 0,
        baseFollowingCount: 0,
        origin: 'user',
      };

      store.setState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        session: {
          currentUserId: newUser.id,
          loggedInAt: new Date().toISOString(),
        },
      }));

      return newUser;
    });
  },

  loginAsDemo(role: UserRole): Promise<User> {
    return withLatency(() => {
      const targetId =
        role === 'admin'
          ? 'u_demo_admin'
          : role === 'moderator'
            ? 'u_demo_mod'
            : 'u_demo_member';
      const user = store.getState().users.find((u) => u.id === targetId);
      if (!user) {
        throw new ServiceError('Demo account not found.', 'NOT_FOUND');
      }
      store.setState((prev) => ({
        ...prev,
        session: {
          currentUserId: user.id,
          loggedInAt: new Date().toISOString(),
        },
      }));
      return user;
    });
  },

  logout(): Promise<void> {
    return withLatency(() => {
      store.setState((prev) => ({
        ...prev,
        session: {
          currentUserId: null,
          loggedInAt: null,
        },
      }));
    }, 60, 120);
  },
};
