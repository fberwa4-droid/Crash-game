import type { NotificationPrefs, PlatformSettings, ThemePreference } from '../data/types';
import { ServiceError, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export const settingsService = {
  getSettings(): PlatformSettings {
    return store.getState().settings;
  },

  updatePlatformSettings(patch: Partial<Pick<PlatformSettings, 'brandName' | 'registrationMode' | 'inviteCode'>>): Promise<PlatformSettings> {
    return withLatency(() => {
      const user = getCurrentUser(store.getState());
      if (!user || user.role !== 'admin') {
        throw new ServiceError('Admin access required.', 'FORBIDDEN');
      }
      let nextSettings: PlatformSettings | null = null;
      store.setState((prev) => {
        nextSettings = { ...prev.settings, ...patch };
        return { ...prev, settings: nextSettings };
      });
      return nextSettings!;
    });
  },

  getTheme(): ThemePreference {
    return store.getState().theme;
  },

  setTheme(theme: ThemePreference): void {
    store.setThemePreference(theme);
  },

  setSimulatorEnabled(enabled: boolean): void {
    store.setState((prev) => ({ ...prev, simulatorEnabled: enabled }));
  },

  updateNotificationPrefs(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    return withLatency(() => {
      let updated: NotificationPrefs | null = null;
      store.setState((prev) => {
        updated = { ...prev.notificationPrefs, ...patch };
        return { ...prev, notificationPrefs: updated };
      });
      return updated!;
    });
  },

  resetDemoData(): Promise<void> {
    return withLatency(() => {
      store.resetDemoData();
    }, 80, 150);
  },
};
