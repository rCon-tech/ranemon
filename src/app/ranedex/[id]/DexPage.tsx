'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DexEntry } from '@/components/DexEntry';
import { ViewButton } from '@/components/ViewButton';
import { ROSTER } from '@/lib/battle/roster';
import { KNOW_ALL } from '@/lib/story/dex';

/**
 * Battle mode's page for one Ranemon. ◀ and ▶ (or the arrow keys) flip through the Ranedex,
 * Z or Space flips through its looks, and X or Escape goes back to the list.
 */
export function DexPage({ index }: { index: number }) {
  const router = useRouter();
  const [look, setLook] = useState(0);
  const c = ROSTER[index];
  const at = (step: number) =>
    `/ranedex/${ROSTER[(index + step + ROSTER.length) % ROSTER.length].id}`;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') router.push(at(-1));
      else if (e.key === 'ArrowRight' || e.key === 'd') router.push(at(1));
      else if (e.key === 'z' || e.key === ' ') {
        e.preventDefault();
        setLook((l) => l + 1);
      } else if (e.key === 'x' || e.key === 'Escape') router.push('/ranedex');
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <div className="-mx-3 -mt-3 flex items-center justify-between border-b-4 border-bezel bg-dex px-3 py-2 text-[18px] font-bold text-paper [text-shadow:1px_1px_0_rgb(0_0_0/0.4)]">
        <h1>RANEDEX</h1>
        <span className="flex items-center gap-3">
          <ViewButton />
          <Link href="/ranedex" className="text-[11px] underline underline-offset-4">
            BACK
          </Link>
        </span>
      </div>
      <div className="dialog p-3">
        <DexEntry
          key={c.id}
          creature={c}
          number={index + 1}
          know={KNOW_ALL}
          look={look}
          onLook={setLook}
          onStep={(step) => router.push(at(step))}
          battleMoves
        />
      </div>
    </div>
  );
}
