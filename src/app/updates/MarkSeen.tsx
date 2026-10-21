'use client';

import { useEffect } from 'react';
import { LATEST, SEEN_KEY } from '@/content/updates';

/** Remembers that you've read the latest update, so the title stops saying NEW. */
export function MarkSeen() {
  useEffect(() => {
    try {
      localStorage.setItem(SEEN_KEY, LATEST);
    } catch {
      // Private windows can refuse storage; the NEW badge just stays.
    }
  }, []);
  return null;
}
