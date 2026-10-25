'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { LATEST, SEEN_KEY } from '@/content/updates';
import { asset } from '@/lib/asset';
import type { BattleRecord } from '@/lib/record';
import { OfflineReady, UpdateButton, useOnline } from './Offline';
import { SoundButton } from './Sound';

/** Whether there's an update you haven't looked at yet. Never on the server render. */
function useHasNew(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(SEEN_KEY) !== LATEST;
      } catch {
        return false;
      }
    },
    () => false,
  );
}

/** The title: the black-and-white split of the 5th generation's box art, with a gold logo. */
export function TitleScreen({ record, onStart }: { record: BattleRecord; onStart: () => void }) {
  const fresh = useHasNew();
  const online = useOnline();
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden px-4 py-12 text-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(160deg,#f4f7fa_0_48%,#1c2026_48%_100%)]"
      />
      <SoundButton className="absolute right-2 top-2 z-10" />
      <div className="relative flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset('/logo.png')}
          alt=""
          width={96}
          height={96}
          className="rounded-full border-4 border-bezel bg-paper [image-rendering:pixelated]"
        />
        <h1 className="text-[56px] font-bold leading-none tracking-wide text-gold [-webkit-text-stroke:2px_#1c4f96] [text-shadow:0_5px_0_#1c4f96,0_7px_0_#1c2026]">
          RANEMON
        </h1>
        <p className="rounded-full bg-bezel px-3 py-1 text-[14px] text-paper">
          Your friends. Their moves.
        </p>
      </div>
      <button
        type="button"
        className="blink relative text-[22px] font-bold text-paper [text-shadow:2px_2px_0_#000]"
        onClick={onStart}
      >
        PRESS START
      </button>
      <div className="relative flex flex-col items-center gap-4 text-[14px] text-[#c8d4e0]">
        <p>
          Record: {record.wins}W · {record.losses}L
        </p>
        <Link href="/story" className="pixel-btn menu-item text-[16px]" data-cmd="fight">
          STORY MODE
        </Link>
        {online ? (
          <Link href="/friends" className="pixel-btn menu-item text-[14px]" data-cmd="party">
            FRIEND BATTLE
          </Link>
        ) : (
          // Friend battles are played on the save server, so they need a connection.
          <button
            type="button"
            disabled
            className="pixel-btn menu-item text-[14px] opacity-60"
            data-cmd="party"
            data-testid="friends-offline"
          >
            FRIEND BATTLE · NEEDS A CONNECTION
          </button>
        )}
        <UpdateButton />
        <OfflineReady />
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link href="/guide" className="underline underline-offset-4">
            HOW TO PLAY
          </Link>
          <Link href="/ranedex" className="underline underline-offset-4">
            RANEDEX
          </Link>
          <Link href="/sound" className="underline underline-offset-4">
            SOUND TEST
          </Link>
          <Link href="/updates" className="underline underline-offset-4" data-testid="updates-link">
            UPDATES
            {fresh && (
              <span className="ml-1 rounded bg-accent px-1 text-[10px] text-paper no-underline">
                NEW
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
