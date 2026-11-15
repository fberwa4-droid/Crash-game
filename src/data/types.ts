export type UserRole = 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  handle: string;
  displayName: string;
  email: string;
  mockPassword: string;
  role: UserRole;
  status: UserStatus;
  bio: string;
  location: string;
  link: string;
  joinedAt: string;
  avatarSeed: number;
  bannerSeed: number;
  interestTopics: string[];
  verified: boolean;
  pinnedPostId?: string;
  baseFollowersCount: number;
  baseFollowingCount: number;
}

export type PostKind = 'original' | 'reply' | 'repost' | 'quote';
export type PostStatus = 'visible' | 'removed';

export interface Post {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  kind: PostKind;
  parentId?: string;
  quotedPostId?: string;
  repostOfId?: string;
  threadId?: string;
  topicTags: string[];
  mentions: string[];
  images: string[];
  libraryDocId?: string;
  status: PostStatus;
  views: number;
  baseLikesCount: number;
  baseRepostsCount: number;
  baseRepliesCount: number;
  baseBookmarksCount: number;
}

export interface LikeRecord {
  userId: string;
  postId: string;
  createdAt: string;
}

export interface RepostRecord {
  userId: string;
  postId: string;
  createdAt: string;
}

export interface BookmarkRecord {
  userId: string;
  targetType: 'post' | 'doc';
  targetId: string;
  createdAt: string;
}

export interface FollowRecord {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface TopicFollowRecord {
  userId: string;
  topicSlug: string;
  createdAt: string;
}

export interface MuteRecord {
  userId: string;
  targetType: 'user' | 'topic';
  targetValue: string;
  createdAt: string;
}

export type NotificationType =
  | 'follow'
  | 'like'
  | 'repost'
  | 'quote'
  | 'reply'
  | 'mention'
  | 'library_comment'
  | 'library_decision'
  | 'moderation';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  actorIds: string[];
  targetType: 'post' | 'doc' | 'user' | 'system';
  targetId: string;
  createdAt: string;
  read: boolean;
  note?: string;
}

export type LibraryDocType = 'Paper' | 'Preprint' | 'Essay' | 'Dataset' | 'Notes' | 'Review';
export type LibraryDocStatus = 'pending' | 'changes_requested' | 'rejected' | 'published';

export interface LibraryDoc {
  id: string;
  title: string;
  type: LibraryDocType;
  authorIds: string[];
  abstract: string;
  bodyMarkdown: string;
  topics: string[];
  version: string;
  createdAt: string;
  status: LibraryDocStatus;
  reviewNote?: string;
  fileMeta?: {
    name: string;
    sizeLabel: string;
  };
  citationData: {
    year: number;
    venue?: string;
    doi?: string;
  };
  baseBookmarksCount: number;
}

export type ReportStatus = 'open' | 'dismissed' | 'actioned';

export interface Report {
  id: string;
  targetType: 'post' | 'doc';
  targetId: string;
  reporterIds: string[];
  reason: string;
  status: ReportStatus;
  resolution?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: 'post' | 'doc' | 'user' | 'topic' | 'report' | 'settings';
  targetId: string;
  note: string;
  createdAt: string;
}

export interface Topic {
  slug: string;
  name: string;
  featured: boolean;
  archived: boolean;
  mergedInto?: string;
  basePostCount: number;
}

export type RegistrationMode = 'open' | 'invite-only';

export interface PlatformSettings {
  brandName: string;
  registrationMode: RegistrationMode;
  inviteCode: string;
  charLimit: number;
}

export interface NotificationPrefs {
  follow: boolean;
  like: boolean;
  repost: boolean;
  quote: boolean;
  reply: boolean;
  mention: boolean;
  library_comment: boolean;
  library_decision: boolean;
  moderation: boolean;
}

export interface DraftPost {
  id: string;
  body: string;
  topicTags: string[];
  libraryDocId?: string;
  parentId?: string;
  quotedPostId?: string;
  updatedAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface SessionState {
  currentUserId: string | null;
  loggedInAt: string | null;
}

export interface CommonsStoreState {
  schemaVersion: number;
  session: SessionState;
  users: User[];
  posts: Post[];
  likes: LikeRecord[];
  reposts: RepostRecord[];
  bookmarks: BookmarkRecord[];
  follows: FollowRecord[];
  topicFollows: TopicFollowRecord[];
  mutes: MuteRecord[];
  notifications: Notification[];
  library: LibraryDoc[];
  reports: Report[];
  auditLog: AuditEntry[];
  topics: Topic[];
  settings: PlatformSettings;
  notificationPrefs: NotificationPrefs;
  drafts: DraftPost[];
  recentSearches: string[];
  theme: ThemePreference;
  simulatorEnabled: boolean;
}

export type AuthGateReason =
  | 'like'
  | 'repost'
  | 'quote'
  | 'reply'
  | 'bookmark'
  | 'follow'
  | 'follow-topic'
  | 'post'
  | 'submit-research'
  | 'report'
  | 'general';
