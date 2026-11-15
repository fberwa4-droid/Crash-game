import type { Topic } from '../data/types';
import { ServiceError, withLatency } from './latency';
import { getCurrentUser, store } from './store';

export const topicsService = {
  listTopicsSync(includeArchived = false): Topic[] {
    return store
      .getState()
      .topics.filter((t) => includeArchived || (!t.archived && !t.mergedInto));
  },

  getBySlugSync(slug: string): Topic | undefined {
    return store.getState().topics.find((t) => t.slug === slug);
  },

  listTopics(includeArchived = false): Promise<Topic[]> {
    return withLatency(() => this.listTopicsSync(includeArchived));
  },

  createTopic(name: string): Promise<Topic> {
    return withLatency(() => {
      const actor = getCurrentUser(store.getState());
      if (!actor || actor.role !== 'admin') {
        throw new ServiceError('Admin access required.', 'FORBIDDEN');
      }
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!slug) throw new ServiceError('Invalid topic name.', 'INVALID_INPUT');
      if (store.getState().topics.some((t) => t.slug === slug)) {
        throw new ServiceError('Topic already exists.', 'DUPLICATE');
      }
      const topic: Topic = {
        slug,
        name: name.trim(),
        featured: false,
        archived: false,
        basePostCount: 0,
      };
      store.setState((prev) => ({
        ...prev,
        topics: [...prev.topics, topic],
      }));
      return topic;
    });
  },
};
