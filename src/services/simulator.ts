import { SIMULATOR_POST_POOL } from '../data/seed';
import type { Post } from '../data/types';
import { makeId } from './latency';
import { pushNotificationInternal } from './notificationsService';
import { getCurrentUser, store } from './store';

class AmbientCommunitySimulator {
  private timerId: number | null = null;
  private poolIndex = 0;
  private running = false;

  start(): void {
    if (this.running || typeof window === 'undefined') return;
    this.running = true;
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    document.removeEventListener('visibilitychange', this.handleVisibility);
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private handleVisibility = (): void => {
    if (document.hidden) {
      if (this.timerId !== null) {
        window.clearTimeout(this.timerId);
        this.timerId = null;
      }
    } else if (this.running) {
      this.scheduleNext();
    }
  };

  private scheduleNext(): void {
    if (!this.running || document.hidden) return;
    const delayMs = 20_000 + Math.floor(Math.random() * 20_000);
    this.timerId = window.setTimeout(() => {
      this.tick();
      this.scheduleNext();
    }, delayMs);
  }

  private tick(): void {
    const state = store.getState();
    if (!state.simulatorEnabled || document.hidden) return;

    const currentUser = getCurrentUser(state);
    const candidates = SIMULATOR_POST_POOL.filter(
      (item) => !currentUser || item.authorId !== currentUser.id,
    );
    if (candidates.length === 0) return;

    const picked = candidates[this.poolIndex % candidates.length];
    this.poolIndex += 1;

    const newPost: Post = {
      id: makeId('p_sim'),
      authorId: picked.authorId,
      body: picked.body,
      createdAt: new Date().toISOString(),
      kind: 'original',
      topicTags: picked.topicTags,
      mentions: [],
      images: [],
      status: 'visible',
      views: Math.floor(Math.random() * 140) + 12,
      baseLikesCount: Math.floor(Math.random() * 14) + 1,
      baseRepostsCount: Math.floor(Math.random() * 3),
      baseRepliesCount: 0,
      baseBookmarksCount: Math.floor(Math.random() * 4),
      origin: 'system',
    };

    store.setState((prev) => ({
      ...prev,
      posts: [newPost, ...prev.posts],
    }));

    // Occasionally interact with the current user's posts to generate real notifications
    if (currentUser && Math.random() < 0.35) {
      const myPosts = state.posts.filter(
        (p) => p.authorId === currentUser.id && p.status === 'visible' && p.kind !== 'repost',
      );
      if (myPosts.length > 0) {
        const target = myPosts[Math.floor(Math.random() * myPosts.length)];
        const actor = picked.authorId;
        const alreadyLiked = state.likes.some(
          (l) => l.userId === actor && l.postId === target.id,
        );
        if (!alreadyLiked) {
          store.setState((prev) => ({
            ...prev,
            likes: [
              ...prev.likes,
              {
                userId: actor,
                postId: target.id,
                createdAt: new Date().toISOString(),
                origin: 'system',
              },
            ],
          }));
          pushNotificationInternal({
            recipientId: currentUser.id,
            type: 'like',
            actorId: actor,
            targetType: 'post',
            targetId: target.id,
            origin: 'system',
          });
        }
      }
    }
  }
}

export const ambientSimulator = new AmbientCommunitySimulator();
