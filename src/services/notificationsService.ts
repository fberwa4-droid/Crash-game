import type { Notification, NotificationType } from '../data/types';
import { makeId, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export function pushNotificationInternal(params: {
  recipientId: string;
  type: NotificationType;
  actorId: string;
  targetType: Notification['targetType'];
  targetId: string;
  note?: string;
}): void {
  const { recipientId, type, actorId, targetType, targetId, note } = params;
  if (!recipientId || recipientId === actorId) return;

  const state = store.getState();
  // Respect notification preferences for current user
  if (state.session.currentUserId === recipientId && state.notificationPrefs[type] === false) {
    return;
  }

  // Group like and follow notifications on same target if recent & unread or existing
  const canGroup = type === 'like' || type === 'follow' || type === 'repost';
  if (canGroup) {
    const existingIdx = state.notifications.findIndex(
      (n) =>
        n.recipientId === recipientId &&
        n.type === type &&
        n.targetType === targetType &&
        n.targetId === targetId &&
        !n.read,
    );
    if (existingIdx !== -1) {
      store.setState((prev) => {
        const next = [...prev.notifications];
        const target = next[existingIdx];
        const actorIds = target.actorIds.includes(actorId)
          ? target.actorIds
          : [actorId, ...target.actorIds];
        next[existingIdx] = {
          ...target,
          actorIds,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, notifications: next };
      });
      return;
    }
  }

  const notification: Notification = {
    id: makeId('notif'),
    recipientId,
    type,
    actorIds: [actorId],
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
    read: false,
    note,
  };

  store.setState((prev) => ({
    ...prev,
    notifications: [notification, ...prev.notifications],
  }));
}

export const notificationsService = {
  listForCurrentUser(): Promise<Notification[]> {
    return withLatency(() => {
      const state = store.getState();
      const user = getCurrentUser(state);
      if (!user) return [];
      return state.notifications
        .filter((n) => n.recipientId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  },

  getUnreadCount(): number {
    const state = store.getState();
    const user = getCurrentUser(state);
    if (!user) return 0;
    return state.notifications.filter((n) => n.recipientId === user.id && !n.read).length;
  },

  markAsRead(notificationId: string): Promise<void> {
    return withLatency(() => {
      store.setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
      }));
    });
  },

  markAllAsRead(): Promise<void> {
    return withLatency(() => {
      const user = getCurrentUser(store.getState());
      if (!user) return;
      store.setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.recipientId === user.id ? { ...n, read: true } : n,
        ),
      }));
    });
  },
};
