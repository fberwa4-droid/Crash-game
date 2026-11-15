import { PLATFORM_NAME, POST_CHAR_LIMIT } from '../config';
import { useStore } from './useStore';

export function useBrand() {
  const state = useStore();
  const brandName = state.settings.brandName?.trim() || PLATFORM_NAME;
  return {
    brandName,
    charLimit: POST_CHAR_LIMIT,
  };
}
