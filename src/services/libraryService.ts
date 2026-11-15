import type { LibraryDoc, LibraryDocType } from '../data/types';
import { makeId, ServiceError, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export interface SubmitLibraryDocInput {
  title: string;
  type: LibraryDocType;
  abstract: string;
  bodyMarkdown: string;
  topics: string[];
  fileMeta?: { name: string; sizeLabel: string };
}

export const libraryService = {
  listPublished(): Promise<LibraryDoc[]> {
    return withLatency(() =>
      store
        .getState()
        .library.filter((d) => d.status === 'published')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  getByIdSync(docId: string): LibraryDoc | undefined {
    const state = store.getState();
    const doc = state.library.find((d) => d.id === docId);
    if (!doc) return undefined;
    if (doc.status === 'published') return doc;
    const current = getCurrentUser(state);
    if (!current) return undefined;
    if (
      doc.authorIds.includes(current.id) ||
      current.role === 'moderator' ||
      current.role === 'admin'
    ) {
      return doc;
    }
    return undefined;
  },

  submitDoc(input: SubmitLibraryDocInput): Promise<LibraryDoc> {
    return withLatency(() => {
      const state = store.getState();
      const user = getCurrentUser(state);
      if (!user) throw new ServiceError('Log in to submit research.', 'UNAUTHENTICATED');
      if (user.status === 'suspended') {
        throw new ServiceError('Suspended accounts cannot submit research.', 'USER_SUSPENDED');
      }
      if (input.title.trim().length < 5) {
        throw new ServiceError('Title must be at least 5 characters.', 'INVALID_TITLE');
      }
      if (input.abstract.trim().length < 20) {
        throw new ServiceError('Abstract must be at least 20 characters.', 'INVALID_ABSTRACT');
      }

      const doc: LibraryDoc = {
        id: makeId('doc'),
        title: input.title.trim(),
        type: input.type,
        authorIds: [user.id],
        abstract: input.abstract.trim(),
        bodyMarkdown: input.bodyMarkdown.trim(),
        topics: input.topics,
        version: 'v0.1',
        createdAt: new Date().toISOString(),
        status: 'pending',
        fileMeta: input.fileMeta,
        citationData: { year: new Date().getFullYear(), venue: 'Commons Library' },
        baseBookmarksCount: 0,
      };

      store.setState((prev) => ({
        ...prev,
        library: [doc, ...prev.library],
      }));
      return doc;
    });
  },
};
