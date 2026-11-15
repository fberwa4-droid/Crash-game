import { STORAGE_NAMESPACE } from '../config';
import type { CommonsStoreState, Post, User } from '../data/types';
import { clearAndReseedStorage, loadStoreState, saveStoreState, writeThemeKey } from './storage';

type Listener = () => void;

class CommonsStore {
  private state: CommonsStoreState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = loadStoreState();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (!event.key || event.key.startsWith(STORAGE_NAMESPACE)) {
          this.state = loadStoreState();
          this.emit();
        }
      });
    }
  }

  getState = (): CommonsStoreState => {
    return this.state;
  };

  setState(updater: (prev: CommonsStoreState) => CommonsStoreState): CommonsStoreState {
    const next = updater(this.state);
    this.state = next;
    saveStoreState(next);
    this.emit();
    return next;
  }

  setThemePreference(theme: CommonsStoreState['theme']): void {
    writeThemeKey(theme);
    this.state = { ...this.state, theme };
    this.emit();
  }

  resetDemoData(): CommonsStoreState {
    const fresh = clearAndReseedStorage();
    this.state = fresh;
    this.emit();
    return fresh;
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}

export const store = new CommonsStore();

// Pure selector helpers (derived from stored records + seeded baselines)
export function getCurrentUser(state: CommonsStoreState): User | null {
  if (!state.session.currentUserId) return null;
  return state.users.find((u) => u.id === state.session.currentUserId) ?? null;
}

export function getPostTargetId(post: Post): string {
  return post.kind === 'repost' && post.repostOfId ? post.repostOfId : post.id;
}

export function getPostCounts(state: CommonsStoreState, postId: string) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) {
    return { likes: 0, reposts: 0, replies: 0, bookmarks: 0, quotes: 0 };
  }
  const extraLikes = state.likes.filter((l) => l.postId === postId).length;
  const extraReposts = state.reposts.filter((r) => r.postId === postId).length;
  const extraBookmarks = state.bookmarks.filter(
    (b) => b.targetType === 'post' && b.targetId === postId,
  ).length;
  const visibleReplies = state.posts.filter(
    (p) => p.status === 'visible' && p.kind === 'reply' && p.parentId === postId,
  ).length;
  const quotesCount = state.posts.filter(
    (p) => p.status === 'visible' && p.kind === 'quote' && p.quotedPostId === postId,
  ).length;

  return {
    likes: Math.max(0, post.baseLikesCount + extraLikes),
    reposts: Math.max(0, post.baseRepostsCount + extraReposts),
    replies: Math.max(0, Math.max(post.baseRepliesCount, visibleReplies)),
    bookmarks: Math.max(0, post.baseBookmarksCount + extraBookmarks),
    quotes: quotesCount,
  };
}

export function getUserFollowCounts(state: CommonsStoreState, userId: string) {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return { followers: 0, following: 0 };
  const addedFollowers = state.follows.filter((f) => f.followingId === userId).length;
  const addedFollowing = state.follows.filter((f) => f.followerId === userId).length;
  return {
    followers: Math.max(0, user.baseFollowersCount + addedFollowers),
    following: Math.max(0, user.baseFollowingCount + addedFollowing),
  };
}
