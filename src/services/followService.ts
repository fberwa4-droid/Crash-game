import { ServiceError, withLatency } from './latency';
import { pushNotificationInternal } from './notificationsService';
import { getCurrentUser, store } from './store';

function requireActive() {
  const state = store.getState();
  const user = getCurrentUser(state);
  if (!user) throw new ServiceError('Please log in to follow accounts.', 'UNAUTHENTICATED');
  if (user.status === 'suspended') {
    throw new ServiceError('Suspended accounts cannot perform this action.', 'USER_SUSPENDED');
  }
  return { state, user };
}

export const followService = {
  isFollowingSync(targetUserId: string): boolean {
    const state = store.getState();
    const user = getCurrentUser(state);
    if (!user) return false;
    return state.follows.some(
      (f) => f.followerId === user.id && f.followingId === targetUserId,
    );
  },

  toggleFollow(targetUserId: string): Promise<boolean> {
    return withLatency(() => {
      const { state, user } = requireActive();
      if (user.id === targetUserId) {
        throw new ServiceError('You cannot follow yourself.', 'INVALID_ACTION');
      }
      const targetExists = state.users.some((u) => u.id === targetUserId);
      if (!targetExists) {
        throw new ServiceError('Account not found.', 'NOT_FOUND');
      }
      const already = state.follows.some(
        (f) => f.followerId === user.id && f.followingId === targetUserId,
      );
      store.setState((prev) => ({
        ...prev,
        follows: already
          ? prev.follows.filter(
              (f) => !(f.followerId === user.id && f.followingId === targetUserId),
            )
          : [
              ...prev.follows,
              {
                followerId: user.id,
                followingId: targetUserId,
                createdAt: new Date().toISOString(),
                origin: 'user',
              },
            ],
      }));
      if (!already) {
        pushNotificationInternal({
          recipientId: targetUserId,
          type: 'follow',
          actorId: user.id,
          targetType: 'user',
          targetId: targetUserId,
        });
      }
      return !already;
    }, 60, 140);
  },

  isFollowingTopicSync(slug: string): boolean {
    const state = store.getState();
    const user = getCurrentUser(state);
    if (!user) return false;
    return state.topicFollows.some(
      (tf) => tf.userId === user.id && tf.topicSlug === slug,
    );
  },

  toggleFollowTopic(slug: string): Promise<boolean> {
    return withLatency(() => {
      const { state, user } = requireActive();
      const already = state.topicFollows.some(
        (tf) => tf.userId === user.id && tf.topicSlug === slug,
      );
      store.setState((prev) => ({
        ...prev,
        topicFollows: already
          ? prev.topicFollows.filter(
              (tf) => !(tf.userId === user.id && tf.topicSlug === slug),
            )
          : [
              ...prev.topicFollows,
              {
                userId: user.id,
                topicSlug: slug,
                createdAt: new Date().toISOString(),
                origin: 'user',
              },
            ],
      }));
      return !already;
    }, 60, 140);
  },

  muteAccount(targetUserId: string): Promise<void> {
    return withLatency(() => {
      const { state, user } = requireActive();
      if (state.mutes.some((m) => m.userId === user.id && m.targetType === 'user' && m.targetValue === targetUserId)) {
        return;
      }
      store.setState((prev) => ({
        ...prev,
        mutes: [
          ...prev.mutes,
          {
            userId: user.id,
            targetType: 'user',
            targetValue: targetUserId,
            createdAt: new Date().toISOString(),
            origin: 'user',
          },
        ],
      }));
    });
  },

  unmuteAccount(targetUserId: string): Promise<void> {
    return withLatency(() => {
      const { user } = requireActive();
      store.setState((prev) => ({
        ...prev,
        mutes: prev.mutes.filter(
          (m) => !(m.userId === user.id && m.targetType === 'user' && m.targetValue === targetUserId),
        ),
      }));
    });
  },

  muteTopic(slug: string): Promise<void> {
    return withLatency(() => {
      const { state, user } = requireActive();
      if (state.mutes.some((m) => m.userId === user.id && m.targetType === 'topic' && m.targetValue === slug)) {
        return;
      }
      store.setState((prev) => ({
        ...prev,
        mutes: [
          ...prev.mutes,
          {
            userId: user.id,
            targetType: 'topic',
            targetValue: slug,
            createdAt: new Date().toISOString(),
            origin: 'user',
          },
        ],
      }));
    });
  },

  unmuteTopic(slug: string): Promise<void> {
    return withLatency(() => {
      const { user } = requireActive();
      store.setState((prev) => ({
        ...prev,
        mutes: prev.mutes.filter(
          (m) => !(m.userId === user.id && m.targetType === 'topic' && m.targetValue === slug),
        ),
      }));
    });
  },
};
