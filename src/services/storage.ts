import { SCHEMA_VERSION, STORAGE_NAMESPACE } from '../config';
import { createSeedState } from '../data/seed';
import type { CommonsStoreState, ThemePreference } from '../data/types';

export type StorageErrorListener = (message: string) => void;

const errorListeners = new Set<StorageErrorListener>();

export function onStorageError(listener: StorageErrorListener): () => void {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

function emitStorageError(message: string) {
  errorListeners.forEach((fn) => fn(message));
}

function key(name: string): string {
  return `${STORAGE_NAMESPACE}${name}`;
}

function safeRead<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(name: string, value: unknown): boolean {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
    emitStorageError(
      isQuota
        ? 'Browser storage quota reached. Some local changes could not be saved.'
        : 'Could not persist changes to browser storage.',
    );
    return false;
  }
}

function readTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(key('theme'));
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed === 'light' || parsed === 'dark' || parsed === 'system') return parsed;
    }
  } catch {
    // ignore
  }
  return 'system';
}

export function writeThemeKey(theme: ThemePreference): void {
  try {
    if (theme === 'system') {
      localStorage.removeItem(key('theme'));
    } else {
      localStorage.setItem(key('theme'), theme);
    }
  } catch {
    emitStorageError('Could not save theme preference.');
  }
}

export function loadStoreState(): CommonsStoreState {
  const existingVersion = safeRead<number | null>('schemaVersion', null);
  if (existingVersion === null) {
    const seed = createSeedState();
    saveStoreState(seed);
    return seed;
  }

  const seed = createSeedState();
  const interactions = safeRead<{
    likes: CommonsStoreState['likes'];
    reposts: CommonsStoreState['reposts'];
    topicFollows: CommonsStoreState['topicFollows'];
    mutes: CommonsStoreState['mutes'];
  }>('interactions', {
    likes: seed.likes,
    reposts: seed.reposts,
    topicFollows: seed.topicFollows,
    mutes: seed.mutes,
  });

  const state: CommonsStoreState = {
    schemaVersion: existingVersion,
    session: safeRead('session', seed.session),
    users: safeRead('users', seed.users),
    posts: safeRead('posts', seed.posts),
    likes: interactions.likes ?? seed.likes,
    reposts: interactions.reposts ?? seed.reposts,
    bookmarks: safeRead('bookmarks', seed.bookmarks),
    follows: safeRead('follows', seed.follows),
    topicFollows: interactions.topicFollows ?? seed.topicFollows,
    mutes: interactions.mutes ?? seed.mutes,
    notifications: safeRead('notifications', seed.notifications),
    library: safeRead('library', seed.library),
    reports: safeRead('reports', seed.reports),
    auditLog: safeRead('auditLog', seed.auditLog),
    topics: safeRead('topics', seed.topics),
    settings: safeRead('settings', seed.settings),
    notificationPrefs: safeRead('notificationPrefs', seed.notificationPrefs),
    drafts: safeRead('drafts', seed.drafts),
    recentSearches: safeRead('recentSearches', seed.recentSearches),
    theme: readTheme(),
    simulatorEnabled: safeRead('simulatorEnabled', seed.simulatorEnabled),
  };

  if (state.schemaVersion < SCHEMA_VERSION) {
    state.schemaVersion = SCHEMA_VERSION;
    saveStoreState(state);
  }

  return state;
}

export function saveStoreState(state: CommonsStoreState): void {
  safeWrite('schemaVersion', state.schemaVersion);
  safeWrite('session', state.session);
  safeWrite('users', state.users);
  safeWrite('posts', state.posts);
  safeWrite('interactions', {
    likes: state.likes,
    reposts: state.reposts,
    topicFollows: state.topicFollows,
    mutes: state.mutes,
  });
  safeWrite('bookmarks', state.bookmarks);
  safeWrite('follows', state.follows);
  safeWrite('notifications', state.notifications);
  safeWrite('library', state.library);
  safeWrite('reports', state.reports);
  safeWrite('auditLog', state.auditLog);
  safeWrite('topics', state.topics);
  safeWrite('settings', state.settings);
  safeWrite('notificationPrefs', state.notificationPrefs);
  safeWrite('drafts', state.drafts);
  safeWrite('recentSearches', state.recentSearches);
  safeWrite('simulatorEnabled', state.simulatorEnabled);
}

export function clearAndReseedStorage(): CommonsStoreState {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_NAMESPACE)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    emitStorageError('Could not clear browser storage.');
  }
  const fresh = createSeedState();
  saveStoreState(fresh);
  return fresh;
}
