import type { User } from '../data/types';
import { ServiceError, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export interface UpdateProfileInput {
  displayName: string;
  bio: string;
  location: string;
  link: string;
  interestTopics: string[];
  avatarSeed?: number;
}

export const usersService = {
  getById(id: string): User | undefined {
    return store.getState().users.find((u) => u.id === id);
  },

  getByHandle(handle: string): User | undefined {
    const clean = handle.replace(/^@/, '').toLowerCase();
    return store.getState().users.find((u) => u.handle.toLowerCase() === clean);
  },

  listAll(): Promise<User[]> {
    return withLatency(() => store.getState().users);
  },

  getSuggestedUsers(limit = 3): User[] {
    const state = store.getState();
    const current = getCurrentUser(state);
    const followedSet = new Set(
      current
        ? state.follows
            .filter((f) => f.followerId === current.id)
            .map((f) => f.followingId)
        : [],
    );
    return state.users
      .filter(
        (u) =>
          u.status === 'active' &&
          (!current || u.id !== current.id) &&
          !followedSet.has(u.id),
      )
      .slice(0, limit);
  },

  updateOwnProfile(input: UpdateProfileInput): Promise<User> {
    return withLatency(() => {
      const state = store.getState();
      const current = getCurrentUser(state);
      if (!current) throw new ServiceError('Authentication required.', 'UNAUTHENTICATED');
      if (input.displayName.trim().length < 2) {
        throw new ServiceError('Display name must be at least 2 characters.', 'INVALID_NAME');
      }
      let updatedUser: User | null = null;
      store.setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => {
          if (u.id !== current.id) return u;
          updatedUser = {
            ...u,
            displayName: input.displayName.trim(),
            bio: input.bio.trim(),
            location: input.location.trim(),
            link: input.link.trim(),
            interestTopics: input.interestTopics,
            avatarSeed: input.avatarSeed ?? u.avatarSeed,
          };
          return updatedUser;
        }),
      }));
      if (!updatedUser) throw new ServiceError('User not found.', 'NOT_FOUND');
      return updatedUser;
    });
  },
};
