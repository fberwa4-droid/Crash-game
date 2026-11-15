import type { AuditEntry, LibraryDocStatus, UserRole } from '../data/types';
import { makeId, ServiceError, withLatency } from './latency';
import { pushNotificationInternal } from './notificationsService';
import { getCurrentUser, store } from './store';

function requireRole(minRole: 'moderator' | 'admin') {
  const user = getCurrentUser(store.getState());
  if (!user) throw new ServiceError('Authentication required.', 'UNAUTHENTICATED');
  if (minRole === 'admin' && user.role !== 'admin') {
    throw new ServiceError('Admin access required.', 'FORBIDDEN');
  }
  if (minRole === 'moderator' && user.role !== 'moderator' && user.role !== 'admin') {
    throw new ServiceError('Moderator or admin access required.', 'FORBIDDEN');
  }
  return user;
}

function appendAudit(
  actorId: string,
  action: string,
  targetType: AuditEntry['targetType'],
  targetId: string,
  note: string,
): AuditEntry {
  return {
    id: makeId('audit'),
    actorId,
    action,
    targetType,
    targetId,
    note,
    createdAt: new Date().toISOString(),
  };
}

export const adminService = {
  listAuditLog(): Promise<AuditEntry[]> {
    return withLatency(() => {
      requireRole('admin');
      return store.getState().auditLog;
    });
  },

  reviewLibraryDoc(
    docId: string,
    decision: Extract<LibraryDocStatus, 'published' | 'changes_requested' | 'rejected'>,
    note: string,
  ): Promise<void> {
    return withLatency(() => {
      const actor = requireRole('moderator');
      if (decision !== 'published' && note.trim().length < 3) {
        throw new ServiceError('A review note is required when requesting changes or rejecting.', 'NOTE_REQUIRED');
      }
      const state = store.getState();
      const doc = state.library.find((d) => d.id === docId);
      if (!doc) throw new ServiceError('Document not found.', 'NOT_FOUND');

      const entry = appendAudit(actor.id, `library_${decision}`, 'doc', docId, note.trim() || 'Approved for publication');
      store.setState((prev) => ({
        ...prev,
        library: prev.library.map((d) =>
          d.id === docId ? { ...d, status: decision, reviewNote: note.trim() || undefined } : d,
        ),
        auditLog: [entry, ...prev.auditLog],
      }));

      doc.authorIds.forEach((authorId) =>
        pushNotificationInternal({
          recipientId: authorId,
          type: 'library_decision',
          actorId: actor.id,
          targetType: 'doc',
          targetId: docId,
          note:
            decision === 'published'
              ? `"${doc.title}" was approved and published to the Library.`
              : `Review update on "${doc.title}": ${note.trim()}`,
        }),
      );
    });
  },

  updateUserRole(userId: string, role: UserRole, note = 'Role updated'): Promise<void> {
    return withLatency(() => {
      const actor = requireRole('admin');
      const entry = appendAudit(actor.id, 'user_role_change', 'user', userId, `${role}: ${note}`);
      store.setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
        auditLog: [entry, ...prev.auditLog],
      }));
    });
  },

  toggleSuspendUser(userId: string, suspend: boolean, note: string): Promise<void> {
    return withLatency(() => {
      const actor = requireRole('moderator');
      const entry = appendAudit(actor.id, suspend ? 'user_suspend' : 'user_unsuspend', 'user', userId, note);
      store.setState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId ? { ...u, status: suspend ? 'suspended' : 'active' } : u,
        ),
        auditLog: [entry, ...prev.auditLog],
      }));
      pushNotificationInternal({
        recipientId: userId,
        type: 'moderation',
        actorId: actor.id,
        targetType: 'system',
        targetId: userId,
        note: suspend ? `Account suspended: ${note}` : `Account restored: ${note}`,
      });
    });
  },
};
