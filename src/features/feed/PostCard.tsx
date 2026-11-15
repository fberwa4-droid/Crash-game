import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
  Trash2,
  UserMinus,
  UserPlus,
  VolumeX,
} from 'lucide-react';
import { POST_CHAR_LIMIT } from '../../config';
import type { Post } from '../../data/types';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../hooks/useToast';
import { bookmarksService } from '../../services/bookmarksService';
import { followService } from '../../services/followService';
import { postsService } from '../../services/postsService';
import { reportsService } from '../../services/reportsService';
import { getPostCounts } from '../../services/store';
import { formatCompactCount, formatRelativeTime } from '../../utils/format';
import { Avatar } from '../../components/ui/Avatar';
import { VerifiedBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { IconButton } from '../../components/ui/IconButton';
import { Menu } from '../../components/ui/Menu';
import { Modal } from '../../components/ui/Modal';

interface PostCardProps {
  post: Post;
  compact?: boolean;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = React.memo(
  ({ post, compact = false, className = '' }) => {
    const navigate = useNavigate();
    const state = useStore();
    const { currentUser, requireAuth } = useAuth();
    const { showToast } = useToast();

    const [likePop, setLikePop] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [quoteOpen, setQuoteOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [composeText, setComposeText] = useState('');
    const [reportReason, setReportReason] = useState('');
    const [busy, setBusy] = useState(false);

    // Resolve repost wrapper if applicable
    const repostActor = useMemo(() => {
      if (post.kind !== 'repost') return null;
      return state.users.find((u) => u.id === post.authorId) ?? null;
    }, [post, state.users]);

    const displayPost = useMemo(() => {
      if (post.kind === 'repost' && post.repostOfId) {
        return state.posts.find((p) => p.id === post.repostOfId) ?? null;
      }
      return post;
    }, [post, state.posts]);

    const author = useMemo(() => {
      if (!displayPost) return undefined;
      return state.users.find((u) => u.id === displayPost.authorId);
    }, [displayPost, state.users]);

    const parentPost = useMemo(() => {
      if (!displayPost?.parentId) return undefined;
      return state.posts.find((p) => p.id === displayPost.parentId);
    }, [displayPost, state.posts]);

    const parentAuthor = useMemo(() => {
      if (!parentPost) return undefined;
      return state.users.find((u) => u.id === parentPost.authorId);
    }, [parentPost, state.users]);

    const quotedPost = useMemo(() => {
      if (!displayPost?.quotedPostId) return undefined;
      return state.posts.find((p) => p.id === displayPost.quotedPostId);
    }, [displayPost, state.posts]);

    const quotedAuthor = useMemo(() => {
      if (!quotedPost) return undefined;
      return state.users.find((u) => u.id === quotedPost.authorId);
    }, [quotedPost, state.users]);

    const embeddedDoc = useMemo(() => {
      if (!displayPost?.libraryDocId) return undefined;
      const doc = state.library.find((d) => d.id === displayPost.libraryDocId);
      return doc?.status === 'published' ? doc : undefined;
    }, [displayPost, state.library]);

    if (!displayPost || displayPost.status !== 'visible' || !author) {
      return null;
    }

    const counts = getPostCounts(state, displayPost.id);
    const isLiked = currentUser
      ? state.likes.some((l) => l.userId === currentUser.id && l.postId === displayPost.id)
      : false;
    const isReposted = currentUser
      ? state.reposts.some((r) => r.userId === currentUser.id && r.postId === displayPost.id)
      : false;
    const isBookmarked = currentUser
      ? state.bookmarks.some(
          (b) =>
            b.userId === currentUser.id &&
            b.targetType === 'post' &&
            b.targetId === displayPost.id,
        )
      : false;
    const isFollowingAuthor = currentUser
      ? state.follows.some(
          (f) => f.followerId === currentUser.id && f.followingId === author.id,
        )
      : false;
    const isOwn = currentUser?.id === author.id;

    const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation();
      requireAuth('like', async () => {
        setLikePop(true);
        window.setTimeout(() => setLikePop(false), 260);
        try {
          await postsService.toggleLike(displayPost.id);
        } catch (err) {
          showToast({
            message: err instanceof Error ? err.message : 'Could not like post.',
            tone: 'error',
          });
        }
      });
    };

    const handleToggleRepost = () => {
      requireAuth('repost', async () => {
        try {
          const active = await postsService.toggleRepost(displayPost.id);
          showToast({ message: active ? 'Reposted to your followers.' : 'Repost removed.' });
        } catch (err) {
          showToast({
            message: err instanceof Error ? err.message : 'Could not repost.',
            tone: 'error',
          });
        }
      });
    };

    const handleBookmark = (e: React.MouseEvent) => {
      e.stopPropagation();
      requireAuth('bookmark', async () => {
        try {
          const added = await bookmarksService.toggleBookmark('post', displayPost.id);
          showToast({
            message: added ? 'Added to bookmarks' : 'Removed from bookmarks',
            actionLabel: 'Undo',
            onAction: () => {
              void bookmarksService.toggleBookmark('post', displayPost.id);
            },
          });
        } catch (err) {
          showToast({
            message: err instanceof Error ? err.message : 'Could not update bookmark.',
            tone: 'error',
          });
        }
      });
    };

    const copyLink = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const url = `${window.location.origin}/post/${displayPost.id}`;
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(url);
      }
      showToast({ message: 'Post link copied.' });
    };

    const handleSubmitReplyOrQuote = async (mode: 'reply' | 'quote', e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      try {
        await postsService.create({
          body: composeText,
          kind: mode,
          parentId: mode === 'reply' ? displayPost.id : undefined,
          quotedPostId: mode === 'quote' ? displayPost.id : undefined,
        });
        setComposeText('');
        setReplyOpen(false);
        setQuoteOpen(false);
        showToast({ message: mode === 'reply' ? 'Reply posted.' : 'Quote posted.' });
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : 'Could not submit post.',
          tone: 'error',
        });
      } finally {
        setBusy(false);
      }
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      try {
        await reportsService.createReport('post', displayPost.id, reportReason);
        setReportReason('');
        setReportOpen(false);
        showToast({ message: 'Report submitted for moderator review.' });
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : 'Could not submit report.',
          tone: 'error',
        });
      } finally {
        setBusy(false);
      }
    };

    const handleDelete = async () => {
      setBusy(true);
      try {
        await postsService.deletePost(displayPost.id);
        setDeleteOpen(false);
        showToast({ message: 'Post deleted.' });
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : 'Could not delete post.',
          tone: 'error',
        });
      } finally {
        setBusy(false);
      }
    };

    const renderBody = (text: string) => {
      const tokens = text.split(/(#[A-Za-z0-9_]+|@[a-zA-Z0-9._]+)/g);
      return tokens.map((token, idx) => {
        if (token.startsWith('#') && token.length > 1) {
          const clean = token.slice(1).toLowerCase();
          const matchedTopic = state.topics.find(
            (t) =>
              t.slug === clean ||
              t.slug.replace(/-/g, '') === clean ||
              t.name.toLowerCase().replace(/\s+/g, '') === clean,
          );
          const slug = matchedTopic?.slug ?? clean;
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/explore?topic=${encodeURIComponent(slug)}`);
              }}
              className="text-[var(--text)] underline decoration-[var(--hairline-strong)] underline-offset-2 hover:decoration-[#E5322D] cursor-pointer"
            >
              {token}
            </button>
          );
        }
        if (token.startsWith('@') && token.length > 1) {
          const handle = token.slice(1);
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/u/${encodeURIComponent(handle)}`);
              }}
              className="font-mono text-[0.92em] text-[var(--text)] underline decoration-[var(--hairline-strong)] underline-offset-2 hover:decoration-[#E5322D] cursor-pointer"
            >
              {token}
            </button>
          );
        }
        return <React.Fragment key={idx}>{token}</React.Fragment>;
      });
    };

    const menuItems = [
      ...(!isOwn
        ? [
            {
              id: 'follow',
              label: isFollowingAuthor ? `Unfollow @${author.handle}` : `Follow @${author.handle}`,
              icon: isFollowingAuthor ? (
                <UserMinus className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <UserPlus className="h-4 w-4" strokeWidth={1.5} />
              ),
              onSelect: () => {
                requireAuth('follow', async () => {
                  const following = await followService.toggleFollow(author.id);
                  showToast({
                    message: following
                      ? `Following @${author.handle}`
                      : `Unfollowed @${author.handle}`,
                  });
                });
              },
            },
          ]
        : []),
      {
        id: 'copy',
        label: 'Copy link',
        icon: <Link2 className="h-4 w-4" strokeWidth={1.5} />,
        onSelect: () => copyLink(),
      },
      ...(!isOwn
        ? [
            {
              id: 'mute',
              label: `Mute @${author.handle}`,
              icon: <VolumeX className="h-4 w-4" strokeWidth={1.5} />,
              onSelect: () => {
                requireAuth('follow', async () => {
                  await followService.muteAccount(author.id);
                  showToast({
                    message: `Muted @${author.handle}`,
                    actionLabel: 'Undo',
                    onAction: () => {
                      void followService.unmuteAccount(author.id);
                    },
                  });
                });
              },
            },
            {
              id: 'report',
              label: 'Report post',
              icon: <Flag className="h-4 w-4" strokeWidth={1.5} />,
              danger: true,
              onSelect: () => {
                requireAuth('report', () => setReportOpen(true));
              },
            },
          ]
        : [
            {
              id: 'delete',
              label: 'Delete post',
              icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />,
              danger: true,
              onSelect: () => setDeleteOpen(true),
            },
          ]),
    ];

    return (
      <>
        <article
          onClick={() => navigate(`/post/${displayPost.id}`)}
          className={`group rounded-2xl border border-[var(--hairline)] bg-[var(--surface)]/75 hover:bg-[var(--surface)] hover:border-[var(--hairline-strong)] transition-colors duration-150 cursor-pointer ${
            compact ? 'p-4' : 'p-5'
          } ${className}`}
        >
          {repostActor ? (
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
              <Repeat2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              <span>{repostActor.displayName} reposted</span>
            </div>
          ) : null}

          {parentAuthor ? (
            <div className="mb-2 font-mono text-xs text-[var(--text-muted)]">
              Replying to{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/u/${parentAuthor.handle}`);
                }}
                className="text-[var(--text)] hover:underline cursor-pointer"
              >
                @{parentAuthor.handle}
              </button>
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/u/${author.handle}`);
              }}
              className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
            >
              <Avatar name={author.displayName} seed={author.avatarSeed} size={compact ? 'sm' : 'md'} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-sm text-[var(--text)] truncate hover:underline">
                    {author.displayName}
                  </span>
                  {author.verified ? <VerifiedBadge /> : null}
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)] truncate">
                  <span className="truncate">@{author.handle}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={displayPost.createdAt} className="shrink-0 tabular-nums">
                    {formatRelativeTime(displayPost.createdAt)}
                  </time>
                </div>
              </div>
            </button>

            <Menu
              items={menuItems}
              trigger={(triggerProps) => (
                <IconButton
                  label="Post options"
                  size="sm"
                  {...triggerProps}
                >
                  <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                </IconButton>
              )}
            />
          </div>

          <p
            className={`mt-3 text-[var(--text)] whitespace-pre-wrap break-words leading-[1.55] ${
              compact ? 'text-[14.5px]' : 'text-[15.5px]'
            }`}
          >
            {renderBody(displayPost.body)}
          </p>

          {displayPost.images.length > 0 ? (
            <div
              className={`mt-3 grid gap-2 ${
                displayPost.images.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {displayPost.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Attachment ${i + 1} from ${author.displayName}`}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-64 object-cover rounded-xl border border-[var(--hairline)]"
                />
              ))}
            </div>
          ) : null}

          {quotedPost && quotedPost.status === 'visible' && quotedAuthor ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/post/${quotedPost.id}`);
              }}
              className="mt-3 rounded-xl border border-[var(--hairline)] bg-[var(--bg)]/60 p-3.5 hover:border-[var(--hairline-strong)] transition-colors"
            >
              <div className="flex items-center gap-2 text-xs">
                <Avatar name={quotedAuthor.displayName} seed={quotedAuthor.avatarSeed} size="xs" />
                <span className="font-medium text-[var(--text)] truncate">
                  {quotedAuthor.displayName}
                </span>
                <span className="font-mono text-[var(--text-muted)] truncate">
                  @{quotedAuthor.handle}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                {quotedPost.body}
              </p>
            </div>
          ) : null}

          {embeddedDoc ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/library/${embeddedDoc.id}`);
              }}
              className="mt-3 rounded-xl border border-[var(--hairline)] bg-[var(--bg)]/70 p-3.5 hover:border-[var(--hairline-strong)] transition-colors"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
                <BookOpen className="h-3.5 w-3.5 text-[#E5322D]" strokeWidth={1.5} aria-hidden="true" />
                <span>Library</span>
                <span aria-hidden="true">·</span>
                <span>{embeddedDoc.type}</span>
                <span aria-hidden="true">·</span>
                <span>{embeddedDoc.version}</span>
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--text)] leading-snug">
                {embeddedDoc.title}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                {embeddedDoc.abstract}
              </p>
            </div>
          ) : null}

          <div
            className="mt-3.5 pt-2.5 border-t border-[var(--hairline)] flex items-center justify-between gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                aria-label={`Reply (${counts.replies})`}
                onClick={() => requireAuth('reply', () => setReplyOpen(true))}
                className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-full text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]/60 transition-colors cursor-pointer tabular-nums"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                <span>{formatCompactCount(counts.replies)}</span>
              </button>

              <Menu
                align="left"
                items={[
                  {
                    id: 'repost',
                    label: isReposted ? 'Undo repost' : 'Repost',
                    icon: <Repeat2 className="h-4 w-4" strokeWidth={1.5} />,
                    onSelect: handleToggleRepost,
                  },
                  {
                    id: 'quote',
                    label: 'Quote post',
                    icon: <MessageCircle className="h-4 w-4" strokeWidth={1.5} />,
                    onSelect: () => requireAuth('quote', () => setQuoteOpen(true)),
                  },
                ]}
                trigger={(triggerProps) => (
                  <button
                    type="button"
                    aria-label={`Repost (${counts.reposts})`}
                    {...triggerProps}
                    className={`inline-flex items-center gap-1.5 px-2.5 h-9 rounded-full text-xs font-mono transition-colors cursor-pointer tabular-nums ${
                      isReposted
                        ? 'text-[var(--text)] bg-[var(--bg)]/70'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]/60'
                    }`}
                  >
                    <Repeat2 className="h-4 w-4" strokeWidth={1.5} />
                    <span>{formatCompactCount(counts.reposts)}</span>
                  </button>
                )}
              />

              <button
                type="button"
                aria-label={`Like (${counts.likes})`}
                aria-pressed={isLiked}
                onClick={handleLike}
                className={`inline-flex items-center gap-1.5 px-2.5 h-9 rounded-full text-xs font-mono transition-colors cursor-pointer tabular-nums ${
                  isLiked
                    ? 'text-[#E5322D]'
                    : 'text-[var(--text-muted)] hover:text-[#E5322D] hover:bg-[var(--bg)]/60'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${likePop ? 'animate-heart-pop' : ''}`}
                  strokeWidth={1.5}
                  fill={isLiked ? 'currentColor' : 'none'}
                />
                <span>{formatCompactCount(counts.likes)}</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
                aria-pressed={isBookmarked}
                onClick={handleBookmark}
                className={`inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'text-[#E5322D]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]/60'
                }`}
              >
                <Bookmark
                  className="h-4 w-4"
                  strokeWidth={1.5}
                  fill={isBookmarked ? 'currentColor' : 'none'}
                />
              </button>
              <button
                type="button"
                aria-label="Share post link"
                onClick={copyLink}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]/60 transition-colors cursor-pointer"
              >
                <Share className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </article>

        {/* Quick Reply Modal */}
        <Modal
          open={replyOpen}
          onClose={() => setReplyOpen(false)}
          title={`Reply to @${author.handle}`}
          maxWidth="md"
        >
          <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-3 border-b border-[var(--hairline)] pb-3">
            {displayPost.body}
          </p>
          <form onSubmit={(e) => handleSubmitReplyOrQuote('reply', e)}>
            <textarea
              rows={4}
              maxLength={POST_CHAR_LIMIT}
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder="Write your reply..."
              className="w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] resize-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
                {composeText.length}/{POST_CHAR_LIMIT}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setReplyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={busy}
                  disabled={!composeText.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Quick Quote Modal */}
        <Modal
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          title="Quote post"
          maxWidth="md"
        >
          <form onSubmit={(e) => handleSubmitReplyOrQuote('quote', e)}>
            <textarea
              rows={3}
              maxLength={POST_CHAR_LIMIT}
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder="Add your perspective..."
              className="w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] resize-none"
            />
            <div className="mt-3 rounded-xl border border-[var(--hairline)] p-3 text-xs text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text)]">{author.displayName}</span>{' '}
              <span className="font-mono">@{author.handle}</span>
              <p className="mt-1 line-clamp-2">{displayPost.body}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
                {composeText.length}/{POST_CHAR_LIMIT}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuoteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={busy}
                  disabled={!composeText.trim()}
                >
                  Post quote
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Report Dialog */}
        <Modal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          title="Report post"
          description="Reports are reviewed by moderators in the open queue."
          maxWidth="sm"
        >
          <form onSubmit={handleSubmitReport} className="space-y-3">
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Explain why this post violates community guidelines..."
              className="w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={busy}>
                Submit report
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete post"
          description="This post will be removed from feeds, search, and bookmarks. Any replies will keep a deleted-parent placeholder."
          confirmLabel="Delete"
          danger
          loading={busy}
        />
      </>
    );
  },
);

PostCard.displayName = 'PostCard';
