'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  applyUpdate,
  isOnline,
  onOnlineChange,
  onUpdateReady,
  registerOffline,
  updateReady,
} from '@/lib/offline';

/** Sets up offline play once the page has loaded (`src/lib/offline.ts`). */
export function OfflineHooks() {
  useEffect(() => {
    void registerOffline();
  }, []);
  return null;
}

/** Whether the browser thinks it's online. True on the server render. */
export function useOnline(): boolean {
  return useSyncExternalStore(onOnlineChange, isOnline, () => true);
}

/** On the title screen: a tap to switch to a new version once it has downloaded. */
export function UpdateButton() {
  const ready = useSyncExternalStore(onUpdateReady, updateReady, () => false);
  if (!ready) return null;
  return (
    <button
      type="button"
      className="pixel-btn menu-item text-[14px]"
      data-cmd="bag"
      data-testid="update-ready"
      onClick={() => void applyUpdate()}
    >
      NEW VERSION · TAP TO UPDATE
    </button>
  );
}
