'use client';

import { useState, useSyncExternalStore } from 'react';

/**
 * Keeps the game to the lads: the word goes in once per browser. The site is static, so this
 * stops casual visitors rather than anyone determined; only a hash of the word is in the code.
 */
const UNLOCK_KEY = 'ranemon.unlocked';
const WORD_SHA256 = '5149d43b436bde92a191e29eadd70cbe433152954307cced21583b92e8ed36e5';

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** True once the word matches, ignoring case and spaces round it. */
export async function isWord(guess: string): Promise<boolean> {
  return (await sha256(guess.trim().toLowerCase())) === WORD_SHA256;
}

const noSubscribe = () => () => {};

function readUnlocked(): boolean {
  try {
    return window.localStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function Gate({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(noSubscribe, readUnlocked, () => null);
  const [unlocked, setUnlocked] = useState(false);
  const [guess, setGuess] = useState('');
  const [wrong, setWrong] = useState(false);

  if (stored === null) return <div className="flex-1" />;
  if (stored || unlocked) return <>{children}</>;

  return (
    <form
      className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-12 text-center text-ink"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await isWord(guess)) {
          try {
            window.localStorage.setItem(UNLOCK_KEY, '1');
          } catch {
            // Without storage the word is asked again next time.
          }
          setUnlocked(true);
        } else setWrong(true);
      }}
    >
      <h1 className="text-[40px] font-bold leading-none text-gold [-webkit-text-stroke:2px_#1c4f96] [text-shadow:0_4px_0_#1c4f96,0_6px_0_#1c2026]">
        RANEMON
      </h1>
      <label className="flex w-full max-w-[260px] flex-col gap-1 text-left text-[12px]">
        PASSWORD
        <input
          type="password"
          className="dialog px-3 py-2 text-[16px] outline-none"
          value={guess}
          autoComplete="current-password"
          onChange={(e) => {
            setGuess(e.target.value);
            setWrong(false);
          }}
          data-testid="password"
        />
      </label>
      <button
        type="submit"
        className="pixel-btn menu-item w-full max-w-[260px] text-[14px]"
        data-cmd="fight"
      >
        ENTER
      </button>
      <p className="h-4 text-[11px] text-accent" aria-live="polite">
        {wrong ? 'That’s not it. Ask one of the lads.' : ''}
      </p>
    </form>
  );
}
