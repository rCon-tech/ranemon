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

/** The title: an old green-screen handheld, with the logo on its screen and the menu below. */
export function TitleScreen({ record, onStart }: { record: BattleRecord; onStart: () => void }) {
  const fresh = useHasNew();
  const online = useOnline();
  return (
    <div className="gb-body relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4 py-12 text-center">
      <SoundButton className="absolute right-2 top-2 z-10" />
      <div className="gb-bezel relative w-full max-w-[340px]">
        <p aria-hidden className="gb-power">
          POWER
        </p>
        <div className="gb-lcd flex flex-col items-center gap-3 px-3 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset('/logo.png')}
            alt=""
            width={84}
            height={84}
            className="gb-tint rounded-full border-4 border-[#0f380f] bg-paper [image-rendering:pixelated]"
          />
          <h1 className="text-[50px] font-bold leading-none tracking-wide text-[#0f380f] [text-shadow:3px_3px_0_#8bac0f]">
            RANEMON
          </h1>
          <p className="rounded-full bg-[#0f380f] px-3 py-1 text-[13px] text-[#c4d88a]">
            Your friends. Their moves.
          </p>
        </div>
      </div>
      <div className="relative flex w-full max-w-[320px] flex-col items-stretch gap-3">
        {/* Story mode is the game; everything else is on the side. */}
        <Link
          href="/story"
          className="pixel-btn flex flex-col items-center gap-1 py-4 text-center"
          data-cmd="fight"
        >
          <span className="text-[26px] font-bold leading-none">STORY MODE</span>
          <span aria-hidden className="blink text-[12px]">
            ▶ PRESS START
          </span>
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="pixel-btn flex flex-col items-center justify-center text-center text-[13px]"
            data-cmd="run"
            onClick={onStart}
          >
            BATTLE MODE
          </button>
          {online ? (
            <Link
              href="/friends"
              className="pixel-btn flex flex-col items-center justify-center text-center text-[13px]"
              data-cmd="party"
            >
              FRIEND BATTLE
            </Link>
          ) : (
            // Friend battles are played on the save server, so they need a connection.
            <button
              type="button"
              disabled
              className="pixel-btn flex flex-col items-center justify-center text-center text-[13px] opacity-60"
              data-cmd="party"
              data-testid="friends-offline"
            >
              FRIEND BATTLE
              <span className="block text-[10px]">NEEDS A CONNECTION</span>
            </button>
          )}
        </div>
      </div>
      <div className="relative flex flex-col items-center gap-4 text-[14px] text-ink">
        <p>
          Record: {record.wins}W · {record.losses}L
        </p>
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
