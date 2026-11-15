import type { LibraryDoc, Post, Topic, User } from '../data/types';
import { withLatency } from './latency';
import { store } from './store';

export interface SearchResults {
  users: User[];
  topics: Topic[];
  posts: Post[];
  docs: LibraryDoc[];
}

export const searchService = {
  searchAll(query: string): Promise<SearchResults> {
    return withLatency(() => {
      const q = query.trim().toLowerCase();
      const state = store.getState();
      if (!q) {
        return { users: [], topics: [], posts: [], docs: [] };
      }
      return {
        users: state.users.filter(
          (u) =>
            u.displayName.toLowerCase().includes(q) ||
            u.handle.toLowerCase().includes(q) ||
            u.bio.toLowerCase().includes(q),
        ),
        topics: state.topics.filter(
          (t) => !t.archived && (t.name.toLowerCase().includes(q) || t.slug.includes(q)),
        ),
        posts: state.posts.filter(
          (p) =>
            p.status === 'visible' &&
            (p.body.toLowerCase().includes(q) ||
              p.topicTags.some((tag) => tag.includes(q))),
        ),
        docs: state.library.filter(
          (d) =>
            d.status === 'published' &&
            (d.title.toLowerCase().includes(q) ||
              d.abstract.toLowerCase().includes(q) ||
              d.topics.some((t) => t.includes(q))),
        ),
      };
    });
  },

  addRecentSearch(query: string): void {
    const clean = query.trim();
    if (!clean) return;
    store.setState((prev) => ({
      ...prev,
      recentSearches: [clean, ...prev.recentSearches.filter((q) => q !== clean)].slice(0, 8),
    }));
  },

  clearRecentSearches(): void {
    store.setState((prev) => ({ ...prev, recentSearches: [] }));
  },
};
