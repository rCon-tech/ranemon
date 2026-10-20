'use client';

import Link from 'next/link';
import { asset } from '@/lib/asset';
import type { BattleRecord } from '@/lib/record';

export function TitleScreen({ record, onStart }: { record: BattleRecord; onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center text-ink">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset('/gb/logo.png')}
          alt=""
          width={96}
          height={96}
          className="[image-rendering:pixelated]"
        />
        <h1 className="text-[34px] leading-none tracking-wide text-ink [text-shadow:4px_4px_0_#8bac0f,-2px_-2px_0_#306230,2px_-2px_0_#306230,-2px_2px_0_#306230]">
          RANEMON
        </h1>
        <p className="text-[9px] leading-relaxed text-frame">Your friends. Their moves.</p>
      </div>
      <button type="button" className="blink text-[13px] text-ink" onClick={onStart}>
        PRESS START
      </button>
      <div className="flex flex-col items-center gap-4 text-[8px] text-frame">
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
