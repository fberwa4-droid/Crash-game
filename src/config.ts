import type { LibraryDocType } from './data/types';

export const PLATFORM_NAME = 'Commons';
export const PLATFORM_TAGLINE = 'Crash-game research, in the open.';
export const PLATFORM_DESCRIPTION =
  'Commons is a social network for people who study crash-game mechanics: RNG and hashing, provably fair verification, probability models and the data behind them.';
export const RESEARCH_DISCLAIMER =
  'Commons is for research and education only. It does not offer, facilitate or promote betting, and nothing here is gambling advice.';

export const POST_CHAR_LIMIT = 500;
export const DEFAULT_INVITE_CODE = 'COMMONS-DEMO';
export const STORAGE_NAMESPACE = 'commons:v1:';
export const SCHEMA_VERSION = 1;
export const TARGET_MIGRATION_SCHEMA_VERSION = 2;
export const MAX_POST_IMAGES = 2;
export const IMAGE_MAX_DIMENSION = 1280;
export const IMAGE_JPEG_QUALITY = 0.8;

export interface ResearchTopicDefinition {
  name: string;
  slug: string;
  featured: boolean;
}

export const CRASH_RESEARCH_TOPICS: readonly ResearchTopicDefinition[] = [
  { name: 'Crash Algorithms', slug: 'crash-algorithms', featured: true },
  { name: 'Provably Fair', slug: 'provably-fair', featured: true },
  { name: 'RNG and PRNG', slug: 'rng-prng', featured: true },
  { name: 'Hashing and HMAC', slug: 'hashing-hmac', featured: true },
  { name: 'Seeds and Nonces', slug: 'seeds-nonces', featured: true },
  { name: 'Crash-Point Distribution', slug: 'crash-distribution', featured: true },
  { name: 'Probability Theory', slug: 'probability-theory', featured: true },
  { name: 'Statistical Modelling', slug: 'statistical-modelling', featured: true },
  { name: 'House Edge Estimation', slug: 'house-edge', featured: false },
  { name: 'Hypothesis Testing', slug: 'hypothesis-testing', featured: false },
  { name: 'Historical Data Analysis', slug: 'historical-data', featured: false },
  { name: 'Dataset Methods', slug: 'dataset-methods', featured: false },
  { name: 'Randomness Testing', slug: 'randomness-testing', featured: false },
  { name: 'Verification Tooling', slug: 'verification', featured: false },
  { name: 'Reproducibility', slug: 'reproducibility', featured: false },
  { name: 'Model Critique', slug: 'model-critique', featured: false },
  { name: 'Cryptographic Commitments', slug: 'commitments', featured: false },
  { name: 'Open Questions', slug: 'open-questions', featured: false },
] as const;

export const LIBRARY_DOC_TYPES: readonly LibraryDocType[] = [
  'Paper',
  'Preprint',
  'Essay',
  'Dataset',
  'Notes',
  'Review',
  'Algorithm',
  'Experiment',
  'Findings',
] as const;

export const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Off-topic',
  'Unsupported claim or misinformation',
  'Betting tips or signals',
  'Operator promotion or referral links',
  'Unsupported accusation about a named operator',
  'Gambling-harm concern',
  'Personal data in a dataset',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
