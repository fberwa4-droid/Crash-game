import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, CheckCircle2, Clock } from 'lucide-react';
import { POST_CHAR_LIMIT } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../hooks/useToast';
import { followService } from '../../services/followService';
import { postsService } from '../../services/postsService';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

const SAMPLE_ACCOUNT_IDS = ['u_mirela', 'u_tomas', 'u_noor'];

const REVIEW_STEPS = [
  { id: 0, label: 'Submitted', note: 'Preprint uploaded · Epistemology' },
  { id: 1, label: 'Reviewed by a moderator', note: 'Scope & citations verified' },
  { id: 2, label: 'Published', note: 'Live in the public Library' },
] as const;

export const HowItWorks: React.FC = () => {
  const state = useStore();
  const { currentUser, requireAuth } = useAuth();
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion();

  // Block 1: Live 500-char composer
  const [draft, setDraft] = useState(
    'What assumption in your field feels obvious today—and might look strange in twenty years? #Epistemology',
  );
  const [posting, setPosting] = useState(false);

  // Block 2: Animated Library review stage on scroll-in
  const reviewRef = useRef<HTMLDivElement>(null);
  const [reviewStep, setReviewStep] = useState<number>(reducedMotion ? 2 : 0);
  const [hasAnimatedReview, setHasAnimatedReview] = useState(false);

  // Mobile carousel dot indicator
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setReviewStep(2);
      return;
    }
    const el = reviewRef.current;
    if (!el || hasAnimatedReview) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasAnimatedReview(true);
          setReviewStep(0);
          const t1 = window.setTimeout(() => setReviewStep(1), 950);
          const t2 = window.setTimeout(() => setReviewStep(2), 1900);
          return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
          };
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion, hasAnimatedReview]);

  const remaining = POST_CHAR_LIMIT - draft.length;
  const ratio = Math.min(1, draft.length / POST_CHAR_LIMIT);
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 40;

  const ringRadius = 11;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - ratio);

  const handleQuickPost = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth('post', async () => {
      setPosting(true);
      try {
        await postsService.create({ body: draft });
        setDraft('');
        showToast({ message: 'Published to the Commons feed.' });
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : 'Could not publish post.',
          tone: 'error',
        });
      } finally {
        setPosting(false);
      }
    });
  };

  const sampleAccounts = SAMPLE_ACCOUNT_IDS.map((id) =>
    state.users.find((u) => u.id === id),
  ).filter((u): u is NonNullable<typeof u> => Boolean(u));

  const handleToggleFollow = (userId: string, handle: string) => {
    requireAuth('follow', async () => {
      try {
        const nowFollowing = await followService.toggleFollow(userId);
        showToast({
          message: nowFollowing ? `Following @${handle}` : `Unfollowed @${handle}`,
        });
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : 'Action failed.',
          tone: 'error',
        });
      }
    });
  };

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width > 0) {
      setActiveSlide(Math.round(el.scrollLeft / width));
    }
  };

  const scrollToSlide = (idx: number) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
    setActiveSlide(idx);
  };

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="py-16 sm:py-24 border-t border-[var(--hairline)] scroll-mt-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="max-w-xl mb-10">
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text)]"
          >
            How it works
          </h2>
          <p className="mt-2.5 text-base text-[var(--text-muted)]">
            Fast public conversation paired with deliberate, reviewed research.
          </p>
        </div>

        {/* Desktop 3 hairline-separated columns; Mobile snap carousel */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 md:gap-0 border border-[var(--hairline)] rounded-2xl bg-[var(--bg-elevated)] md:divide-x divide-[var(--hairline)]"
        >
          {/* Block 1: Say it in 500 characters */}
          <div className="w-full shrink-0 snap-center md:w-auto p-6 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-[var(--text-faint)] mb-2">01</div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                Say it in {POST_CHAR_LIMIT} characters
              </h3>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                Sharp enough to test an idea in public. Longer essays belong in the Library.
              </p>

              <form onSubmit={handleQuickPost} className="mt-5">
                <label htmlFor="how-composer" className="sr-only">
                  Try writing a {POST_CHAR_LIMIT}-character post
                </label>
                <textarea
                  id="how-composer"
                  rows={4}
                  maxLength={POST_CHAR_LIMIT}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Share an observation, question, or counterexample..."
                  className="w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] resize-none leading-relaxed"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                      <circle
                        cx="14"
                        cy="14"
                        r={ringRadius}
                        fill="none"
                        stroke="var(--hairline-strong)"
                        strokeWidth="2.2"
                      />
                      <circle
                        cx="14"
                        cy="14"
                        r={ringRadius}
                        fill="none"
                        stroke={isAtLimit ? '#E5322D' : isNearLimit ? '#F59E0B' : 'var(--text)'}
                        strokeWidth="2.2"
                        strokeDasharray={ringCirc}
                        strokeDashoffset={ringOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 14 14)"
                        className="transition-all duration-150"
                      />
                    </svg>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isAtLimit ? 'text-[#E5322D] font-medium' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {remaining} left
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={posting}
                    disabled={!draft.trim()}
                  >
                    Post
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Block 2: Publish real research */}
          <div
            ref={reviewRef}
            className="w-full shrink-0 snap-center md:w-auto p-6 flex flex-col justify-between"
          >
            <div>
              <div className="font-mono text-xs text-[var(--text-faint)] mb-2">02</div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                Publish real research
              </h3>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                Any member can submit. Every submission is reviewed before it goes public.
              </p>

              <div className="mt-5 rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#E5322D]" strokeWidth={1.5} />
                    Preprint · v1.0
                  </span>
                  <span>2026</span>
                </div>
                <div className="mt-1.5 text-sm font-medium text-[var(--text)] leading-snug">
                  Metaphors We Compute By
                </div>

                <ol className="mt-4 space-y-2.5">
                  {REVIEW_STEPS.map((step) => {
                    const done = reviewStep >= step.id;
                    const current = reviewStep === step.id;
                    return (
                      <li
                        key={step.id}
                        className={`flex items-start gap-2.5 transition-opacity duration-300 ${
                          done ? 'opacity-100' : 'opacity-35'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2
                            className={`h-4 w-4 mt-0.5 shrink-0 ${
                              step.id === 2 && current
                                ? 'text-[#E5322D]'
                                : 'text-[var(--text)]'
                            }`}
                            strokeWidth={1.75}
                          />
                        ) : (
                          <Clock
                            className="h-4 w-4 mt-0.5 shrink-0 text-[var(--text-faint)]"
                            strokeWidth={1.5}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--text)]">
                            {step.label}
                          </div>
                          <div className="font-mono text-[11px] text-[var(--text-faint)] truncate">
                            {step.note}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>

          {/* Block 3: Follow minds, not metrics */}
          <div className="w-full shrink-0 snap-center md:w-auto p-6 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-[var(--text-faint)] mb-2">03</div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                Follow minds, not metrics
              </h3>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                Curate your own intellectual neighborhood across disciplines.
              </p>

              <div className="mt-5 divide-y divide-[var(--hairline)] rounded-xl border border-[var(--hairline)] bg-[var(--bg)]">
                {sampleAccounts.map((acc) => {
                  const isFollowing = currentUser
                    ? state.follows.some(
                        (f) => f.followerId === currentUser.id && f.followingId === acc.id,
                      )
                    : false;

                  return (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between gap-3 p-3.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={acc.displayName} seed={acc.avatarSeed} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-sm font-medium text-[var(--text)] truncate">
                              {acc.displayName}
                            </span>
                            {acc.verified ? <VerifiedBadge /> : null}
                          </div>
                          <div className="font-mono text-xs text-[var(--text-muted)] truncate">
                            @{acc.handle}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant={isFollowing ? 'outline' : 'subtle'}
                        size="sm"
                        onClick={() => handleToggleFollow(acc.id, acc.handle)}
                      >
                        {isFollowing ? (
                          <>
                            <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Following
                          </>
                        ) : (
                          'Follow'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile carousel dots */}
        <div className="mt-4 flex md:hidden items-center justify-center gap-2">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Show step ${idx + 1}`}
              onClick={() => scrollToSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeSlide === idx
                  ? 'w-5 bg-[#E5322D]'
                  : 'w-2 bg-[var(--hairline-strong)]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
