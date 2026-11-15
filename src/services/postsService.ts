import { MAX_POST_IMAGES, POST_CHAR_LIMIT } from '../config';
import type { Post, PostKind } from '../data/types';
import { makeId, ServiceError, withLatency } from './latency';
import { pushNotificationInternal } from './notificationsService';
import { getCurrentUser, store } from './store';

function extractHashtags(body: string): string[] {
  const matches = body.match(/#([A-Za-z0-9_]+)/g) ?? [];
  const state = store.getState();
  const slugs = new Set<string>();
  for (const raw of matches) {
    const clean = raw.slice(1).toLowerCase();
    const matchedTopic = state.topics.find(
      (t) =>
        t.slug === clean ||
        t.name.toLowerCase().replace(/\s+/g, '') === clean ||
        t.slug.replace(/-/g, '') === clean,
    );
    if (matchedTopic) {
      slugs.add(matchedTopic.mergedInto ?? matchedTopic.slug);
    }
  }
  return Array.from(slugs);
}

function extractMentions(body: string): string[] {
  const matches = body.match(/@([a-zA-Z0-9._]+)/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

export interface CreatePostInput {
  body: string;
  kind?: PostKind;
  parentId?: string;
  quotedPostId?: string;
  topicTags?: string[];
  images?: string[];
  libraryDocId?: string;
}

function assertActiveUser() {
  const state = store.getState();
  const user = getCurrentUser(state);
  if (!user) {
    throw new ServiceError('Please log in to continue.', 'UNAUTHENTICATED');
  }
  if (user.status === 'suspended') {
    throw new ServiceError(
      'Your account is suspended from posting or interacting.',
      'USER_SUSPENDED',
    );
  }
  return { state, user };
}

function filterMutedAndVisible(posts: Post[]): Post[] {
  const state = store.getState();
  const currentUser = getCurrentUser(state);
  const mutedUsers = new Set(
    currentUser
      ? state.mutes
          .filter((m) => m.userId === currentUser.id && m.targetType === 'user')
          .map((m) => m.targetValue)
      : [],
  );
  const mutedTopics = new Set(
    currentUser
      ? state.mutes
          .filter((m) => m.userId === currentUser.id && m.targetType === 'topic')
          .map((m) => m.targetValue)
      : [],
  );

  return posts.filter((post) => {
    if (post.status !== 'visible') return false;
    if (mutedUsers.has(post.authorId)) return false;
    if (post.topicTags.some((t) => mutedTopics.has(t))) return false;
    if (post.kind === 'repost' && post.repostOfId) {
      const target = state.posts.find((p) => p.id === post.repostOfId);
      if (!target || target.status !== 'visible' || mutedUsers.has(target.authorId)) {
        return false;
      }
    }
    return true;
  });
}

export const postsService = {
  listForYouSync(): Post[] {
    const state = store.getState();
    return filterMutedAndVisible(state.posts)
      .filter((p) => p.kind !== 'reply')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  listFollowingSync(fallbackUserId = 'u_demo_member'): Post[] {
    const state = store.getState();
    const currentUser = getCurrentUser(state);
    const referenceUserId = currentUser ? currentUser.id : fallbackUserId;
    const followedIds = new Set(
      state.follows
        .filter((f) => f.followerId === referenceUserId)
        .map((f) => f.followingId),
    );
    return filterMutedAndVisible(state.posts)
      .filter((p) => followedIds.has(p.authorId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  listForYou(): Promise<Post[]> {
    return withLatency(() => this.listForYouSync());
  },

  listFollowing(): Promise<Post[]> {
    return withLatency(() => this.listFollowingSync());
  },

  getById(postId: string): Promise<Post | null> {
    return withLatency(() => {
      return store.getState().posts.find((p) => p.id === postId) ?? null;
    });
  },

  create(input: CreatePostInput): Promise<Post> {
    return withLatency(() => {
      const { state, user } = assertActiveUser();
      const body = input.body.trim();
      if (!body && (!input.images || input.images.length === 0)) {
        throw new ServiceError('Write something before posting.', 'EMPTY_POST');
      }
      if (body.length > POST_CHAR_LIMIT) {
        throw new ServiceError(
          `Posts cannot exceed ${POST_CHAR_LIMIT} characters.`,
          'OVER_LIMIT',
        );
      }
      if ((input.images?.length ?? 0) > MAX_POST_IMAGES) {
        throw new ServiceError(`Up to ${MAX_POST_IMAGES} images allowed per post.`, 'TOO_MANY_IMAGES');
      }

      const tags = Array.from(
        new Set([...(input.topicTags ?? []), ...extractHashtags(body)]),
      );
      const mentions = extractMentions(body);
      const kind: PostKind = input.kind ?? (input.parentId ? 'reply' : input.quotedPostId ? 'quote' : 'original');

      let threadId = undefined;
      if (input.parentId) {
        const parent = state.posts.find((p) => p.id === input.parentId);
        threadId = parent?.threadId ?? parent?.id ?? input.parentId;
      }

      const post: Post = {
        id: makeId('p'),
        authorId: user.id,
        body,
        createdAt: new Date().toISOString(),
        kind,
        parentId: input.parentId,
        quotedPostId: input.quotedPostId,
        threadId,
        topicTags: tags,
        mentions,
        images: input.images ?? [],
        libraryDocId: input.libraryDocId,
        status: 'visible',
        views: 1,
        baseLikesCount: 0,
        baseRepostsCount: 0,
        baseRepliesCount: 0,
        baseBookmarksCount: 0,
      };

      store.setState((prev) => ({
        ...prev,
        posts: [post, ...prev.posts],
      }));

      // Side-effect notifications
      if (post.parentId) {
        const parent = state.posts.find((p) => p.id === post.parentId);
        if (parent) {
          pushNotificationInternal({
            recipientId: parent.authorId,
            type: 'reply',
            actorId: user.id,
            targetType: 'post',
            targetId: post.id,
          });
        }
      }
      if (post.quotedPostId) {
        const quoted = state.posts.find((p) => p.id === post.quotedPostId);
        if (quoted) {
          pushNotificationInternal({
            recipientId: quoted.authorId,
            type: 'quote',
            actorId: user.id,
            targetType: 'post',
            targetId: post.id,
          });
        }
      }
      for (const handle of mentions) {
        const mentionedUser = state.users.find((u) => u.handle.toLowerCase() === handle);
        if (mentionedUser) {
          pushNotificationInternal({
            recipientId: mentionedUser.id,
            type: 'mention',
            actorId: user.id,
            targetType: 'post',
            targetId: post.id,
          });
        }
      }
      if (post.libraryDocId) {
        const doc = state.library.find((d) => d.id === post.libraryDocId);
        if (doc) {
          doc.authorIds.forEach((authorId) =>
            pushNotificationInternal({
              recipientId: authorId,
              type: 'library_comment',
              actorId: user.id,
              targetType: 'doc',
              targetId: doc.id,
            }),
          );
        }
      }

      return post;
    });
  },

  deletePost(postId: string): Promise<void> {
    return withLatency(() => {
      const { state, user } = assertActiveUser();
      const post = state.posts.find((p) => p.id === postId);
      if (!post) throw new ServiceError('Post not found.', 'NOT_FOUND');
      if (post.authorId !== user.id && user.role === 'member') {
        throw new ServiceError('You can only delete your own posts.', 'FORBIDDEN');
      }
      store.setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, status: 'removed' } : p,
        ),
        bookmarks: prev.bookmarks.filter(
          (b) => !(b.targetType === 'post' && b.targetId === postId),
        ),
      }));
    });
  },

  toggleLike(postId: string): Promise<boolean> {
    return withLatency(() => {
      const { state, user } = assertActiveUser();
      const post = state.posts.find((p) => p.id === postId && p.status === 'visible');
      if (!post) throw new ServiceError('Post not found.', 'NOT_FOUND');

      const alreadyLiked = state.likes.some(
        (l) => l.userId === user.id && l.postId === postId,
      );
      store.setState((prev) => ({
        ...prev,
        likes: alreadyLiked
          ? prev.likes.filter((l) => !(l.userId === user.id && l.postId === postId))
          : [...prev.likes, { userId: user.id, postId, createdAt: new Date().toISOString() }],
      }));

      if (!alreadyLiked) {
        pushNotificationInternal({
          recipientId: post.authorId,
          type: 'like',
          actorId: user.id,
          targetType: 'post',
          targetId: postId,
        });
      }
      return !alreadyLiked;
    }, 60, 140);
  },

  toggleRepost(postId: string): Promise<boolean> {
    return withLatency(() => {
      const { state, user } = assertActiveUser();
      const post = state.posts.find((p) => p.id === postId && p.status === 'visible');
      if (!post) throw new ServiceError('Post not found.', 'NOT_FOUND');

      const alreadyReposted = state.reposts.some(
        (r) => r.userId === user.id && r.postId === postId,
      );

      store.setState((prev) => {
        const nextReposts = alreadyReposted
          ? prev.reposts.filter((r) => !(r.userId === user.id && r.postId === postId))
          : [...prev.reposts, { userId: user.id, postId, createdAt: new Date().toISOString() }];

        let nextPosts = prev.posts;
        if (alreadyReposted) {
          nextPosts = prev.posts.filter(
            (p) => !(p.kind === 'repost' && p.authorId === user.id && p.repostOfId === postId),
          );
        } else {
          const repostEntry: Post = {
            id: makeId('rp'),
            authorId: user.id,
            body: '',
            createdAt: new Date().toISOString(),
            kind: 'repost',
            repostOfId: postId,
            topicTags: post.topicTags,
            mentions: [],
            images: [],
            status: 'visible',
            views: 0,
            baseLikesCount: 0,
            baseRepostsCount: 0,
            baseRepliesCount: 0,
            baseBookmarksCount: 0,
          };
          nextPosts = [repostEntry, ...prev.posts];
        }

        return {
          ...prev,
          reposts: nextReposts,
          posts: nextPosts,
        };
      });

      if (!alreadyReposted) {
        pushNotificationInternal({
          recipientId: post.authorId,
          type: 'repost',
          actorId: user.id,
          targetType: 'post',
          targetId: postId,
        });
      }
      return !alreadyReposted;
    }, 60, 140);
  },
};
