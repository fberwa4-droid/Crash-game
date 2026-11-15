import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useStore } from '../../hooks/useStore';
import { postsService } from '../../services/postsService';
import { PostCard } from '../../features/feed/PostCard';

export const IdeasInMotion: React.FC = () => {
  const state = useStore();
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);

  const feedPool = useMemo(() => {
    return postsService
      .listForYouSync()
      .filter((p) => p.kind !== 'repost' && p.body.trim().length > 0)
      .slice(0, 14);
  }, [state.posts, state.mutes]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setIsVisible(entries[0]?.isIntersecting ?? true),
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || !isVisible || feedPool.length <= 3) return;
    const id = window.setInterval(() => {
      if (!document.hidden) {
        setOffset((prev) => (prev + 1) % feedPool.length);
      }
    }, 7500);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused, isVisible, feedPool.length]);

  const visiblePosts = useMemo(() => {
    if (feedPool.length === 0) return [];
    const count = Math.min(3, feedPool.length);
    return Array.from({ length: count }, (_, i) => feedPool[(offset + i) % feedPool.length]);
  }, [feedPool, offset]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="ideas-in-motion-heading"
      className="py-16 sm:py-24 border-t border-[var(--hairline)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-[var(--text-muted)] mb-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#E5322D] animate-pulse-dot"
              />
              <span>LIVE</span>
            </div>
            <h2
              id="ideas-in-motion-heading"
              className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text)]"
            >
              Ideas in motion
            </h2>
          </div>
          <p className="font-mono text-xs text-[var(--text-muted)]">
            Preview of the For you feed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-200">
          {visiblePosts.map((post) => (
            <div key={post.id} className={reducedMotion ? '' : 'animate-fade-rise'}>
              <PostCard post={post} compact className="h-full flex flex-col justify-between" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
