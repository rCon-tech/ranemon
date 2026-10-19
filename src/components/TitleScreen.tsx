'use client';

import Link from 'next/link';
import { asset } from '@/lib/asset';
import type { BattleRecord } from '@/lib/record';

export function TitleScreen({ record, onStart }: { record: BattleRecord; onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center text-paper">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset('/logo.png')}
          alt=""
          width={96}
          height={96}
          className="[image-rendering:pixelated]"
        />
        <h1 className="text-[34px] leading-none tracking-wide text-[#f8d030] [text-shadow:4px_4px_0_#3060b0,-2px_-2px_0_#3060b0,2px_-2px_0_#3060b0,-2px_2px_0_#3060b0]">
          RANEMON
        </h1>
        <p className="text-[9px] leading-relaxed text-[#a8b4cc]">Your friends. Their moves.</p>
      </div>
      <button type="button" className="blink text-[13px] text-paper" onClick={onStart}>
        PRESS START
      </button>
      <div className="flex flex-col items-center gap-4 text-[8px] text-[#a8b4cc]">
        <p>
          Record: {record.wins}W · {record.losses}L
        </p>
        <Link href="/ranedex" className="underline underline-offset-4">
          RANEDEX
        </Link>
      </div>
    </div>
  );
}
