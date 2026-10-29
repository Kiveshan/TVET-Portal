import { useSyncExternalStore } from 'react';
import { reviewStore } from '@/services/reviewStore';

/** DHET decisions by submission file name; re-renders when a decision is submitted. */
export function useReviews() {
  return useSyncExternalStore(reviewStore.subscribe, reviewStore.getSnapshot);
}
