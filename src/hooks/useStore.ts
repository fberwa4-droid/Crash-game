import { useSyncExternalStore } from 'react';
import type { CommonsStoreState } from '../data/types';
import { store } from '../services/store';

export function useStore(): CommonsStoreState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
