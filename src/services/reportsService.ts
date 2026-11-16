import type { Report } from '../data/types';
import { makeId, ServiceError, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export const reportsService = {
  createReport(targetType: 'post' | 'doc', targetId: string, reason: string): Promise<Report> {
    return withLatency(() => {
      const state = store.getState();
      const user = getCurrentUser(state);
      if (!user) throw new ServiceError('Log in to report content.', 'UNAUTHENTICATED');
      if (user.status === 'suspended') {
        throw new ServiceError('Suspended accounts cannot submit reports.', 'USER_SUSPENDED');
      }
      const trimmed = reason.trim();
      if (trimmed.length < 4) {
        throw new ServiceError('Please provide a brief reason for your report.', 'INVALID_REASON');
      }

      const existing = state.reports.find(
        (r) => r.targetType === targetType && r.targetId === targetId && r.status === 'open',
      );
      if (existing) {
        const updated: Report = {
          ...existing,
          reporterIds: existing.reporterIds.includes(user.id)
            ? existing.reporterIds
            : [...existing.reporterIds, user.id],
        };
        store.setState((prev) => ({
          ...prev,
          reports: prev.reports.map((r) => (r.id === existing.id ? updated : r)),
        }));
        return updated;
      }

      const report: Report = {
        id: makeId('r'),
        targetType,
        targetId,
        reporterIds: [user.id],
        reason: trimmed,
        status: 'open',
        createdAt: new Date().toISOString(),
        origin: 'user',
      };
      store.setState((prev) => ({
        ...prev,
        reports: [report, ...prev.reports],
      }));
      return report;
    });
  },

  listReports(): Promise<Report[]> {
    return withLatency(() => {
      const user = getCurrentUser(store.getState());
      if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
        throw new ServiceError('Moderator or admin access required.', 'FORBIDDEN');
      }
      return store.getState().reports;
    });
  },
};
