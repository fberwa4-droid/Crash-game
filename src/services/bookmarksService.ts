import { ServiceError, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export const bookmarksService = {
  isBookmarkedSync(targetType: 'post' | 'doc', targetId: string): boolean {
    const state = store.getState();
    const user = getCurrentUser(state);
    if (!user) return false;
    return state.bookmarks.some(
      (b) => b.userId === user.id && b.targetType === targetType && b.targetId === targetId,
    );
  },

  toggleBookmark(targetType: 'post' | 'doc', targetId: string): Promise<boolean> {
    return withLatency(() => {
      const state = store.getState();
      const user = getCurrentUser(state);
      if (!user) throw new ServiceError('Please log in to bookmark.', 'UNAUTHENTICATED');
      if (user.status === 'suspended') {
        throw new ServiceError('Suspended accounts cannot bookmark items.', 'USER_SUSPENDED');
      }

      const exists = state.bookmarks.some(
        (b) => b.userId === user.id && b.targetType === targetType && b.targetId === targetId,
      );
      store.setState((prev) => ({
        ...prev,
        bookmarks: exists
          ? prev.bookmarks.filter(
              (b) => !(b.userId === user.id && b.targetType === targetType && b.targetId === targetId),
            )
          : [
              ...prev.bookmarks,
              {
                userId: user.id,
                targetType,
                targetId,
                createdAt: new Date().toISOString(),
                origin: 'user',
              },
            ],
      }));
      return !exists;
    }, 60, 140);
  },
};
