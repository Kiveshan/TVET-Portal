import { useSyncExternalStore } from 'react';
import { userStore } from '@/services/userService';
import type { ManagedUser } from '@/types/user';

/** All managed users; re-renders when a user's status changes. */
export function useUsers(): ManagedUser[] {
  return useSyncExternalStore(userStore.subscribe, userStore.getSnapshot);
}
