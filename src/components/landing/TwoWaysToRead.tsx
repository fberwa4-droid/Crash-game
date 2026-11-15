import React, { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useStore } from '../../hooks/useStore';
import { postsService } from '../../services/postsService';
import { PostCard } from '../../features/feed/PostCard';
import { Tabs } from '../ui/Tabs';

export const TwoWaysToRead: React.FC = () => {
  const [mode, setMode] = useState<'for-you' | 'following'>('for-you');
  const state = useStore();
  const { currentUser } = useAuth();
  const reducedMotion = useReducedMotion();

  const posts = useMemo(() => {
    if (mode === 'for-you') {
      return postsService
        .listForYouSync()
        .filter((p) => p.kind !== 'repost' && p.body.trim().length > 0)
        .slice(0, 3);
    }
    const followingPosts = postsService
      .listFollowingSync('u_demo_member')
      .filter((p) => p.kind !== 'repost' && p.body.trim().length > 0);
    return followingPosts.slice(0, 3);
  }, [mode, state.posts, state.follows, state.mutes, currentUser]);

  const caption =
    mode === 'for-you'
      ? 'A cross-disciplinary stream blending open questions, research notes, and active threads.'
      : currentUser
        ? 'Strictly chronological posts and reposts from the thinkers you follow.'
        : 'Only posts from accounts marked Following—quiet, chronological, and free of surprises.';

  return (
    <section
      aria-labelledby="two-ways-heading"
      className="py-16 sm:py-24 border-t border-[var(--hairline)]"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-xl">
            <h2
              id="two-ways-heading"
              className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text)]"
            >
              Two ways to read
            </h2>
            <p className="mt-2.5 text-base text-[var(--text-muted)] leading-relaxed">
              {caption}
            </p>
          </div>

          <Tabs
            value={mode}
            onChange={setMode}
            options={[
              { value: 'for-you', label: 'For you' },
              { value: 'following', label: 'Following' },
            ]}
          />
        </div>

        <div
          key={mode}
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${
            reducedMotion ? '' : 'animate-fade-rise'
          }`}
        >
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col">
              {mode === 'following' ? (
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--text)]" aria-hidden="true" />
                  <span>Following</span>
                </div>
              ) : null}
              <PostCard post={post} compact className="flex-1 flex flex-col justify-between" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
